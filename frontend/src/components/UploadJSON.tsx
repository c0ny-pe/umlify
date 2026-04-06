import { Upload } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import React from "react";
import UMLNode from "../model/UMLNode";
import { addEdge, Edge } from "@xyflow/react";
import Trait from "../model/Trait";
import AbstractClass from "../model/AbstractClass";
import ConcreteClass from "../model/ConcreteClass";
import { getUniqueName } from "../utils/nodeName";
import { diagramPayloadSchema } from "../schemas/diagramSchemas";

type UploadJSONProps = {
  setNodes: React.Dispatch<React.SetStateAction<UMLNode[]>>;
  setNextNodeId: (nextNodeId: number) => void;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

const UploadJSON = ({ setNodes, setNextNodeId, setEdges }: UploadJSONProps): JSX.Element => {
  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  const handleUpload = (event: React.SyntheticEvent): void => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      return;
    }

    const file = target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const contents = e.target?.result as string;
      let rawJson: unknown;

      try {
        rawJson = JSON.parse(contents);
      } catch {
        window.alert("El archivo JSON no tiene un formato válido.");
        target.value = "";
        return;
      }

      const parsed = diagramPayloadSchema.safeParse(rawJson);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        const issuePath = firstIssue?.path.join(".") || "archivo";
        const issueMessage = firstIssue?.message || "JSON inválido";
        window.alert(`JSON inválido en ${issuePath}: ${issueMessage}`);
        target.value = "";
        return;
      }

      const json = parsed.data;

      let nodes: UMLNode[] = [];
      const usedNames: string[] = [];
      for (let node of json.nodes) {
        const nodeId = Number(node.id);
        const uniqueName = getUniqueName(node.name, usedNames);
        usedNames.push(uniqueName);
        switch (node.classType) {
          case "trait":
            nodes.push(new Trait(
              nodeId,
              uniqueName,
              node.methods,
              node.fields,
              node.x,
              node.y
            ));
            break;
          case "abstractClass":
            nodes.push(new AbstractClass(
              nodeId,
              uniqueName,
              node.methods,
              node.fields,
              node.x,
              node.y
            ));
            break;
          case "concreteClass":
            nodes.push(new ConcreteClass(
              nodeId,
              uniqueName,
              node.methods,
              node.fields,
              node.x,
              node.y
            ));
            break;
        }
      }

      let edges: Edge[] = [];
      for (let edge of json.edges) {
        edges = addEdge({
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type
        }, edges);
      }

      setNodes(nodes);
      const maxImportedId = nodes.reduce(
        (maxId, node) => Math.max(maxId, node.id),
        0
      );
      setNextNodeId(maxImportedId + 1);
      setEdges(edges);
      target.value = "";
    }

    reader.readAsText(file);
  }

  return (
    <Button startIcon={<Upload />} component="label">
      Upload JSON
      <VisuallyHiddenInput
        type="file"
        accept=".json"
        onChange={handleUpload}
      />
    </Button>
  )
}

export default UploadJSON;