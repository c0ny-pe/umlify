import { Class, ClassRelations, DiagramModel, Relation } from "../types/generator";

function formatParams(params: string[]): string {
    return params
        .map((type, index) => `param${index + 1}: ${type}`)
        .join(", ");
}

function indent(lines: string[], spaces = 2): string[] {
    const pad = " ".repeat(spaces);
    return lines.map((l) => (l === "" ? "" : `${pad}${l}`));
}

function formatField(f: Class["fields"][number]): string {
    const vis = f.visibility && f.visibility !== "public" ? f.visibility + " " : "";
    return `${vis}val ${f.name}: ${f.type}`;
}

function formatMethodSignature(m: Class["methods"][number]): string {
    const visibility = m.visibility && m.visibility !== "public" ? m.visibility + " " : "";
    const returnType = m.codType && m.codType.trim().length > 0 ? m.codType : "Unit";
    return `${visibility}def ${m.name}(${formatParams(m.domType)}): ${returnType}`;
}

function buildInheritanceClause(rel: ClassRelations): string {
    let inheritance = "";

    if (rel.extendsClass) inheritance += ` extends ${rel.extendsClass}`;
    if (rel.withTraits.length) {
        const keyword = rel.extendsClass ? "with" : "extends";
        inheritance += ` ${keyword} ${rel.withTraits.join(" with ")}`;
    }

    return inheritance;
}

function createRelationsMap(classes: Class[], relations: Relation[]) {
    const idtoClass = new Map(classes.map(c => [c.id, c]));
    const relationsMap = new Map<string, ClassRelations>();

    // Inicializamos los tipos de relaciones
    classes.forEach(c =>
        relationsMap.set(c.id, {
            extendsClass: null,
            withTraits: [],
            associations: [],
            aggregations: [],
        })
    );

    // los rellenamos
    relations.forEach(r => {
        const sourceRel = relationsMap.get(r.source);
        const targetClass = idtoClass.get(r.target);
        if (!sourceRel || !targetClass) return;

        switch (r.type) {
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
            case "dependency":
                sourceRel.associations.push(targetClass.name);
                break;
            case "aggregation":
                sourceRel.aggregations.push(targetClass.name);
                break;
        }
    })

    return relationsMap;
}

function createTraitHeader(cls: Class, rel: ClassRelations): string {
    return `trait ${cls.name}${buildInheritanceClause(rel)} {`;
}

function hasManualAssociationField(cls: Class, associationTargetName: string): boolean {
    return cls.fields.some(
        (field) => field.type.trim().toLowerCase() === associationTargetName.toLowerCase()
    );
}

function hasManualAggregationField(cls: Class, aggregationTargetName: string): boolean {
    return hasManualAssociationField(cls, aggregationTargetName);
}

function createTraitBody(cls: Class, rel: ClassRelations): string[] {
    const body: string[] = [];

    // Solo agregar fields de asociación si no existen manualmente
    rel.associations.forEach((a) => {
        const fieldExists = hasManualAssociationField(cls, a);
        if (!fieldExists) {
            body.push(`val ${a.toLowerCase()}: ${a} = ???`);
        }
    });

    rel.aggregations.forEach((a) => {
        const fieldExists = hasManualAggregationField(cls, a);
        if (!fieldExists) {
            body.push(`val ${a.toLowerCase()}: ${a} = ???`);
        }
    });

    // ver que no se repitan
    if ((rel.associations.length || rel.aggregations.length) && cls.fields.length) body.push("");
    cls.fields.forEach((f) => body.push(formatField(f)));
    if (cls.fields.length && cls.methods.length) body.push("");

    cls.methods.forEach((m) => {
        const signature = formatMethodSignature(m);
        body.push(m.abstract ? signature : `${signature} = ???`);
    });

    return body;
}

function createClassHeader(cls: Class, rel: ClassRelations): string {
    const constructorParams = cls.fields.map(formatField);
    const params = constructorParams.length ? `(${constructorParams.join(", ")})` : "";
    const keyword = cls.classType === "abstractClass" ? "abstract class" : "class";

    return `${keyword} ${cls.name}${params}${buildInheritanceClause(rel)} {`;
}

function createClassBody(cls: Class, rel: ClassRelations): string[] {
    const body: string[] = [];

    // Solo agregar fields de asociación si no existen manualmente
    rel.associations.forEach((a) => {
        const fieldExists = hasManualAssociationField(cls, a);
        if (!fieldExists) {
            body.push(`val ${a.toLowerCase()}: ${a} = ???`);
        }
    });

    rel.aggregations.forEach((a) => {
        const fieldExists = hasManualAggregationField(cls, a);
        if (!fieldExists) {
            body.push(`val ${a.toLowerCase()}: ${a} = ???`);
        }
    });

    if ((rel.associations.length || rel.aggregations.length) && cls.methods.length) body.push("");

    cls.methods.forEach((m) => {
        const signature = formatMethodSignature(m);
        body.push(m.abstract ? signature : `${signature} = ???`);
    });

    return body;
}

function createTrait(cls: Class, rel: ClassRelations): string {
    const header = createTraitHeader(cls, rel);
    const body = createTraitBody(cls, rel);

    if (body.length === 0) return `${header}}`;

    return `${header}\n${indent(body).join("\n")}\n}`;
}

function createClass(cls: Class, rel: ClassRelations): string {
    const header = createClassHeader(cls, rel);
    const body = createClassBody(cls, rel);

    if (body.length === 0) return `${header}}`;

    return `${header}\n${indent(body).join("\n")}\n}`;
}

function createNodeCode(cls: Class, rel: ClassRelations): string {
    return cls.classType === "trait"
        ? createTrait(cls, rel)
        : createClass(cls, rel);
}

export function generateScalaCode(model: DiagramModel): string {
    const relationsMap = createRelationsMap(model.classes, model.relations);
    return model.classes
        .map((c) => createNodeCode(c, relationsMap.get(c.id)!))
        .join("\n\n");
}
