import { graphlib, layout } from '@dagrejs/dagre';
import type { Edge, ReactFlowInstance } from '@xyflow/react';
import type UMLNode from '../model/UMLNode';

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 100;

export function applyDagreLayout(
  nodes: UMLNode[],
  edges: Edge[],
  rfInstance: ReactFlowInstance
): void {
  if (nodes.length === 0) return;

  const g = new graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    const internal = rfInstance.getInternalNode(String(node.id));
    const width = internal?.measured?.width ?? DEFAULT_WIDTH;
    const height = internal?.measured?.height ?? DEFAULT_HEIGHT;
    g.setNode(String(node.id), { width, height });
  });

  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      // Reverse direction: UML arrows go child→parent, but dagre puts
      // edge sources at the top — inverting gives parent at top, children below.
      g.setEdge(edge.target, edge.source);
    }
  });

  layout(g);

  nodes.forEach((node) => {
    const dagreNode = g.node(String(node.id));
    if (!dagreNode) return;
    node.updatePosition({
      ...node.node,
      position: {
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2,
      },
    });
  });
}
