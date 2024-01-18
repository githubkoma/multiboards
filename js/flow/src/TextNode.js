import React, { Component } from 'react'
import { Handle, Position, NodeResizeControl, NodeToolbar } from 'reactflow';
import $ from 'jquery';
import { store } from "./store.ts";
import MarkDownComponent from './MarkDownComponent.js';
//import { forEach } from 'core-js/core/array';
import 'jquery.scrollto'

class TextNode extends Component {
  constructor(props) {
    super(props); // e.g. this.props.selected
    console.log("props:", props);

    // REACTIVE PROPERTIES:
    // ---
    this.state = { 
      //syncStore: store, // only this can be changed directly, without setState()
      md: props.data.text,
      editPermission: true,
      editMode: false,
      syncStore: store, // only this can be changed directly, without setState()
    };
  }

  // CLASS PROPERTIES
  // ---  

  // LIFECYCLE METHODS
  // ---
  componentWillMount() { 
    this.setState({editPermission: document.getElementById("userBoardEditPermission").value});
  }
  
  onChangeInput(event) {
    console.log("onChange", event);    
  }

  // CLASS METHODS:
  // ---
  onClick(event) {
    console.log("onClick", event);

    switch (event.target.id) {
      case "btnSaveText":                   
        let updatedNode = JSON.parse(this.state.syncStore.nodes[this.props.id]);
        updatedNode.data.text = $("#inpNodeText").val();
        this.state.syncStore.nodes[this.props.id] = JSON.stringify(updatedNode);
        this.setState({editMode: false});
        break;

      case "btnZoomToNode":                           
        $("#btnFitViewport").click();
        break;

      case "btnDeleteNode":
        let $that = this;
        window.OC.dialogs.confirm("REMOVE Node?", "Confirm", 
         function(choice) {          
          if (choice == true) {
            $that.deleteNode();
          }
         }, false)
        break;

      case "btnEnterEditMode":
        this.setState({editMode: true})
        break;

      case "btnScrollUp":
        event.stopPropagation();        
        event.preventDefault();      
        event.bubbles = false;  
        $('*[data-id="'+this.props.id+'"]').scrollTo("-=25");
        break;

      case "btnScrollDown":
        event.stopPropagation();
        event.preventDefault();        
        event.bubbles = false;
        $('*[data-id="'+this.props.id+'"]').scrollTo("+=25");
        break;
    
      default:
        break;
    }

  }

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

  render() {

    //let { md } = this.state    

    const controlStyle = {
      background: 'transparent',
      border: 'none',      
    };

    //<div style={{...pStyle, color: "red"}}>    

    // MARKDOWN:
    // https://react.dev/reference/react-dom/components/textarea
    // PARENT STATE?
    // https://www.tutorialspoint.com/how-to-set-parent-state-from-children-component-in-reactjs
    return (      
      <>        
        <NodeToolbar isVisible={this.props.selected} position={"bottom"}>
          { this.state.editPermission && 
            <NodeResizeControl style={{...controlStyle}} minWidth={100} minHeight={30}>
              <br /><br />
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

        <NodeToolbar isVisible={this.props.selected} position={"right"}>
          <table>
            <tr>
              <button id="btnScrollUp" onClick={event => this.onClick(event)} style={{background: "transparent", "border-color": "transparent", color: "white", "margin-left": "-45px"}}>↑</button>
            </tr>
            <tr>
              <button id="btnScrollDown" onClick={event => this.onClick(event)} style={{background: "transparent", "border-color": "transparent", color: "white", "margin-left": "-45px"}} >↓</button>
            </tr>
          </table>
        </NodeToolbar>

        <MarkDownComponent md={this.props.data.text} onClick={event => this.onClick(event)}></MarkDownComponent>        

        <NodeToolbar isVisible={this.props.selected} position={"top"}>
          <table>
            <tr>
              <td>                
              { !this.state.editMode
                && <button id="btnZoomToNode" onClick={event => this.onClick(event)}>🔎</button>
              }
              { !this.state.editMode && this.state.editPermission      
                && <button id="btnEnterEditMode" onClick={event => this.onClick(event)}>✏️</button>
              }
              { !this.state.editMode && this.state.editPermission
                && <button id="btnDeleteNode" onClick={event => this.onClick(event)}>🗑️</button>
              }
              </td>
              <td>
              { this.state.editMode && this.state.editPermission
                && <textarea id="inpNodeText" defaultValue={this.props.data.text} className="nodrag nowheel" rows="3" style={{width: "200px", "overflow-y": "scroll", backgroundColor: "black"}}></textarea>              
              }
              { this.state.editMode && this.state.editPermission
                && <button id="btnSaveText" onClick={event => this.onClick(event)}>✔️</button>
              }
              </td>
            </tr>
          </table>
          
        </NodeToolbar>
        <Handle type="source" position={Position.Left} />        
      </>
    )
  }
}

export default TextNode
