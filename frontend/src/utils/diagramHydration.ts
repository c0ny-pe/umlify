import { addEdge, type Edge } from "@xyflow/react";
import AbstractClass from "../model/AbstractClass";
import ConcreteClass from "../model/ConcreteClass";
import Trait from "../model/Trait";
import UMLNode from "../model/UMLNode";
import { diagramPayloadSchema, type DiagramPayload } from "../schemas/diagramSchemas";

type HydratedDiagram = {
  nodes: UMLNode[];
  edges: Edge[];
  nextNodeId: number;
};

function buildNodes(payload: DiagramPayload): UMLNode[] {
  const nodes: UMLNode[] = [];

  for (const node of payload.nodes) {
    const nodeId = Number(node.id);

    switch (node.classType) {
      case "trait":
        nodes.push(new Trait(nodeId, node.name, node.methods, node.fields, node.x, node.y));
        break;
      case "abstractClass":
        nodes.push(new AbstractClass(nodeId, node.name, node.methods, node.fields, node.x, node.y));
        break;
      case "concreteClass":
        nodes.push(new ConcreteClass(nodeId, node.name, node.methods, node.fields, node.x, node.y));
        break;
    }
  }

  return nodes;
}

function buildEdges(payload: DiagramPayload): Edge[] {
  let edges: Edge[] = [];

  for (const edge of payload.edges) {
    edges = addEdge(
      {
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
      },
      edges
    );
  }

  return edges;
}

export function hydrateDiagramData(payload: DiagramPayload): HydratedDiagram {
  const nodes = buildNodes(payload);
  const edges = buildEdges(payload);
  const nextNodeId = nodes.reduce((maxId, node) => Math.max(maxId, node.id), 0) + 1;

  return {
    nodes,
    edges,
    nextNodeId,
  };
}

export function parseAndHydrateDiagram(raw: unknown): HydratedDiagram {
  const parsed = diagramPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".") || "archivo";
    const issueMessage = firstIssue?.message || "JSON inválido";
    throw new Error(`JSON inválido en ${issuePath}: ${issueMessage}`);
  }

  return hydrateDiagramData(parsed.data);
}
