import React, { Component } from 'react'
import { Handle, Position, NodeResizeControl, NodeToolbar } from 'reactflow';
import { store } from "./store.ts";
import $ from 'jquery';
import FlowHelper from './FlowHelper.js';
import MarkDownComponent from './MarkDownComponent.js';
import 'jquery.scrollto'

//import ReactDOM from 'react-dom';
import Modal from 'react-modal';

class FileNode extends Component {
  constructor(props) {
    super(props); // e.g. this.props.selected
    console.log("props:", props);

    // REACTIVE PROPERTIES:
    // ---
    this.state = {       
      editPermission: true,
      //editMode: false,
      syncStore: store, // only this can be changed directly, without setState()
      fileInfo: null,      
      chooseSubpathMode: false,
      fileContentToShow: null,
      modalIsOpen: false,  
      nodeActionMenu: 0,    
    };
  }

  // CLASS PROPERTIES
  // ---  
  modalStyle = {
    content: {
      top: '50%', left: '50%',
      right: 'auto', bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: "95%", height: "80%",
      background: "black",
    },
  };  
  fileContent = null;
  NodeSubpaths = [];
  urlParams = "";
  cfgPdfPreview = false;

  // LIFECYCLE METHODS
  // ---
  componentWillMount() {    
    //console.log(this);
    this.urlParams = new URLSearchParams(window.location.search);    
    var $that = this;        
    var neededShareToken = (this.urlParams.get('shareToken')) ? this.props.data.ncShareToken : null;
    FlowHelper.getFileInfo(this.props.data.fileId, neededShareToken).then(function(result) {            
      $that.setState({fileInfo: result}); 
      let fileInfo = result;
      if (fileInfo.mimeType.includes("text/markdown")) {
        $that.getFileContent(fileInfo).then(function(result) { 
          $that.setState({fileContentToShow: $that.extractFileContentToShow($that.props.data.subpath)});          
        });
      }
      
    }).catch(error => console.log("ajax error", error));

    this.setState({editPermission: document.getElementById("userBoardEditPermission").value});    

    this.cfgPdfPreview = document.querySelector("meta[property='mboardsPdfPreview']").getAttribute("content");    
    if (this.cfgPdfPreview == "true") {
      this.getPdfPreviewFromLocalStorage();
      console.log(this.getPdfPreviewFromLocalStorage());
    }

    Modal.setAppElement('#app-content');
  }
  
  componentWillUpdate(event) {
    //console.log("componentWillUpdate", event);        
  }

  // CLASS METHODS:
  // ---
  deleteNode() {
    console.log("Confirmed to delete node");            
    delete this.state.syncStore.nodes[this.props.id];
    // deleted connected edges:
    Object.values(this.state.syncStore.edges).forEach(element => {            
      var objElement = JSON.parse(element);
      if (objElement.source == this.props.id || objElement.target == this.props.id) {        
        delete this.state.syncStore.edges[objElement.id];
      }
    });      
  }

  buildFileContentsUrl(fileId) {    
    //console.log("buildFileContentsUrl", this.state.fileInfo);
    let url = "";
    // When "?shareToken=xyz" is in URL, only use the PublicShare Information, even if user is logged in
    if (this.urlParams.get('shareToken') && this.props.data.ncShareToken) {
      url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/s/" + this.props.data.ncShareToken + "/download";
    } else {
      url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/multiboards/file/load?fileId=" + fileId;
    }
    //console.log(url);
    return url;
  }

  buildIFrameUrl(fileInfo) {   
    //console.log("buildIFrameUrl", this.state.fileInfo);    
    let url = "";
    // When "?shareToken=xyz" is in URL, only use the PublicShare Information, even if user is logged in
    if (this.urlParams.get('shareToken') && this.props.data.ncShareToken) {
      url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/s/" + this.props.data.ncShareToken;
    } else {
      // before: "/userX/files/folder Y/FileABC.png" after: "/folder Y/FileABC.png"
      var dir = fileInfo.filePath.replace("/"+window.OC.currentUser+"/files", "");
      // before: "/folder Y/FileABC.png" after: "/folder Y"
      dir = dir.replace("/"+fileInfo.fileName, "");   
      if (dir == "") { dir = "/"; }
      if (window.OC.config.version.substring(0,2) < 28) {
        url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/files/?dir=" + encodeURIComponent(dir) + "&openfile=" + fileInfo.fileId;
      } else {
        url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/files/files/" + fileInfo.fileId + "?dir=" + encodeURIComponent(dir) + "&openfile=true";
      }      
    }    
    return url;
  }  

  async getFileContent(fileInfo) {
    var fileContentsUrl = this.buildFileContentsUrl(fileInfo.fileId);
    var $that = this;     
    let result = await $.ajax({    
        url: fileContentsUrl, 
        method: 'GET', 
        headers: {"requesttoken": window.oc_requesttoken}, 
        success: function (data) {
            //console.log("got fileContents successfully:", fileContentsUrl);                                  
            $that.fileContent = data;         
            //console.log($that.NodeSubpaths);                 
        },
        error: function (error) {
          console.log("Error", error);
        }
    })    
    return result;
  }

  afterOpenModal() {
    console.log("afterOpenModal");
    $(".ReactModal__Overlay").css({"background-color": "transparent"});    
  }

  extractFileContentToShow(headingString) {    
    //console.log("extracting:", headingString);       
    if (headingString == "ALL" || headingString == "" || headingString == null) {
      return this.fileContent;
    } else {
      //var re = new RegExp(headingString+'\n(.*?)#','su'); u=ungreedy
      // see https://regex101.com/; e.g. u=ungreedy, \n#[^#] = until next # (Heading), but not followed by second #
      // doesnt work when ## Heading follows another ##: var re = new RegExp('('+headingString+'.*?)\n#[^#]','su'); // look between Headings 
      var re = new RegExp(headingString+'(.*?)\n#','su'); // look between Headings 
      var match = re.exec(this.fileContent);              
      var contentBetweenHeadings = "";
      if (match) {
        contentBetweenHeadings = match[1]; // get first Capture Group
      } else { // Perhaps end of file: try again without ending hash
        var re = new RegExp(headingString+'(.*?$)','su'); 
        var match = re.exec(this.fileContent);
        contentBetweenHeadings = (match ? match[1] : "")  
      }           

      return contentBetweenHeadings;      
    }
  }

  whoIsWorking(me) {
    console.log(me, "is working right now");
    return true;
  }

  async deleteFileShare() {
    var $that = this;
    var url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json";
    // We need to get the share's (int) id first, not only the sharetoken..
    $.ajax({ url: url, method: 'GET', headers: {"requesttoken": window.oc_requesttoken},
      success: function (result) {                   
        if (result.ocs.data.length == 0) {
          window.OC.dialogs.message("Share not removed, was it shared by someone else?", "Error");
        } else {
          let boardFileId = new URLSearchParams(window.location.search).get('fileId');                                    
          result.ocs.data.forEach(share => {                    
            if (share.label?.startsWith("mboardsPub") && share.can_delete) {
              let arrShareLabelInfo = share.label.split('_');                        
              if (arrShareLabelInfo[1] ==  boardFileId && arrShareLabelInfo[2] == $that.state.fileInfo.fileId) {
                console.log("delete this share", arrShareLabelInfo);

                var url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/ocs/v2.php/apps/files_sharing/api/v1/shares/" + share.id;
                $.ajax({ url: url, method: 'DELETE', headers: {"requesttoken": window.oc_requesttoken},
                  error: function(e) {
                    window.OC.dialogs.message("Error", "Share not removed");
                  },
                  success: function(result) {
                    console.log("share deleted");  
                    // Delete all occurrences of this shareToken
                    Object.values($that.state.syncStore.nodes).forEach(element => {
                      var node = JSON.parse(element);
                      if (node.type == "file" && (node.data.fileId == $that.state.fileInfo.fileId)) {                              
                        delete node.data.ncShareToken;
                        $that.state.syncStore.nodes[node.id] = JSON.stringify(node);
                      }
                    });   
                    $("#btnSaveMboard").click();                           
                  }                        
                });
              }
            }                      
          });                  
        }
      }
    });   
  }

  getPdfPreviewFromLocalStorage() {
    var blob = localStorage.getItem("pdfPreviewFileNode-"+this.props.id);
    let file = new File([blob], "pdfPreviewFileNode-"+this.props.id+".jpg", { type: 'image/jpeg' });
    
    var $that = this;
    file.arrayBuffer().then(
      function (result) {
        console.log("done", result);
        var imgElm = document.getElementById("pdfPreviewFileNode-"+$that.props.id);
        //imgElm.src = "test";
        console.log(imgElm);
        //const buffer = new Buffer.from(result);
        //const base64String = buffer.toString('base64');
        //console.log(base64String);
        var binary = '';
        var bytes = new Uint8Array( result );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        console.log(binary);
        console.log(btoa(binary));
        $("#pdfPreviewFileNode-"+$that.props.id).attr('src', "data:image/jpeg;base64," + btoa(binary));
      } 
    );    
    
    return;  
  }

  onClick(event) {
    console.log("onClick", event);
    let $that = this;

    switch (event.target.id) {
      case "btnTest":                   
        console.log(this.state.fileInfo);  
        //this.cleanupNcIframe();        
        //console.log(this.getFileContent(this.state.fileInfo));       
        console.log(window.OC.currentUser);
        break;

      case "btnNodeActionMenuSwitcher":
        if (this.state.nodeActionMenu == 1) {
          this.setState({nodeActionMenu: 0});
        } else {
          this.setState({nodeActionMenu: this.state.nodeActionMenu + 1});
        }
        break;

      case "btnZoomToNode":                           
        $("#btnFitViewport").click();
        break;
    
      case "btnDeleteNode":        
        window.OC.dialogs.confirm("REMOVE Node?", "Confirm", 
          function(choice) {          
          if (choice == true) {
            $that.deleteFileShare();
            $that.deleteNode();
          }
          }, false)
        break;

      case "btnOpenDoc":                   
        //window.open(this.buildIFrameUrl(this.state.fileInfo), "_blank");
        this.setState({modalIsOpen: true});
        break;

      case "btnCloseDoc":
        if (this.state.fileInfo && this.state.fileInfo.mimeType.includes("text/markdown")) {          
          this.getFileContent(this.state.fileInfo).then(function(result) {                         
            $that.setState({fileContentToShow: $that.extractFileContentToShow($that.props.data.subpath)});
          });
        }
        this.setState({modalIsOpen: false});
        break;

      case "btnScrollUp":
        event.stopPropagation();
        $('*[data-id="'+this.props.id+'"]').scrollTo("-=25");
        break;

      case "btnScrollDown":
        event.stopPropagation();
        $('*[data-id="'+this.props.id+'"]').scrollTo("+=25");
        break;
    
      case "btnShareNode":
        var expireDate = new Date();        
        expireDate.setDate(expireDate.getDate() + 180); // limit to 180 days
        expireDate = expireDate.toISOString().substring(0,10); // -> e.g. "2024-06-31"
        if (!this.props.data.ncShareToken) {
          window.OC.dialogs.confirm("Share publically?", "Share Node", 
          function(choice) {          
            if (choice == true) {
              var url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json";      
              var path = $that.state.fileInfo.filePath.replace("/"+window.OC.currentUser+"/files", ""); // before: "/userX/files/folder Y/FileABC.png" after: "/folder Y/FileABC.png"        
              $.ajax({ url: url, method: 'POST', 
                headers: {"requesttoken": window.oc_requesttoken}, contentType: "application/json",
                // https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html            
                data: JSON.stringify({"shareType": 3, "path": path, "label": "mboardsPub_" + new URLSearchParams(window.location.search).get('fileId') + "_" + $that.state.fileInfo.fileId, "expireDate": expireDate}), //, "attributes": '[{"scope":"permissions","key":"download","enabled":false}]'}),
                error: function (e) {
                  window.OC.dialogs.message("Error", "Not Shared") 
                }
              }).then(function (result) {
                console.log("share success", result);
                // also use this shareToken for multiple occurences of this exact fileId
                Object.values($that.state.syncStore.nodes).forEach(element => {
                  var node = JSON.parse(element);
                  if (node.type == "file" && (node.data.fileId == $that.state.fileInfo.fileId)) {
                    node.data.ncShareToken = result.ocs.data.token;
                    $that.state.syncStore.nodes[node.id] = JSON.stringify(node);
                  }
                });
                $("#btnSaveMboard").click();

              });

          }}, false);

        } else {
          window.OC.dialogs.confirm("Remove Share?", "Already Shared", 
          function(choice) {          
            if (choice == true) {
              $that.deleteFileShare();                        
          }}, false);
        }
        break;

      case "btnChooseSubpathMode":        
        var str = this.fileContent;
        $that.NodeSubpaths = [];
        $that.NodeSubpaths.push("ALL"); // to show all of Files Content
        var re = new RegExp("(#.*?)\n", ""); // Find First Heading at File's Top
        var match = str.match(re);
        if (match) { $that.NodeSubpaths.push(match[0]); }
        var re2 = new RegExp("\n(#.*?)\n", "g"); // Find following Headings
        var matches = [];
        var i = 1;        
        while(matches = re2.exec(str)) {                              
          $that.NodeSubpaths.push(matches[1]);
        }        
        this.setState({chooseSubpathMode: !this.state.chooseSubpathMode});
        break;

      case "btnNodeSubpathChosen":
        let headingString = $('#selectNodeSubpaths-' + this.props.id + ' option:selected').text();                        

        let updatedNode = JSON.parse(this.state.syncStore.nodes[this.props.id]);
        if (headingString == "ALL" 
            || (headingString == "ALL" && updatedNode.data.subpath))
        {
          delete updatedNode.data.subpath;
        } else {
          updatedNode.data.subpath = headingString;          
        }
        this.state.syncStore.nodes[this.props.id] = JSON.stringify(updatedNode);        
        this.setState({fileContentToShow: $that.extractFileContentToShow(headingString)});          
        this.setState({chooseSubpathMode: false});        
        break;

      case "btnLoadPdfPreview":       
          var url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/multiboards/file/pdfPreview?fileId=" + this.props.data.fileId;
          $.ajax({ url: url, method: 'GET', headers: {"requesttoken": window.oc_requesttoken}, 
            success: function(data) { 
              console.log(data); 
              localStorage.setItem("pdfPreviewFileNode-"+$that.props.id, data);
              console.log(localStorage.getItem("pdfPreviewFileNode-"+$that.props.id));
          }});
        break;

      default:
        break;
    }

  }

  render() {

    const controlStyle = {
      background: 'transparent',
      border: 'none',      
    };

    const onResizeEnd = (parms) => { // like "selected" 
      //console.log(parms);      
      var thisFileNodeContent = $("#fileNodeContent-"+this.props.data.fileId);
      //$(thisFileNodeContent).height($(thisFileNodeContent).parent().height());
      //$(thisFileNodeContent).width($(thisFileNodeContent).parent().width());
    }

    return (      
      <>
        <NodeToolbar isVisible={this.props.selected} position={"top"}>
          <table>
            <tr>
              { this.state.nodeActionMenu == 0 
                && this.props.selected
                && <button id="btnZoomToNode" onClick={event => this.onClick(event)}>🔎</button>
              }              
              { this.state.nodeActionMenu == 0 
                && ((window.OC.currentUser && this.state.fileInfo)
                || this.urlParams.get('shareToken') && this.props.data.ncShareToken) 
                && <button id="btnOpenDoc" onClick={event => this.onClick(event)}>📝</button>
              }
              { this.state.nodeActionMenu == 1
                && this.state.fileInfo && this.state.fileInfo.mimeType.includes("text/markdown")
                && this.state.editPermission
                && <button id="btnChooseSubpathMode" onClick={event => this.onClick(event)}>🔖</button>
              }
              { this.state.nodeActionMenu == 1
                && this.state.editPermission && window.OC.currentUser 
                && <button id="btnShareNode" onClick={event => this.onClick(event)} >🌐</button>
              }              
              { this.state.nodeActionMenu == 1
                && this.state.editPermission
                && <button id="btnDeleteNode" onClick={event => this.onClick(event)} >🗑️</button>
              }
              <button id="btnNodeActionMenuSwitcher" onClick={event => this.onClick(event)} >⋯</button>
              { false && this.state.editPermission && window.OC.currentUser
                && <button id="btnTest" onClick={event => this.onClick(event)}>i</button>
              }
            </tr>

            <tr>
              { this.state.chooseSubpathMode && this.whoIsWorking("subpath") &&
                <select id={"selectNodeSubpaths-"+this.props.id}>
                  {this.NodeSubpaths.map((NodeSubpath,index) => 
                    <option key={index}>{NodeSubpath}</option> 
                  )}
                </select>     
              }
              { this.state.chooseSubpathMode 
                && <button id="btnNodeSubpathChosen" onClick={event => this.onClick(event)} >✔️</button>
              }
            </tr>
          </table>          
        </NodeToolbar>

        <NodeToolbar isVisible={this.props.selected} position={"right"}>
          <table>
            <tr>
              <button id="btnScrollUp" onClick={event => this.onClick(event)} style={{background: "transparent", "border-color": "transparent", color: "white", "margin-left": "-45px", "margin-bottom": "-5px"}}>↑</button>
            </tr>
            <tr>
              <button id="btnScrollDown" onClick={event => this.onClick(event)} style={{background: "transparent", "border-color": "transparent", color: "white", "margin-left": "-45px", "margin-top": "-5px"}}>↓</button>
            </tr>
          </table>
        </NodeToolbar>

        <NodeToolbar isVisible={this.props.selected} position={"bottom"}>
          { this.state.editPermission && 
            <NodeResizeControl style={{...controlStyle}} onResizeEnd={onResizeEnd} minWidth={100} minHeight={30}>
              <br />&nbsp;<br />
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                viewBox="0 0 24 24" strokeWidth="1"
                stroke={this.props.selected ? "white" : "transparent"}
                fill="none" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', top: 1 }}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" /> <polyline points="16 20 20 20 20 16" />
                <line x1="14" y1="14" x2="20" y2="20" /> <polyline points="8 4 4 4 4 8" /> <line x1="4" y1="4" x2="10" y2="10" />
              </svg>
            </NodeResizeControl>  
          }
        </NodeToolbar>

        { ((!this.state.fileInfo && !this.props.data.ncShareToken) ||
          (!this.state.fileInfo && this.props.data.ncShareToken && window.OC.currentUser))
          && <p>ℹ️ Content not loaded. Perhaps it isn't shared with you, or is deleted, or else.</p>
        }        

        { 
          !this.state.modalIsOpen && this.state.fileInfo 
          && <p><code><i>{FlowHelper.dotdotAfterN(this.state.fileInfo.fileName, 32)} {FlowHelper.dotdotAfterN(this.props.data.subpath, 42)}</i></code></p>
        } 

        { this.state.fileInfo && (this.state.fileInfo.mimeType.includes("image/")) &&           
          <img id={"fileNodeContent-"+this.props.data.fileId} src={this.buildFileContentsUrl(this.props.data.fileId)} title="" style={{position: "relative", width: "100%", }}></img> 
        }  

        { !this.state.modalIsOpen && this.state.fileInfo && (this.state.fileInfo.mimeType.includes("text/markdown")) &&                     
          <div style={{margin: "10px"}}>  
            <MarkDownComponent md={this.state.fileContentToShow} fileInfo={this.state.fileInfo}></MarkDownComponent>
          </div>
        }      

        { !this.state.modalIsOpen && this.state.fileInfo && (this.state.fileInfo.mimeType.includes("application/pdf")) &&                     
          <span>            
            No PDF Content Preview, open the file with 📝.

            { this.cfgPdfPreview == "true" && window.OC.currentUser
              && <button id="btnLoadPdfPreview" onClick={event => this.onClick(event)}>Load PDF Preview</button>
            }            
          </span>
        }  
        { this.cfgPdfPreview == "true" && window.OC.currentUser
          && <img id={"pdfPreviewFileNode-"+this.props.id}></img>
        } 
                
        <Handle type="source" position={Position.Left} />
        
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          //onRequestClose={closeModal} // -> "btnCloseDoc"
          style={this.modalStyle}
          contentLabel="Example Modal"
        >          
          <button id="btnCloseDoc" onClick={event => this.onClick(event)}>close</button>          

          { (this.state.fileInfo)            
            && <iframe id={"fileNodeContent-"+this.props.data.fileId} src={this.buildIFrameUrl(this.state.fileInfo)} title="" style={{position: "relative", height: "100%", width: "100%", }}></iframe> 
          }      

        </Modal>

      </>
    )
  }
}

export default FileNode
