import { Node } from "@xyflow/react";
import UMLAbstractClass from "./UMLAbstractClass";
import UMLNode, { CustomNodeData, EdgeType, FieldType, MethodType } from "./UMLNode";
import Trait from "./Trait";
import ConcreteClass from "./ConcreteClass";
import InvalidConnectionException from "../exceptions/InvalidConnectionException";

/**
 * Represents an Abstract Class in an UML diagram.
 * @extends UMLAbstractClass
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>
 */
class AbstractClass extends UMLAbstractClass {
  node: Node<CustomNodeData, "abstractClass">;

  constructor(
    id: number,
    name: string,
    methods: MethodType[],
    fields: FieldType[],
    x: number,
    y: number
  ) {
    super(id, name, methods, fields, x, y, "abstractClass");
    this.name = name;
    this.id = id;
    this.methods = methods;
    this.fields = fields;
    this.node = {
      id: String(this.id),
      type: "abstractClass",
      position: { x: this.x, y: this.y },
      data: {
        id: this.id,
        name: this.name,
        methods: this.methods,
        fields: this.fields,
        styleClass: "abstract-paragraph"
      },
    };
  }

  getEdgeType: (target: UMLNode) => EdgeType = (target) => {
    return target.abstractClassEdgeType(this);
  }

  traitEdgeType: (_trait: Trait) => EdgeType = (_trait) => {
    throw new InvalidConnectionException("A Trait can't be connected with an Abstract Class");
  }

  abstractClassEdgeType: (_abstractClass: AbstractClass) => EdgeType = (_abstractClass) => {
    return "inheritance";
  }

  concreteClassEdgeType: (_concreteClass: ConcreteClass) => EdgeType = (_concreteClass) => {
    return "inheritance";
  }
}

export default AbstractClass;
