import { Node } from "@xyflow/react";
import Trait from "./Trait";
import AbstractClass from "./AbstractClass";
import ConcreteClass from "./ConcreteClass";

export type Type = string;
export type Visibility = "public" | "protected" | "private";
export type ClassType = "trait" | "concreteClass" | "abstractClass";
export type EdgeType = "aggregation" | "association" | "composition"
  | "dependency" | "implementation" | "inheritance" | never;

export interface MethodType {
  name: string;
  domType: Type[];
  codType: Type | null;
  visibility: Visibility | null;
  abstract: boolean;
}
export interface FieldType {
  name: string;
  type: Type;
  visibility: Visibility | null;
}
export type CustomNodeData = {
  // Allows to identify the node when editing. It's not redundant, because
  // when editing we only can see the node data...
  id: number;
  name: string;
  methods: MethodType[];
  fields: FieldType[];
  styleClass: string;
  additionalText?: string;
}

export type CustomNode = Node<CustomNodeData, ClassType>;

export default interface UMLNode {
  id: number;
  name: string;
  methods: MethodType[];
  fields: FieldType[];
  x: number;
  y: number;
  classType: ClassType;
  addExtends: (c: UMLNode) => void;
  removeExtends: (c: UMLNode) => void;
  node: Node;
  getNode: () => Node;
  // This is a library-dependant (@xy/react) method.
  updatePosition: (n: Node) => void;
  updateName: (s: string) => void;
  getName: () => string;
  updateField: (f: FieldType, newField: FieldType) => void;
  addField: (f: FieldType) => void;
  removeField: (f: FieldType) => void;
  getFields: () => FieldType[];
  updateMethod: (m: MethodType, newMethod: MethodType) => void;
  addMethod: (m: MethodType) => void;
  removeMethod: (m: MethodType) => void;
  getMethods: () => MethodType[];
  // Double dispatch methods
  getEdgeType: (target: UMLNode) => EdgeType;
  traitEdgeType: (trait: Trait) => EdgeType;
  abstractClassEdgeType: (abstractClass: AbstractClass) => EdgeType;
  concreteClassEdgeType: (concreteClass: ConcreteClass) => EdgeType;
}
