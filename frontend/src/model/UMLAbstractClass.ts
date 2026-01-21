import { Node } from "@xyflow/react";
import UMLNode, { ClassType, EdgeType, FieldType, MethodType } from "./UMLNode";
import Trait from "./Trait";
import AbstractClass from "./AbstractClass";
import ConcreteClass from "./ConcreteClass";

abstract class UMLAbstractClass implements UMLNode {
  id: number;
  name: string;
  abstract node: Node;
  methods: MethodType[];
  fields: FieldType[];
  protected extends: UMLNode[] = [];
  x: number;
  y: number;
  classType: ClassType;

  constructor(
    id: number,
    name: string,
    methods: MethodType[],
    fields: FieldType[],
    x: number,
    y: number,
    classType: ClassType
  ) {
    this.name = name;
    this.id = id;
    this.methods = methods;
    this.fields = fields;
    this.x = x;
    this.y = y;
    this.classType = classType;
  }

  addExtends: (node: UMLNode) => void = (node) => {
    this.extends.push(node);
  }

  removeExtends: (c: UMLNode) => void = (c) => {
    this.extends = this.extends.filter((e) => e.id !== c.id);
  }

  /**
   * @returns {Node} The xyflow Node representation of this UMLNode.
   */
  getNode: () => Node = () => this.node;

  /**
   * Updates the position of this UMLNode in the canvas.
   * @param {Node} newNode - The new xyflow Node representation of this UMLNode.
   */
  updatePosition: (newNode: Node) => void = (newNode) => {
    this.x = newNode.position.x;
    this.y = newNode.position.y;

    this.node = newNode;
  }

  /**
   * Updates the name of this UMLNode.
   * @param {string} newName - The new name of this UMLNode.
   */
  updateName: (newName: string) => void = (newName) => {
    this.name = newName;
    this.node.data.name = newName;
  }

  /**
   * @returns {string} The name of this UMLNode.
   */
  getName: () => string = () => this.name;

  /**
   * Adds a field into this UMLNode.
   * @param {FieldType} f - The field to add.
   */
  addField: (f: FieldType) => void = (f) => {
    this.fields.push(f);
    this.node.data.fields = this.fields;
  }

  /**
   * Removes a field from this UMLNode.
   * @param {FieldType} f - The field to remove. 
   */
  removeField: (f: FieldType) => void = (f) => {
    this.fields = this.fields.filter((field) => field.name !== f.name);
    this.node.data.fields = this.fields;
  }

  /**
   * Updates a field from this UMLNode.
   * @param {FieldType} f - The field to update.
   * @param {newField} newField - The updated field.
   */
  updateField: (f: FieldType, newField: FieldType) => void = (f, newField) => {
    const index = this.fields.findIndex((field) => field.name === f.name);
    this.fields[index] = newField;
    this.node.data.fields = this.fields;
  }

  /**
   * @returns {FieldType[]} The fields of this UMLNode.
   */
  getFields: () => FieldType[] = () => this.fields;

  /**
   * Adds a method into this UMLNode.
   * @param {MethodType} m - The method to add.
   */
  addMethod: (m: MethodType) => void = (m) => {
    this.methods.push(m);
    this.node.data.methods = this.methods;
  }

  /**
   * Removes a method from this UMLNode.
   * @param {MethodType} m - The method to remove. 
   */
  removeMethod: (m: MethodType) => void = (m) => {
    this.methods = this.methods.filter((method) => method.name !== m.name);
    this.node.data.methods = this.methods;
  }

  /**
   * Updates a method from this UMLNode.
   * @param {MethodType} m - The method to update.
   * @param {MethodType} newMethod - The updated method.
   */
  updateMethod: (m: MethodType, newMethod: MethodType) => void = (m, newMethod) => {
    const index = this.methods.findIndex((method) => method.name === m.name);
    this.methods[index] = newMethod;
    this.node.data.methods = this.methods;
  }

  /**
   * @returns {MethodType[]} The methods of this UMLNode.
   */
  getMethods: () => MethodType[] = () => this.methods;

  abstract getEdgeType: (target: UMLNode) => EdgeType;
  abstract traitEdgeType: (trait: Trait) => EdgeType;
  abstract abstractClassEdgeType: (abstractClass: AbstractClass) => EdgeType;
  abstract concreteClassEdgeType: (concreteClass: ConcreteClass) => EdgeType;
}

export default UMLAbstractClass;
