import { describe, expect, it } from "vitest";
import ConcreteClass from "../model/ConcreteClass";
import type { MethodType } from "../model/UMLNode";

const constructor = (domType: string[]): MethodType => ({
  name: "CuentaAhorro",
  domType,
  codType: "",
  visibility: "public",
  abstract: false,
});

const makeNode = () =>
  new ConcreteClass(
    1,
    "CuentaAhorro",
    [constructor(["String", "Int"]), constructor(["String"])],
    [],
    0,
    0
  );

describe("reordenar miembros", () => {
  const metodo = (name: string): MethodType => ({
    name,
    domType: [],
    codType: "",
    visibility: "public",
    abstract: false,
  });

  const conMetodos = () =>
    new ConcreteClass(
      1,
      "Cuenta",
      [metodo("a"), metodo("b"), metodo("c")],
      [
        { name: "x", type: "Int", visibility: "public" },
        { name: "y", type: "Int", visibility: "public" },
      ],
      0,
      0
    );

  it("sube y baja un método", () => {
    const node = conMetodos();

    node.moveMethodAt(2, -1);
    expect(node.getMethods().map((m) => m.name)).toEqual(["a", "c", "b"]);

    node.moveMethodAt(0, 1);
    expect(node.getMethods().map((m) => m.name)).toEqual(["c", "a", "b"]);
    expect(node.getNode().data.methods).toEqual(node.getMethods());
  });

  it("intercambia atributos y deja el orden en el nodo", () => {
    const node = conMetodos();

    node.moveFieldAt(0, 1);

    expect(node.getFields().map((f) => f.name)).toEqual(["y", "x"]);
    expect(node.getNode().data.fields).toEqual(node.getFields());
  });

  it("ignora un movimiento fuera de la lista", () => {
    const node = conMetodos();

    node.moveMethodAt(0, -1);
    node.moveMethodAt(2, 1);
    node.moveFieldAt(5, -1);

    expect(node.getMethods().map((m) => m.name)).toEqual(["a", "b", "c"]);
    expect(node.getFields().map((f) => f.name)).toEqual(["x", "y"]);
  });
});

describe("constructores en el modelo", () => {
  it("edita el constructor de una posición sin tocar al otro", () => {
    const node = makeNode();

    node.updateMethodAt(1, { ...node.getMethods()[1], domType: ["Boolean"] });

    expect(node.getMethods().map((m) => m.domType)).toEqual([
      ["String", "Int"],
      ["Boolean"],
    ]);
  });

  it("borra solo el constructor de la posición pedida", () => {
    const node = makeNode();

    node.removeMethodAt(0);

    expect(node.getMethods()).toHaveLength(1);
    expect(node.getMethods()[0].domType).toEqual(["String"]);
  });

  it("renombra los constructores junto con la clase", () => {
    const node = makeNode();
    node.addMethod({
      name: "puedeGirar",
      domType: ["Int"],
      codType: "Boolean",
      visibility: "public",
      abstract: false,
    });

    node.updateName("CuentaCorriente");

    expect(node.getMethods().map((m) => m.name)).toEqual([
      "CuentaCorriente",
      "CuentaCorriente",
      "puedeGirar",
    ]);
    expect(node.getNode().data.methods).toEqual(node.getMethods());
  });
});
