import type { DiagramPayload } from "../schemas/diagramSchemas";

// Tipos para representar el JSON
export type JSONNode = DiagramPayload["nodes"][number];
export type JSONEdge = DiagramPayload["edges"][number];
export type JSONDiagram = DiagramPayload;

// Tipos para representar el modelo intermedio
export type Method = JSONNode["methods"][number];
export type Class = Omit<JSONNode, "x" | "y">;
export type Relation = Omit<JSONEdge, "sourceHandle" | "targetHandle">;

export interface DiagramModel {
    classes: Class[];
    relations: Relation[];
}

export interface ClassRelations {
    extendsClass: string | null;
    withTraits: string[];
    associations: string[];
    aggregations: string[];
}