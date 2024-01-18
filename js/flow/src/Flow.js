import { Component } from 'react';
import ReactFlowStyled, { Controls, ControlButton, Background, applyNodeChanges, applyEdgeChanges, Panel, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import $ from 'jquery';
//import { useSyncedStore } from "@syncedstore/react"; // using observeDeep() instead
import { observeDeep } from "@syncedstore/core";
import { store, syncProvider, setSyncProviderRoom } from "./store.ts";
import FlowHelper from './FlowHelper.js';

import FloatingEdge from './FloatingEdge.js';
import FloatingConnectionLine from './FloatingConnectionLine.js';

import TextNode from './TextNode.js';
import FileNode from './FileNode.js';
import './Flow.css';

export default class Flow extends Component {

  constructor(props) {
    super(props);

    // REACTIVE PROPERTIES
    // ---
    this.state = { // change via setState({key: value}) !
      nodes: [], // ReactFlow Nodes live here
      edges: [], // ReactFlow Edges live here
      syncStore: store, // only this can be changed directly, without setState()
      numSyncUsers: 0,
      editPermission: false,            
      gotFileInitially: false, // We want to react/watch here, to trigger componentDidUpdate()
    };

  }

  // CLASS PROPERTIES
  // ---  
  nodeTypes = { text: TextNode, file: FileNode };  
  edgeTypes = { floating: FloatingEdge };    
  // https://www.freecodecamp.org/news/react-styled-components-inline-styles-3-other-css-styling-approaches-with-examples/
  customNodeStyle = { border: "1px solid", color: "white", height: 30, width: 120, "background-color": "#1E1E1E", "border-radius": "5px", "overflow-y": "auto", "overflow-x": "hidden", }; //display: "flex", }; // https://stackoverflow.com/questions/27784727/how-to-make-child-div-scrollable-when-it-exceeds-parent-height
  urlParams = "";
  fileId = null;
  shareToken = null;
  fileInfo = null;  
  fileUrl = { download: "", upload: ""}  
  fileContent = null;
  reactFlowInstance = null;
  syncProviderUrl = "";
  filledStoreInitially = false;
  gotYjsDoc = false; // YJsDoc exists even if we didnt connect to a syncRoom, but doc still takes a bit to initialize
  
  // LIFECYCLE METHODS
  // ---
  componentDidMount() {       
   
    // Load the File initially
    this.urlParams = new URLSearchParams(window.location.search);
    this.fileId = this.urlParams.get('fileId');
    this.shareToken = this.urlParams.get('shareToken');     

    var $that = this;
    this.getFileInitially(this.fileId, this.shareToken).then(function (fileInfo) {
      $that.fileInfo = fileInfo;
      $that.syncProviderUrl = document.querySelector("meta[property='mboardsSyncProviderUrl']").getAttribute("content"); // see store.ts
      if ($that.syncProviderUrl !== "") {        
        setSyncProviderRoom(fileInfo.roomId);
        syncProvider.connect();
      }
    });    

    // Fill ReactFlow on detected Changes in Store
    // https://syncedstore.org/docs/basics/example  
    observeDeep(store, () => {      
      console.log("observeDeep");
      if (this.syncProviderUrl !== "") {
        this.setState({numSyncUsers: syncProvider.awareness.states.size}); // lags behind: syncProvider.awareness.states.size
      }

      // 1) when initial file load takes very long, store could already have content (otherwise observeDeep() wouldnt have triggered)
      // so we have to prevent store getting overwritten by the initial file load (see componentDidUpdate() initial stuff)
      // 2) observeDeep only triggers when store was changed, in Contrast to componentDidUpdate(), 
      // where also like "this.state.gotFileInitially"-Change triggers the Component State 
      if (!this.filledStoreInitially) {
        this.filledStoreInitially = true;
        this.gotYjsDoc = true;           
        console.log("observeDeep", "We have a doc!", "filledStoreInitially");
      }

      this.fillNodesAndEdgesFromStore();

      // Mark that we have unsaved Changes
      $("#btnSaveMboard").css("background-color", "#eab676");

    });

    $(".react-flow__attribution").css({"background-color":"transparent"});

  };  

  componentDidUpdate(prevProps, prevState) {
    //console.log(prevProps, prevState);
    console.log("componentDidUpdate:", "Flow.js");

    // HANDLE SOME INITIAL COMPONENT STEPS:
    // AFTERWARDS THIS GETS IRRELEVANT 
    // AND DOWN THE LINE ONLY THE ReactFlow-INSTANCE AND "observeDeep()" UPDATE STUFF !
    //
    // Check on componentDidUpdate() if YJsDoc got initialized
    // Note: YJsDoc exists even if we dont connect to a syncRoom, but doc still takes a bit to initialize    
    if (!this.gotYjsDoc) {
      if (this.state.syncStore.nodes) {
        this.gotYjsDoc = true;
        console.log("componentDidUpdate", "We have a doc!");
      }
    }

    // To think about: When syncProviderUrl is set, just dont load the file into ReactFlow?!
    // Perhaps show a loading spinner, or switch to "singleplayer mode" after a while?!
    // Or perhaps treat it differently, YJsDoc but no providerUrl vs. YJsDoc WITH providerUrl

    //console.log(this.gotYjsDoc, Object.keys(this.state.syncStore.nodes).length,this.filledStoreInitially, this.state.gotFileInitially);
    //console.log(syncProvider.synced, syncProvider.wsconnected, syncProvider.awareness.states.size);

    // After the YJsDoc appears, the store gets synced and if no one else already
    // added/changed something in the synced Doc, we fill it with the Nodes and Edges from File
    if (this.gotYjsDoc && (Object.keys(this.state.syncStore.nodes).length == 0) // on empty store or 0 nodes
        && !this.filledStoreInitially && this.state.gotFileInitially) {      
      // Nothing in store YET?! -> Import from file
      // BUT: When "observeDeep" triggers, it will overwrite Nodes+Edges almost immediately,
      //      like when syncStore comes online just a few moments later!!
      console.log("setting nodes+edges from file");
      let arrNodes = [];    
      let arrEdges = [];  
      [arrNodes, arrEdges] = FlowHelper.mapFileSyntaxToFlowSyntax(JSON.parse(this.fileContent));              

      console.log("componentDidUpdate", "filledStoreInitially");
      this.filledStoreInitially = true; // set this before the store changes, otherwise they would trigger "observeDeeps filledStoreInitially"
      arrNodes.forEach(element => {      
        this.state.syncStore.nodes[element.id] = JSON.stringify(element);
      });
      arrEdges.forEach(element => {            
        this.state.syncStore.edges[element.id] = JSON.stringify(element);
      });
            
    }    
  }  

  componentWillUnmount() {   
    if (this.syncProviderUrl !== "") {
      // Disconnect from SyncedStore Provider
      console.log("disconnecting syncProvider");
      syncProvider.disconnect(); 
    }
  }

  // CLASS METHODS
  // ---
  uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  fillNodesAndEdgesFromStore() {
    var tmpNodesArray = [];
    Object.values(this.state.syncStore.nodes).forEach(element => {      
      tmpNodesArray.push(JSON.parse(this.state.syncStore.nodes[JSON.parse(element).id]));
    });
    //console.log(tmpNodesArray);      
    this.setState({nodes: tmpNodesArray});    
    
    var tmpEdgesArray = [];
    Object.values(this.state.syncStore.edges).forEach(element => {      
      tmpEdgesArray.push(JSON.parse(this.state.syncStore.edges[JSON.parse(element).id]));
    });
    //console.log(tmpEdgesArray);      
    this.setState({edges: tmpEdgesArray});    
  }

 async getFileInitially(id, shareToken) {
    var $that = this;
    var fileInfo = await FlowHelper.getFileInfo(id, shareToken);    
    if (shareToken) {
      this.fileUrl.download = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/s/" + shareToken + "/download";
      this.fileUrl.upload = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/multiboards/file/save?fileId=" + id + "&shareToken=" + shareToken;

    } else {
      let webDavFilePath = fileInfo.filePath.replace(/\/files\//, '/'); // before: "/admin/files/1 b/peter.mboard" after: "/admin/1 b/peter.mboard"    
      this.fileUrl.download = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/remote.php/dav/files" + webDavFilePath;
      this.fileUrl.upload = this.fileUrl.download;
    }   

    if ( (fileInfo.permissions > 1 && fileInfo.permissions < 16) ||  
         (fileInfo.permissions > 17) ) 
     {
      this.state.editPermission = true;
      document.getElementById("userBoardEditPermission").value = true;
    }       
    this.getFile(fileInfo).then(function() {
      $that.setState({gotFileInitially: true});
      console.log("got file initially");            
    });
    return fileInfo;
  }

  async getFile(fileInfo) {
    var $that = this;     
    let result = await $.ajax({
        url: $that.fileUrl.download, 
        method: 'GET', 
        headers: {"requesttoken": window.oc_requesttoken}, 
        success: function (data) {            
            $that.fileContent = data;
        },
    })
    return result;

  }  

  onClick(event) {
    console.log("onClick", event);     

    switch (event.target.id) {
      case "btnNewTextNode":
        var newTextNode = { id: this.uuidv4(), data: { text: "" }, position: { x: 0, y: 0 }, type: "text", style: this.customNodeStyle };
        this.state.syncStore.nodes[newTextNode.id] = JSON.stringify(newTextNode);                                             
        this.setState({nodes: this.state.nodes.concat(newTextNode)})
        //console.log(this.state.syncStore.nodes, this.state.syncStore.nodes.length, this.state.nodes);                
        break;

      case "btnNewFileNode":        
        //console.log(this.state.syncStore.nodes, this.state.syncStore.nodes.length, this.state.nodes);                

        var $that = this;
        window.OC.dialogs.filepicker( 'Choose a Document',
          async function(filePath) {
            console.log("File picked: ", filePath);            
            var fileInfo = await FlowHelper.getFileInfoByPath(filePath);

            var newFileNode = { id: $that.uuidv4(), data: { fileId: fileInfo.fileId, ncShareToken: "" }, position: { x: 0, y: 0 }, type: "file", style: $that.customNodeStyle };            
            newFileNode.style.width = 300;
            newFileNode.style.height = 180;

            // did this file already have a ncShareToken? Carry it over
            Object.values($that.state.syncStore.nodes).every(element => {
              var node = JSON.parse(element);
              if (node.type == "file" && (node.data.fileId == fileInfo.fileId)) {                              
                newFileNode.data.ncShareToken = node.data.ncShareToken;                
                return false; // breaks out of the every-loop
              }
              return true; // continues the every-loop
            });
            
            $that.state.syncStore.nodes[newFileNode.id] = JSON.stringify(newFileNode);                                             
            $that.setState({nodes: $that.state.nodes.concat(newFileNode)})           
          }, false, ["application/pdf", "image/*", "text/markdown"], true ); // "image/*" "application/pdf"

        break;

      case "btnSaveMboard":
        var fileContent = FlowHelper.mapFlowSyntaxToFileSyntax(this.state.syncStore.nodes, this.state.syncStore.edges);

        var $that = this;
        $.ajax({
          url: $that.fileUrl.upload,
          method: 'PUT', 
          headers: {"requesttoken": window.oc_requesttoken}, 
          data: ($that.shareToken) ? JSON.stringify({"fileContent": JSON.stringify(fileContent)}): JSON.stringify(fileContent), 
          contentType: ($that.shareToken) ? "application/json" : "application/x-mboard",
          success: function () {          
            window.OC.dialogs.message("Save successful", "Success");
            $that.fileContent = JSON.stringify(fileContent);
            $("#btnSaveMboard").css("background-color", "");
          },
          error: function (e) {
            window.OC.dialogs.message("Error", "Not Saved") 
          }
        })
        break;

      case "btnReset":              
        var $that = this;
        window.OC.dialogs.confirm("RESET the document to the state YOU opened / last saved it?", "RESET Document?", 
        function(choice) {          
          if (choice == true) {

            for (let key in $that.state.syncStore.nodes) {                
              delete $that.state.syncStore.nodes[key];
            }
            let [arrNodes, arrEdges] = FlowHelper.mapFileSyntaxToFlowSyntax(JSON.parse($that.fileContent));                  
            arrNodes.forEach(element => {                                               
              $that.state.syncStore.nodes[element.id] = JSON.stringify(element); }
            );
            
            for (let key in $that.state.syncStore.edges) {                
              delete $that.state.syncStore.edges[key];
            }            
            arrEdges.forEach(element => {                                               
              $that.state.syncStore.edges[element.id] = JSON.stringify(element); }
            );
            $("#btnSaveMboard").css("background-color", "");    
            
          }
        }, false)
        break;

      case "btnTest":
        console.log(syncProvider);                
        fileContent = FlowHelper.mapFlowSyntaxToFileSyntax(this.state.syncStore.nodes, this.state.syncStore.edges);             
        console.log("fileContent:", FlowHelper.mapFileSyntaxToFlowSyntax(fileContent));
        console.log("this.state:", this.state.nodes, this.state.edges)
        break;      

        case "btnFitViewport":                       
          var arrResult = this.state.nodes.filter(node => {
            return node.selected === true
          }) // https://reactflow.dev/api-reference/types/fit-view-options
          if (arrResult.length == 0) {
            this.reactFlowInstance.fitView(this.state.nodes);
          } else {
            this.reactFlowInstance.fitView({nodes: arrResult, duration: 800, minZoom: 1, maxZoom: 100});
          }             
          break;     
    
      default:
        break;
    }
  }

  render() {    
    // HOOKS
    // ---    
    // NODE CHANGES:
    const onNodesChange = (changes) => { // like "selected" 
      //console.log("node changes:", changes);      
      this.setState({nodes: applyNodeChanges(changes, this.state.nodes)})

      changes.forEach(change => {
        // when NODE DRAGGING, RESIZING complete
        if ((Object.hasOwn(change, "dragging") && change.dragging == false)
            || (Object.hasOwn(change, "resizing") && change.resizing == false)
           ){
          
          this.state.nodes.forEach(element => {            
            this.state.syncStore.nodes[element.id] = JSON.stringify(element);          
          });  
          // also preserve edges, e.g. after file-load syncStore could be empty,
          // while flownodes and -edges filled, but edges be overwritten by empty syncStore
          this.state.edges.forEach(element => {            
            this.state.syncStore.edges[element.id] = JSON.stringify(element);          
          });  
    
        }

        // when NODE SELECTED
        if (Object.hasOwn(change, "selected")) {    
          //console.log(this.state.syncStore.nodes, JSON.stringify(this.state.nodes))
        }                  

      });

    };   

    // EDGE CHANGES:
    // ---
    const onConnect = (rawEdge) => {             
      var newEdge = rawEdge;        
      newEdge.id = this.uuidv4();            
      newEdge.type = "floating";
      newEdge.data = { label: null };      
      this.setState({edges: this.state.edges.concat(newEdge)});      
      this.state.syncStore.edges[newEdge.id] = JSON.stringify(newEdge);                
    }
    const onEdgesChange = (changes) => { // like "selected"
      //console.log("edge changes:", changes);
      this.setState({edges: applyEdgeChanges(changes, this.state.edges)})      
    }    
    // https://reactflow.dev/api-reference/types/react-flow-instance
    const onInit = (reactFlowInstance) => {       
      this.reactFlowInstance = reactFlowInstance;      
    };

    return (
      <div style={{ height: '100%' }} id="divFlowJsApp">
        <ReactFlowStyled
          style={{"background-color": "#171717"}}
          nodes={this.state.nodes}        
          edges={this.state.edges}               
          onNodesChange={onNodesChange}          
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          nodeTypes={this.nodeTypes}
          edgeTypes={this.edgeTypes}
          elementsSelectable={true}
          nodesDraggable={this.state.editPermission}
          nodesConnectable={this.state.editPermission}
          connectionMode={"loose"}
          connectionRadius={30}
          connectionLineComponent={FloatingConnectionLine}                
          snapToGrid={true} 
          snapGrid={[10, 10]}          
          fitView
        >
          <Background />
          <Controls showInteractive={this.state.editPermission} />            
          <Panel position="top-right">
            { (this.state.editPermission)
              && <button id="btnSaveMboard" onClick={event => this.onClick(event)}>💾</button>
            }
            { (this.state.editPermission)
              && <button id="btnReset" onClick={event => this.onClick(event)}>↺</button>
            }
            { this.state.numSyncUsers > 0
              && <button id="btnTest" onClick={event => this.onClick(event)}>{this.state.numSyncUsers}</button>
            }
            <button onClick={() => {window.history.back()}}>X</button>            
          </Panel>
          <Panel position="bottom-center">           
            { (this.state.editPermission)
              && <button id="btnNewTextNode" onClick={event => this.onClick(event)}>🧾</button>               
            }
            { (this.state.editPermission && window.OC.currentUser)
              && <button id="btnNewFileNode" onClick={event => this.onClick(event)}>🗃️</button>               
            }
            <button hidden id="btnFitViewport" onClick={event => this.onClick(event)} />              
          </Panel>
        </ReactFlowStyled>
      </div>
    );
  }
}