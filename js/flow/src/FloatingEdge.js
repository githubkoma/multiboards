/* https://reactflow.dev/examples/edges/floating-edges */
import { useCallback, useState } from 'react';
import { useStore, getBezierPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';
import { getEdgeParams } from './FloatingEdge-utils.js'
import { store } from "./store.ts";
import FlowHelper from './FlowHelper.js';
import $ from 'jquery';

function FloatingEdge({ id, source, target, markerEnd, style, selected, data }) {

  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));
  const [editPermission, setEditPermission] = useState(document.getElementById("userBoardEditPermission").value);
  const [editMode, setEditMode] = useState(false);  

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  const onClick = (event) => {    

    console.log("onClick", event);    

    switch (event.target.id) {
      case "btnDeleteEdge":   
        delete store.edges[id];
        break;

      case "btnLabelEdge":   
        setEditMode(!editMode);
        break;

      case "btnSaveLabel":       
        let updatedEdge = JSON.parse(store.edges[id]);
        let labelValue = $("#inpEdgeLabel").val().trim();
        if (labelValue == "" && updatedEdge.data.label) {
          delete updatedEdge.data.label;          
        } else {
          updatedEdge.data.label = labelValue;
        }
        store.edges[id] = JSON.stringify(updatedEdge);  
        setEditMode(false);
        break;
    }

    console.log();
    
  };

  return (
    <>
      <BaseEdge id={id} className="react-flow__edge-path" path={edgePath} markerEnd={markerEnd} style={style} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            // everything inside EdgeLabelRenderer has no pointer events by default
            // if you have an interactive element, set pointer-events: all
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        > 

          { data && data.label
            && <p style={{color: "white"}}>{FlowHelper.dotdotAfterN(data.label, 20)}</p>
          }
          { selected && editPermission && !editMode
            && <button id="btnLabelEdge" className="edgebutton" onClick={event => onClick(event)}>✏️</button>
          }
          { selected && editPermission && !editMode
            && <button id="btnDeleteEdge" className="edgebutton" onClick={event => onClick(event)}>×</button>
          }    

          { editMode && editPermission &&
            <table>
              <tr>
                <td>
                  <input id="inpEdgeLabel" defaultValue={data.label} className="nodrag nowheel" style={{backgroundColor: "black"}}></input>              
                  <button id="btnSaveLabel" onClick={event => onClick(event)}>✔️</button>
                </td>
              </tr>
            </table>
          }

        </div>
      </EdgeLabelRenderer>

    </>
    
  );
}

export default FloatingEdge;
