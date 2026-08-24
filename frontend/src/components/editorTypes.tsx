import type { EdgeTypes, NodeProps, NodeTypes } from "@xyflow/react";
import StyledNode from "./nodes/StyledNode";
import AggregationEdge from "./edges/AggregationEdge";
import AssociationEdge from "./edges/AssociationEdge";
import CompositionEdge from "./edges/CompositionEdge";
import DependencyEdge from "./edges/DependencyEdge";
import ImplementationEdge from "./edges/ImplementationEdge";
import InheritanceEdge from "./edges/InheritanceEdge";
import { useEditorCanvas } from "./editorCanvasContext";
import type { CustomNode } from "../model/UMLNode";

function EditorNodeRenderer(props: NodeProps<CustomNode>): JSX.Element {
  const {
    setNodes,
    setEdges,
    nodeNames,
    getUniqueNodeName,
    getNodeEditMode,
    setNodeEditMode,
    onDuplicateName,
    onEmptyName,
  } = useEditorCanvas();

  const nodeId = props.data.id;

  return (
    <StyledNode
      setNodes={setNodes}
      setEdges={setEdges}
      node={props}
      nodeNames={nodeNames}
      editMode={getNodeEditMode(nodeId)}
      setEditMode={(nextEditMode) => setNodeEditMode(nodeId, Boolean(nextEditMode))}
      getUniqueNodeName={getUniqueNodeName}
      onDuplicateName={onDuplicateName}
      onEmptyName={onEmptyName}
    />
  );
}

export const nodeTypes: NodeTypes = {
  abstractClass: EditorNodeRenderer,
  concreteClass: EditorNodeRenderer,
  trait: EditorNodeRenderer,
};

export const edgeTypes: EdgeTypes = {
  aggregation: AggregationEdge,
  association: AssociationEdge,
  composition: CompositionEdge,
  dependency: DependencyEdge,
  implementation: ImplementationEdge,
  inheritance: InheritanceEdge,
};
