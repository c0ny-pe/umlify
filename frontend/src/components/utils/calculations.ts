import { Node, InternalNode, Position } from '@xyflow/react';

/**
 * Defines calculations to compute dynamically the handles to use in a node connection.
 * Extracted from https://reactflow.dev/examples/edges/simple-floating-edges (utils.js).
 * 
 * Adapted by Máximo Flores Valenzuela [https://github.com/maxfloresv].
 */

/** 
 * Contains source (s) and target (t) node coordinates, and the handles' 
 * position to construct the edge between them.
 */
interface EdgeParams {
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  sourcePos: Position,
  targetPos: Position
};

/**
 * Calculates dynamically the handle position to use in a node for a connection, based on center distances.
 * Note that it receives two nodes, because an edge can only have two members in its definition.
 * 
 * @param {InternalNode<Node>} nodeA - The node of interest to calculate its handle positioning.
 * @param {InternalNode<Node>} nodeB - The other node related to this connection.
 * @param {string} handleId - The base handle identifier of nodeA.
 * 
 * @returns {[number, number, Position]} The handle positioning.
 */
function getParams(
  nodeA: InternalNode<Node>,
  nodeB: InternalNode<Node>,
  _handleId: string,
): [number, number, Position] {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;
  /**
   * If the horizontal distance between the comparing nodes is bigger than the vertical one, we don't want to
   * use the Top or Bottom handles, because the edge wouldn't have enough space to look properly (and viceversa).
   */
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getBorderPointToward(nodeA, position, centerB);
  return [x, y, position];
}

/**
 * Computes the point on a node's border (on the given side) that faces a target
 * point. Biasing each attachment toward the other node makes edges fan out
 * toward their targets instead of all meeting at the side's center, which
 * reduces crossings when several edges share a node.
 *
 * @param {InternalNode<Node>} node - The node that owns the border.
 * @param {Position} side - The side of the node the edge attaches to.
 * @param {{ x: number; y: number }} toward - The point to face (the other node's center).
 *
 * @returns {[number, number]} The border attachment coordinates.
 */
function getBorderPointToward(
  node: InternalNode<Node>,
  side: Position,
  toward: { x: number; y: number }
): [number, number] {
  const left = node.internals.positionAbsolute.x;
  const top = node.internals.positionAbsolute.y;
  const width = node.measured.width ?? 0;
  const height = node.measured.height ?? 0;

  // Keep the attachment away from the corners so bends stay clean.
  const margin = Math.min(20, width / 2, height / 2);
  const clampX = (v: number) => Math.max(left + margin, Math.min(left + width - margin, v));
  const clampY = (v: number) => Math.max(top + margin, Math.min(top + height - margin, v));

  switch (side) {
    case Position.Top:
      return [clampX(toward.x), top];
    case Position.Bottom:
      return [clampX(toward.x), top + height];
    case Position.Left:
      return [left, clampY(toward.y)];
    case Position.Right:
    default:
      return [left + width, clampY(toward.y)];
  }
}

/**
 * Computes the center coordinates of a node.
 * 
 * @param {InternalNode<Node>} node The node to be processed.
 * 
 * @returns {{ x: number, y: number }} The center coordinates of the node.
 */
function getNodeCenter(node: InternalNode<Node>): { x: number; y: number } {
  let x: number = node.internals.positionAbsolute.x;
  let y: number = node.internals.positionAbsolute.y;

  if (node.measured.width && node.measured.height) {
    x += node.measured.width / 2;
    y += node.measured.height / 2;
  }

  return { x, y };
}

/**
 * Calculates the positioning of two nodes and handles needed to create an edge.
 *  
 * @param {InternalNode<Node>} source - The source node.
 * @param {InternalNode<Node>} target - The target node.
 * @param {string} sourceHandleId - Source node's original handle identifier.
 * @param {string} targetHandleId - Target node's original handle identifier.
 * 
 * @returns {EdgeParams} The necessary parameters to create the edge.
 */
export function getEdgeParams(
  source: InternalNode<Node>,
  target: InternalNode<Node>,
  sourceHandleId: string,
  targetHandleId: string
): EdgeParams {
  const [sx, sy, sourcePos] = getParams(source, target, sourceHandleId);
  const [tx, ty, targetPos] = getParams(target, source, targetHandleId);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
