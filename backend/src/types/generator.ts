// Tipos para representar el JSON

type ClassType = "concreteClass" | "abstractClass" | "trait";

type VisibilityType = "public" | "protected" | "private";

type RelationType = "aggregation"
    | "association"
    | "composition"
    | "dependency"
    | "implementation"
    | "inheritance";

interface Field {
    name: string;
    type: string;
    visibility: VisibilityType;
}

interface RawMethod {
    name: string;
    domType: string[];
    codType: string;
    visibility: VisibilityType;
    abstract: boolean;
}

export interface Node {
    id: string;
    name: string;
    classType: ClassType;
    fields: Field[];
    methods: RawMethod[];
    x: number;
    y: number;
}

export interface Edge {
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    type: RelationType;
}

export interface RawDiagram {
    nodes: Node[];
    edges: Edge[];
}

// Tipos para representar el modelo intermedio

export interface Param {
    name: string;
    paramType: string;
}

export interface Method {
    name: string;
    params: Param[];
    returnType: string;
    visibility: VisibilityType;
}

export interface ClassNode {
    id: string;
    name: string;
    classType: ClassType;
    fields: Field[];
    methods: Method[];
}

export interface Relation {
    sourceId: string;
    targetId: string;
    relationType: RelationType;
}

export interface DiagramModel {
    classes: ClassNode[];
    relations: Relation[];
}

export interface ClassRelations {
    extendsClass: string | null;
    withTraits: string[];
    associations: string[];
}