import { ClassNode, ClassRelations, DiagramModel, Param, Relation } from "../types/generator";

function formatParams(params: Param[]): string {
    return params.map(p => `${p.name}: ${p.paramType}`).join(", ");
}

function indent(lines: string[], spaces = 2): string[] {
    const pad = " ".repeat(spaces);
    return lines.map((l) => (l === "" ? "" : `${pad}${l}`));
}

function createRelationsMap(classes: ClassNode[], relations: Relation[]) {
    const idtoClass = new Map(classes.map(c => [c.id, c]));
    const relationsMap = new Map<string, ClassRelations>();

    // Inicializamos los tipos de relaciones
    classes.forEach(c =>
        relationsMap.set(c.id, { extendsClass: null, withTraits: [], associations: [] })
    );

    // los rellenamos
    relations.forEach(r => {
        const sourceRel = relationsMap.get(r.sourceId);
        const targetClass = idtoClass.get(r.targetId);
        if (!sourceRel || !targetClass) return;

        switch (r.relationType) {
            case "inheritance":
                sourceRel.extendsClass = targetClass.name;
                break;
            case "implementation":
                if (targetClass.classType === "trait") {
                    sourceRel.withTraits.push(targetClass.name);
                } else {
                    sourceRel.extendsClass = targetClass.name;
                }
                break;
            case "association":
            case "aggregation":
            case "composition":
            case "dependency":
                sourceRel.associations.push(targetClass.name);
        }
    })

    return relationsMap;
}

function createClassHeader(cls: ClassNode, rel: ClassRelations): string {
    const fields = cls.fields.map(f => `${f.visibility === "public" ? "" : f.visibility + " "}val ${f.name}: ${f.type}`);
    const constructorParams = fields.length ? `(${fields.join(", ")})` : "";

    let keyword: string;
    switch (cls.classType) {
        case "trait": keyword = "trait"; break;
        case "abstractClass": keyword = "abstract class"; break;
        case "concreteClass": keyword = "class"; break;
    }

    const params = cls.classType === "trait" ? "" : constructorParams;

    let inheritance = "";
    if (rel.extendsClass) inheritance += ` extends ${rel.extendsClass}`;
    if (rel.withTraits.length) {
        const k = rel.extendsClass ? "with" : "extends";
        inheritance += ` ${k} ${rel.withTraits.join(" with ")}`;
    }

    return `${keyword} ${cls.name}${params}${inheritance} {`;
}

function createClassBody(cls: ClassNode, rel: ClassRelations): string[] {
    const body: string[] = [];

    rel.associations.forEach(a => body.push(`val ${a.toLowerCase()}: ${a} = ???`));

    if (rel.associations.length && cls.methods.length) body.push("");

    cls.methods.forEach(m => {
        const signature = `def ${m.name}(${formatParams(m.params)}): ${m.returnType === "" ? "Unit" : m.returnType}`;
        if (cls.classType === "trait" || cls.classType === "abstractClass") {
            body.push(signature);
        } else {
            body.push(`${signature} = ???`);
        }
    });

    return body;
}

function createClass(cls: ClassNode, rel: ClassRelations): string {
    const header = createClassHeader(cls, rel);
    const body = createClassBody(cls, rel);

    if (body.length === 0) return `${header}}`;

    return `${header}\n${indent(body).join("\n")}\n}`;
}

export function generateScalaCode(model: DiagramModel): string {
    const relationsMap = createRelationsMap(model.classes, model.relations);
    return model.classes
        .map(c => createClass(c, relationsMap.get(c.id)!))
        .join("\n\n");
}
