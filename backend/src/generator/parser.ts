// transformo un JSONDiagram en un DiagramModel

import { Class, DiagramModel, JSONDiagram, JSONEdge, JSONNode, Relation } from "../types/generator";

export function parseDiagram(diagram: JSONDiagram): DiagramModel {
    const classes = diagram.nodes.map((node) => parseClass(node));
    const relations = diagram.edges.map((edge) => parseEdge(edge));

    return { classes, relations };
}

function parseClass(classNode: JSONNode): Class {
    return {
        id: classNode.id,
        name: classNode.name,
        classType: classNode.classType,
        fields: classNode.fields,
        methods: classNode.methods,
    };
}

function parseEdge(edge: JSONEdge): Relation {
    return {
        source: edge.source,
        target: edge.target,
        type: edge.type,
    };
}