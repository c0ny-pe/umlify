// Convierte las declaraciones parseadas de Scala en el payload de diagrama
// ({ nodes, edges }), el mismo contrato que consume el editor.

import { DiagramPayload } from "../schemas/diagramSchemas";
import {
    ScalaField,
    ScalaMethod,
    ScalaTypeDecl,
    collectionElementType,
    parseScalaSource,
} from "./scalaParser";

type PayloadNode = DiagramPayload["nodes"][number];
type PayloadEdge = DiagramPayload["edges"][number];
type PayloadMethod = PayloadNode["methods"][number];

const COLUMN_WIDTH = 340;
const ROW_HEIGHT = 260;
const COLUMNS = 4;

// Los handles del editor están numerados por tipo de relación:
// 1 = asociación, 2 = herencia/implementación, 3 = agregación, 4 = composición.
const HANDLES: Record<PayloadEdge["type"], { source: string; target: string }> = {
    association: { source: "right-handle-1", target: "left-handle-1" },
    dependency: { source: "right-handle-1", target: "left-handle-1" },
    inheritance: { source: "top-handle-2", target: "bottom-handle-2" },
    implementation: { source: "top-handle-2", target: "bottom-handle-2" },
    aggregation: { source: "right-handle-3", target: "left-handle-3" },
    // El código fuente no distingue composición de asociación, así que el
    // importador nunca la emite; el handle existe para completar el mapa.
    composition: { source: "right-handle-4", target: "left-handle-4" },
};

function classTypeOf(decl: ScalaTypeDecl): PayloadNode["classType"] {
    switch (decl.kind) {
        case "trait":
            return "trait";
        case "abstractClass":
            return "abstractClass";
        default:
            return "concreteClass";
    }
}

/** Los parámetros del constructor y los miembros comparten el espacio de nombres. */
function mergeFields(decl: ScalaTypeDecl): ScalaField[] {
    const seen = new Set<string>();
    const fields: ScalaField[] = [];

    decl.fields.forEach((field) => {
        if (seen.has(field.name)) return;
        seen.add(field.name);
        fields.push(field);
    });

    return fields;
}

/**
 * Un método sin tipo de retorno declarado hereda el del método que redefine.
 * Sin esto, `def puedeGirar(monto: Int) = ...` se exportaría como Unit.
 */
function resolveReturnTypes(decls: ScalaTypeDecl[]): void {
    const byName = new Map(decls.map((d) => [d.name, d]));

    const findInherited = (
        decl: ScalaTypeDecl,
        method: ScalaMethod,
        visited: Set<string>
    ): string | null => {
        for (const parentName of decl.parents) {
            const parent = byName.get(parentName);
            if (!parent || visited.has(parent.name)) continue;
            visited.add(parent.name);

            const match = parent.methods.find(
                (m) => m.name === method.name && m.params.length === method.params.length
            );
            if (match?.returnType) return match.returnType;

            const inherited = findInherited(parent, method, visited);
            if (inherited) return inherited;
        }
        return null;
    };

    decls.forEach((decl) => {
        decl.methods.forEach((method) => {
            if (method.returnType) return;
            method.returnType = findInherited(decl, method, new Set([decl.name]));
        });
    });
}

function toPayloadMethod(method: ScalaMethod): PayloadMethod {
    return {
        name: method.name,
        domType: method.params,
        // El editor espera un string: un tipo desconocido se muestra como Unit.
        codType: method.returnType ?? "",
        visibility: method.visibility,
        abstract: method.isAbstract,
    };
}

/** Profundidad de herencia: sitúa a los padres arriba de sus hijos. */
function inheritanceDepth(decl: ScalaTypeDecl, byName: Map<string, ScalaTypeDecl>): number {
    const visit = (current: ScalaTypeDecl, seen: Set<string>): number => {
        let depth = 0;
        current.parents.forEach((parentName) => {
            const parent = byName.get(parentName);
            if (!parent || seen.has(parent.name)) return;
            seen.add(parent.name);
            depth = Math.max(depth, 1 + visit(parent, seen));
        });
        return depth;
    };

    return visit(decl, new Set([decl.name]));
}

function buildEdges(
    decls: ScalaTypeDecl[],
    idByName: Map<string, string>,
    byName: Map<string, ScalaTypeDecl>
): PayloadEdge[] {
    const edges: PayloadEdge[] = [];
    const seen = new Set<string>();

    const addEdge = (source: string, target: string, type: PayloadEdge["type"]) => {
        const key = `${source}->${target}:${type}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({
            source,
            target,
            sourceHandle: HANDLES[type].source,
            targetHandle: HANDLES[type].target,
            type,
        });
    };

    decls.forEach((decl) => {
        const sourceId = idByName.get(decl.name) as string;
        let hasInheritance = false;

        decl.parents.forEach((parentName) => {
            const parent = byName.get(parentName);
            const targetId = idByName.get(parentName);
            if (!parent || !targetId) return;

            // El editor resuelve el tipo por doble despacho: una clase que
            // extiende un trait implementa, y un trait que extiende otro trait
            // hereda. Todo lo demás es herencia.
            if (parent.kind === "trait" && decl.kind !== "trait") {
                addEdge(sourceId, targetId, "implementation");
                return;
            }

            // Una clase solo puede extender de una única clase.
            if (hasInheritance) return;
            hasInheritance = true;
            addEdge(sourceId, targetId, "inheritance");
        });

        mergeFields(decl).forEach((field) => {
            const element = collectionElementType(field.type);
            const targetName = element ?? field.type;
            const targetId = idByName.get(targetName);
            if (!targetId) return;

            addEdge(sourceId, targetId, element ? "aggregation" : "association");
        });
    });

    return edges;
}

/** Dos declaraciones con el mismo nombre (paquetes distintos) no pueden coexistir. */
function dedupeByName(decls: ScalaTypeDecl[]): ScalaTypeDecl[] {
    const seen = new Set<string>();
    return decls.filter((decl) => {
        if (seen.has(decl.name)) return false;
        seen.add(decl.name);
        return true;
    });
}

export function buildDiagramFromDecls(rawDecls: ScalaTypeDecl[]): DiagramPayload {
    const decls = dedupeByName(rawDecls);
    resolveReturnTypes(decls);

    const byName = new Map(decls.map((d) => [d.name, d]));
    const idByName = new Map(decls.map((d, index) => [d.name, String(index + 1)]));
    const cursorByDepth = new Map<number, number>();

    const nodes: PayloadNode[] = decls.map((decl) => {
        const depth = inheritanceDepth(decl, byName);
        const column = cursorByDepth.get(depth) ?? 0;
        cursorByDepth.set(depth, column + 1);

        return {
            id: idByName.get(decl.name) as string,
            name: decl.name,
            classType: classTypeOf(decl),
            fields: mergeFields(decl).map((field) => ({
                name: field.name,
                type: field.type,
                visibility: field.visibility,
            })),
            methods: decl.methods.map(toPayloadMethod),
            x: (column % COLUMNS) * COLUMN_WIDTH,
            y: depth * ROW_HEIGHT + Math.floor(column / COLUMNS) * ROW_HEIGHT,
        };
    });

    return { nodes, edges: buildEdges(decls, idByName, byName) };
}

export function buildDiagramFromScala(code: string): DiagramPayload {
    return buildDiagramFromDecls(parseScalaSource(code));
}
