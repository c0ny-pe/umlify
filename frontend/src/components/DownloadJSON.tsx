import { Button } from "@mui/material";
import UMLNode, { ClassType, EdgeType, FieldType, MethodType } from "../model/UMLNode";
import { Edge } from "@xyflow/react";
import { Download } from "@mui/icons-material";

// TODO: See if these types already exist
type ExportingNode = {
  id: string,
  name: string,
  classType: ClassType,
  methods: MethodType[],
  fields: FieldType[],
  x: number,
  y: number
}

type ExportingEdge = {
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  type: EdgeType
}

type DownloadJSONProps = {
  nodes: UMLNode[];
  edges: Edge[];
};

const DownloadJSON = ({ nodes, edges }: DownloadJSONProps): JSX.Element => {
  const handleDownload = (): void => {
    let result: { nodes: ExportingNode[], edges: ExportingEdge[] } = {
      nodes: [],
      edges: []
    };

    for (let node of nodes) {
      let exportingNode: ExportingNode = {
        id: String(node.id),
        name: node.name,
        classType: node.classType,
        methods: node.methods,
        fields: node.fields,
        x: node.x,
        y: node.y
      }
      result.nodes.push(exportingNode);
    }

    for (let edge of edges) {
      let exportingEdge: ExportingEdge = {
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle as string,
        targetHandle: edge.targetHandle as string,
        type: edge.type as EdgeType
      }
      result.edges.push(exportingEdge);
    }

    const contentType = "application/json;charset=utf-8"
    const data = `data:${contentType},${encodeURIComponent(JSON.stringify(result))}`;
    const moment = new Date().toISOString();

    const el = document.createElement("a");
    el.setAttribute("href", data);
    el.setAttribute("download", `uml_diagram_${moment}.json`);
    el.click();
  }

  return (
    <Button startIcon={<Download />} onClick={handleDownload}>
      Download JSON
    </Button>
  );
};

export default DownloadJSON;