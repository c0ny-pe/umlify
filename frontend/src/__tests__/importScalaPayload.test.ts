import { describe, expect, it } from "vitest";
import { parseAndHydrateDiagram } from "../utils/diagramHydration";
import AbstractClass from "../model/AbstractClass";
import ConcreteClass from "../model/ConcreteClass";

// Respuesta real de POST /api/importer para el ejemplo de cuentas. Existe para
// detectar cualquier divergencia entre el payload del backend y el schema del
// editor, que están duplicados a propósito.
const importerResponse = {
  nodes: [
    {
      id: "1",
      name: "AbstractCuenta",
      classType: "abstractClass",
      fields: [
        { name: "nombre", type: "String", visibility: "public" },
        { name: "saldo", type: "Int", visibility: "private" },
      ],
      methods: [
        { name: "getSaldo", domType: [], codType: "Int", visibility: "public", abstract: false },
        { name: "setSaldo", domType: ["Int"], codType: "", visibility: "public", abstract: false },
        {
          name: "puedeGirar",
          domType: ["Int"],
          codType: "Boolean",
          visibility: "public",
          abstract: true,
        },
      ],
      x: 0,
      y: 0,
    },
    {
      id: "2",
      name: "CuentaAhorro",
      classType: "concreteClass",
      fields: [{ name: "nombre", type: "String", visibility: "public" }],
      methods: [
        {
          name: "puedeGirar",
          domType: ["Int"],
          codType: "Boolean",
          visibility: "public",
          abstract: false,
        },
      ],
      x: 0,
      y: 260,
    },
  ],
  edges: [
    {
      source: "2",
      target: "1",
      sourceHandle: "top-handle-2",
      targetHandle: "bottom-handle-2",
      type: "inheritance",
    },
  ],
};

describe("payload importado desde Scala", () => {
  it("se hidrata en las clases del modelo", () => {
    const hydrated = parseAndHydrateDiagram(importerResponse);

    expect(hydrated.nodes[0]).toBeInstanceOf(AbstractClass);
    expect(hydrated.nodes[1]).toBeInstanceOf(ConcreteClass);
    expect(hydrated.nextNodeId).toBe(3);
  });

  it("conserva el método abstracto y el tipo de retorno vacío", () => {
    const [abstracta] = parseAndHydrateDiagram(importerResponse).nodes;
    const metodos = abstracta.getMethods();

    expect(metodos.find((m) => m.name === "puedeGirar")?.abstract).toBe(true);
    expect(metodos.find((m) => m.name === "setSaldo")?.codType).toBe("");
  });

  it("reconstruye la arista de herencia con sus handles", () => {
    const [edge] = parseAndHydrateDiagram(importerResponse).edges;

    expect(edge).toMatchObject({
      source: "2",
      target: "1",
      sourceHandle: "top-handle-2",
      targetHandle: "bottom-handle-2",
      type: "inheritance",
    });
  });
});
