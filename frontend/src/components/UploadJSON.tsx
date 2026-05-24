import { Upload } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import React from "react";
import UMLNode from "../model/UMLNode";
import { Edge } from "@xyflow/react";
import { parseAndHydrateDiagram } from "../utils/diagramHydration";

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
      let hydrated;

      try {
        hydrated = parseAndHydrateDiagram(JSON.parse(contents));
      } catch (error) {
        const message = error instanceof Error ? error.message : "JSON inválido";
        window.alert("El archivo JSON no tiene un formato válido.");
        target.value = "";
        return;
      }

      setNodes(hydrated.nodes);
      setNextNodeId(hydrated.nextNodeId);
      setEdges(hydrated.edges);
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