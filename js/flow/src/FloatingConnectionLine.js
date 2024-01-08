/* https://reactflow.dev/examples/edges/floating-edges */
import React from 'react';
import { getBezierPath } from 'reactflow';

import { getEdgeParams } from './FloatingEdge-utils.js';

function FloatingConnectionLine({ toX, toY, fromPosition, toPosition, fromNode }) {
  if (!fromNode) {
    return null;
  }

  const targetNode = {
    id: 'connection-target',
    width: 1,
    height: 1,
    positionAbsolute: { x: toX, y: toY }
  };

  const { sx, sy } = getEdgeParams(fromNode, targetNode);
  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    targetX: toX,
    targetY: toY
  });

  return (
      <g>
        <path
            fill="none"
            stroke="#fff"
            strokeWidth={1.0}
            className="animated"
            d={edgePath}
        />
        <circle
            cx={toX}
            cy={toY}
            fill="#fff"
            r={3}
            stroke="#fff"
            strokeWidth={1.0}
        />
      </g>
  );
}

export default FloatingConnectionLine;
