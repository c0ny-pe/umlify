import { Node } from "@xyflow/react";
import UMLAbstractClass from "./UMLAbstractClass";
import UMLNode, { CustomNodeData, EdgeType, FieldType, MethodType } from "./UMLNode";
import AbstractClass from "./AbstractClass";
import Trait from "./Trait";
import InvalidConnectionException from "../exceptions/InvalidConnectionException";

/**
 * Represents a Concrete Class in an UML diagram.
 * @extends UMLAbstractClass
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
class ConcreteClass extends UMLAbstractClass {
  node: Node<CustomNodeData, "concreteClass">;

  constructor(
    id: number,
    name: string,
    methods: MethodType[],
    fields: FieldType[],
    x: number,
    y: number
  ) {
    super(id, name, methods, fields, x, y, "concreteClass");
    this.node = {
      id: String(this.id),
      type: "concreteClass",
      position: { x: this.x, y: this.y },
      data: {
        id: this.id,
        name: this.name,
        methods: this.methods,
        fields: this.fields,
        styleClass: "concrete-paragraph"
      },
    };
  }

  getEdgeType: (target: UMLNode) => EdgeType = (target) => {
    return target.concreteClassEdgeType(this);
  }

  traitEdgeType: (_trait: Trait) => EdgeType = (_trait) => {
    throw new InvalidConnectionException("A Trait can't be connected with a Concrete Class");
  }

  abstractClassEdgeType: (_abstractClass: AbstractClass) => EdgeType = (_abstractClass) => {
    return "inheritance";
  }

  concreteClassEdgeType: (_concreteClass: ConcreteClass) => EdgeType = (_concreteClass) => {
    return "inheritance";
  }
}

export default ConcreteClass;
