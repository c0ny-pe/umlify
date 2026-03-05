// transformo un Diagram en un DiagramModel

import { ClassNode, DiagramModel, Edge, Method, Node, RawDiagram, Relation } from "../types/generator";

export function parseDiagram(diagram: RawDiagram): DiagramModel {
    const classes = diagram.nodes.map(n => parseClass(n));
    const relations = diagram.edges.map(e => parseEdge(e));

    return { classes, relations };
}

function parseClass(classNode: Node): ClassNode {
    const methods: Method[] = classNode.methods.map(m => ({
        name: m.name,
        params: m.domType.map((d, idx) => ({
            name: `param${idx}`,
            paramType: d,
        })),
        returnType: m.codType,
        visibility: m.visibility
    }));

    return {
        id: classNode.id,
        name: classNode.name,
        classType: classNode.classType,
        fields: classNode.fields,
        methods
    };
}

function parseEdge(edge: Edge): Relation {
    return {
        sourceId: edge.source,
        targetId: edge.target,
        relationType: edge.type
    };
}