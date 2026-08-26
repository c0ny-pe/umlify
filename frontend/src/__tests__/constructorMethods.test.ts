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
