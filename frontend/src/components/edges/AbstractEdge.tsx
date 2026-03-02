import {
  BaseEdge,
  Edge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react';
import { getEdgeParams } from '../utils/calculations';
import generatePath from '../utils/generatePath';
import { Dispatch, SetStateAction, useState } from 'react';
import { IconButton } from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

// These are measured in pixels.
const MARKERS_WIDTH = 18;
const MARKERS_HEIGHT = 18;
const DIAMOND_FIXED_FACTOR = 3.5;

export type MarkerTypes = "hat" | "triangle" | "diamond";

// Considers the edge design properties.
type ExtendedEdgeProps = {
  isDashed: boolean;
  markerFilled?: boolean;
  markerType: MarkerTypes;
}

export type EdgePropsWithSetter = EdgeProps & {
  setEdges: Dispatch<SetStateAction<Edge[]>>;
}

/**
 * Represents an abstract edge, without arrow properties and marker.
 * 
 * @param {EdgePropsWithSetter & ExtendedEdgeProps} props - The edge properties. 
 * @returns {JSX.Element | null} The edge to be rendered in the canvas.
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
export function AbstractEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  isDashed,
  markerFilled = false,
  markerType,
  style = { stroke: 'black' },
  setEdges
}: EdgePropsWithSetter & ExtendedEdgeProps): JSX.Element | null {
  const [mouseHover, setMouseHover] = useState<boolean>(false);
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode || !sourceHandleId || !targetHandleId) {
    return null;
  }

  const {
    sx: sourceX,
    sy: sourceY,
    tx: targetX,
    ty: targetY,
    sourcePos: sourcePosition,
    targetPos: targetPosition
  } = getEdgeParams(
    sourceNode,
    targetNode,
    sourceHandleId,
    targetHandleId
  );


  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    //sourcePosition,
    targetX,
    targetY,
    //targetPosition,
    //borderRadius: 0
  });

  // Extends the design if the arrow has to be dashed.
  const edgeStyle = {
    strokeDasharray: isDashed ? '5 5' : '0',
    ...style
  };

  /**
   * Deletes this edge from the global storage.
   * 
   * @param {React.SyntheticEvent} _event - Unused. The event that triggered the deletion.
   */
  const handleDeletingEdge = (_event: React.SyntheticEvent) => {
    setEdges((oldEdges) => {
      return oldEdges.filter((edge) => edge.id !== id);
    })
  }

  return (
    <>
      <defs>
        {markerType === 'hat' && (
          <marker
            id="marker-hat"
            markerWidth={MARKERS_WIDTH}
            markerHeight={MARKERS_HEIGHT}
            refX={MARKERS_WIDTH}
            refY={MARKERS_HEIGHT / 2}
            orient="auto"
          >
            <path
              d={generatePath(markerType, MARKERS_WIDTH, MARKERS_HEIGHT)}
              fill="none"
              stroke="black"
            />
          </marker>
        )}
        {markerType === 'diamond' && (
          <marker
            id="marker-diamond"
            markerWidth={DIAMOND_FIXED_FACTOR * MARKERS_WIDTH}
            markerHeight={MARKERS_HEIGHT}
            refX={0.8 * MARKERS_WIDTH}
            refY={MARKERS_HEIGHT / 2}
            orient="auto"
          >
            <path
              d={generatePath(markerType, DIAMOND_FIXED_FACTOR * MARKERS_WIDTH, MARKERS_HEIGHT)}
              fill={markerFilled ? "black" : "white"}
              stroke="black"
            />
          </marker>
        )}
        {markerType === 'triangle' && (
          <marker
            id="marker-triangle"
            markerWidth={MARKERS_WIDTH}
            markerHeight={MARKERS_HEIGHT}
            refX={MARKERS_WIDTH}
            refY={MARKERS_HEIGHT / 2}
            orient="auto"
          >
            <path
              d={generatePath(markerType, MARKERS_WIDTH, MARKERS_HEIGHT)}
              fill={markerFilled ? "black" : "white"}
              stroke="black"
            />
          </marker>
        )}
      </defs>

      <g
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerStart={markerType === 'diamond' ? `url(#marker-${markerType})` : undefined}
          markerEnd={markerType === 'diamond' ? undefined : `url(#marker-${markerType})`}
          style={edgeStyle}
        />

        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {mouseHover && <IconButton className="edgebutton" onClick={handleDeletingEdge}>
              <DeleteIcon />
            </IconButton>}
          </div>
        </EdgeLabelRenderer>
      </g>
    </>
  );
}