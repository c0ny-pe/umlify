import { Node } from "@xyflow/react";
import UMLNode, { ClassType, EdgeType, FieldType, MethodType } from "./UMLNode";
import Trait from "./Trait";
import AbstractClass from "./AbstractClass";
import ConcreteClass from "./ConcreteClass";
import InvalidConnectionException from "../exceptions/InvalidConnectionException";

/**
 * Devuelve una copia con los elementos de index e index + offset intercambiados,
 * o null si alguno de los dos queda fuera de la lista.
 */
function swapped<T>(list: T[], index: number, offset: number): T[] | null {
  const target = index + offset;
  if (index < 0 || index >= list.length) return null;
  if (target < 0 || target >= list.length) return null;

  const next = [...list];
  next[index] = list[target];
  next[target] = list[index];
  return next;
}

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
    if (this.extends.length > 0) {
      throw new InvalidConnectionException("Una clase solo puede extender de una única clase");
    }
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
    const previousName = this.name;
    this.name = newName;
    this.node.data.name = newName;

    // Un constructor se llama igual que su clase: sigue al renombre.
    this.methods = this.methods.map((m) =>
      m.name === previousName ? { ...m, name: newName } : m
    );
    this.node.data.methods = this.methods;
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
   * Moves a field one position up (-1) or down (+1). The order matters: the
   * generator emits the fields as constructor parameters in this same order.
   * @param {number} index - The position of the field to move.
   * @param {number} offset - How far to move it.
   */
  moveFieldAt: (index: number, offset: number) => void = (index, offset) => {
    const reordered = swapped(this.fields, index, offset);
    if (!reordered) return;

    this.fields = reordered;
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
   * Updates the method in a given position. Needed because constructors share
   * their name with the class, so looking a method up by name is ambiguous.
   * @param {number} index - The position of the method to update.
   * @param {MethodType} newMethod - The updated method.
   */
  updateMethodAt: (index: number, newMethod: MethodType) => void = (index, newMethod) => {
    if (index < 0 || index >= this.methods.length) return;
    this.methods[index] = newMethod;
    this.node.data.methods = this.methods;
  }

  /**
   * Removes the method in a given position.
   * @param {number} index - The position of the method to remove.
   */
  removeMethodAt: (index: number) => void = (index) => {
    this.methods = this.methods.filter((_, i) => i !== index);
    this.node.data.methods = this.methods;
  }

  /**
   * Moves a method one position up (-1) or down (+1).
   * @param {number} index - The position of the method to move.
   * @param {number} offset - How far to move it.
   */
  moveMethodAt: (index: number, offset: number) => void = (index, offset) => {
    const reordered = swapped(this.methods, index, offset);
    if (!reordered) return;

    this.methods = reordered;
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
