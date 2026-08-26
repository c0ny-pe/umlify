// Parser léxico de Scala orientado a declaraciones: solo extrae lo que un
// diagrama de clases necesita (cabeceras, constructores, miembros y herencia).
// Los cuerpos de métodos se saltan con balanceo de llaves, nunca se interpretan.

export type ScalaVisibility = "public" | "protected" | "private";
export type ScalaKind = "class" | "abstractClass" | "trait";

export interface ScalaField {
    name: string;
    type: string;
    visibility: ScalaVisibility;
    /** true si viene de la lista de parámetros del constructor. */
    fromConstructor: boolean;
}

export interface ScalaConstructor {
    params: ScalaParam[];
    visibility: ScalaVisibility;
    /** false para los constructores auxiliares (def this). */
    isPrimary: boolean;
}

export interface ScalaMethod {
    name: string;
    params: string[];
    returnType: string | null;
    visibility: ScalaVisibility;
    isAbstract: boolean;
}

export interface ScalaTypeDecl {
    kind: ScalaKind;
    name: string;
    /** El primario primero, luego los auxiliares en orden de aparición. */
    constructors: ScalaConstructor[];
    /** Solo el estado: parámetros con val/var y miembros del cuerpo. */
    fields: ScalaField[];
    methods: ScalaMethod[];
    /** Nombres simples de los tipos en extends/with, en orden. */
    parents: string[];
}

/**
 * Parámetros del constructor primario por declaración. No son atributos, pero
 * un val del cuerpo puede inicializarse con ellos (private var saldo = saldoInicial).
 */
const constructorScope = new WeakMap<ScalaTypeDecl, ScalaParam[]>();

const MODIFIERS = new Set([
    "abstract",
    "final",
    "sealed",
    "case",
    "implicit",
    "override",
    "lazy",
    "private",
    "protected",
    "open",
    "inline",
    "transparent",
]);

const COLLECTION_TYPES = new Set([
    "List",
    "Seq",
    "Set",
    "Vector",
    "Array",
    "Iterable",
    "IndexedSeq",
    "ListBuffer",
    "ArrayBuffer",
    "Buffer",
    "Option",
]);

/** Tipos contenedores que se interpretan como agregación en el diagrama. */
export function collectionElementType(type: string): string | null {
    const match = type.trim().match(/^([A-Za-z_][\w.]*)\s*\[(.+)\]$/);
    if (!match) return null;

    const container = match[1].split(".").pop() as string;
    if (!COLLECTION_TYPES.has(container) || container === "Option") return null;

    const element = match[2].trim();
    // Solo nos interesan contenedores de un único tipo simple.
    return /^[A-Za-z_][\w.]*$/.test(element) ? element : null;
}

/**
 * Reemplaza comentarios y literales por espacios conservando posiciones y
 * saltos de línea, para que el balanceo de llaves no se confunda con texto.
 */
function maskLiterals(source: string): string {
    const out = source.split("");
    const n = source.length;

    const blank = (from: number, to: number) => {
        for (let k = from; k < to && k < n; k++) {
            if (out[k] !== "\n") out[k] = " ";
        }
    };

    let i = 0;
    while (i < n) {
        const c = source[i];

        if (c === "/" && source[i + 1] === "/") {
            let j = i;
            while (j < n && source[j] !== "\n") j++;
            blank(i, j);
            i = j;
            continue;
        }

        if (c === "/" && source[i + 1] === "*") {
            let depth = 1;
            let j = i + 2;
            while (j < n && depth > 0) {
                if (source[j] === "/" && source[j + 1] === "*") {
                    depth++;
                    j += 2;
                } else if (source[j] === "*" && source[j + 1] === "/") {
                    depth--;
                    j += 2;
                } else {
                    j++;
                }
            }
            blank(i, j);
            i = j;
            continue;
        }

        if (source.startsWith('"""', i)) {
            const end = source.indexOf('"""', i + 3);
            const j = end === -1 ? n : end + 3;
            blank(i, j);
            i = j;
            continue;
        }

        if (c === '"') {
            let j = i + 1;
            while (j < n && source[j] !== '"' && source[j] !== "\n") {
                if (source[j] === "\\") j++;
                j++;
            }
            j = Math.min(j + 1, n);
            blank(i, j);
            i = j;
            continue;
        }

        if (c === "'") {
            // Literal de caracter: 'a' o '\n'. Un ' suelto puede ser un símbolo
            // o una quote de Scala 3, y en ese caso no se toca.
            if (source[i + 1] === "\\" && source[i + 3] === "'") {
                blank(i, i + 4);
                i += 4;
                continue;
            }
            if (source[i + 2] === "'") {
                blank(i, i + 3);
                i += 3;
                continue;
            }
            i++;
            continue;
        }

        i++;
    }

    return out.join("");
}

const OPEN_TO_CLOSE: Record<string, string> = { "(": ")", "[": "]", "{": "}" };

function isSpace(c: string): boolean {
    return c === " " || c === "\t" || c === "\r" || c === "\n";
}

function isIdentStart(c: string): boolean {
    return /[A-Za-z_$`]/.test(c);
}

function isIdentPart(c: string): boolean {
    return /[A-Za-z0-9_$]/.test(c);
}

class Scanner {
    readonly masked: string;
    readonly raw: string;

    constructor(source: string) {
        this.raw = source;
        this.masked = maskLiterals(source);
    }

    skipSpaces(i: number, limit: number): number {
        let j = i;
        while (j < limit && isSpace(this.masked[j])) j++;
        return j;
    }

    /** Índice del caracter siguiente al cierre del paréntesis/corchete/llave en i. */
    matchBracket(i: number, limit: number): number {
        const open = this.masked[i];
        const close = OPEN_TO_CLOSE[open];
        if (!close) return i + 1;

        let depth = 0;
        let j = i;
        while (j < limit) {
            const c = this.masked[j];
            if (c === open) depth++;
            else if (c === close) {
                depth--;
                if (depth === 0) return j + 1;
            }
            j++;
        }
        return limit;
    }

    readIdent(i: number, limit: number): { name: string; end: number } {
        if (this.masked[i] === "`") {
            const close = this.masked.indexOf("`", i + 1);
            const end = close === -1 ? limit : close + 1;
            return { name: this.raw.slice(i + 1, end - 1), end };
        }

        let j = i;
        while (j < limit && isIdentPart(this.masked[j])) j++;
        return { name: this.masked.slice(i, j), end: j };
    }

    skipToLineEnd(i: number, limit: number): number {
        let j = i;
        while (j < limit && this.masked[j] !== "\n") j++;
        return j;
    }

    skipInlineSpaces(i: number, limit: number): number {
        let j = i;
        while (j < limit && (this.masked[j] === " " || this.masked[j] === "\t" || this.masked[j] === "\r")) j++;
        return j;
    }

    /**
     * Salta una expresión (inicializador de val o cuerpo de def): consume
     * bloques balanceados y termina en el primer salto de línea a nivel 0.
     * Los saltos de línea no se cruzan, salvo que el cuerpo abra llave debajo.
     */
    skipExpression(i: number, limit: number): number {
        let j = this.skipInlineSpaces(i, limit);

        if (this.masked[j] === "\n") {
            const next = this.skipSpaces(j, limit);
            return this.masked[next] === "{" ? this.matchBracket(next, limit) : j;
        }

        while (j < limit) {
            const c = this.masked[j];
            if (c === "\n") return j;
            if (c === "(" || c === "[" || c === "{") {
                j = this.matchBracket(j, limit);
                continue;
            }
            j++;
        }
        return limit;
    }
}

function visibilityFrom(mods: string[]): ScalaVisibility {
    if (mods.includes("private")) return "private";
    if (mods.includes("protected")) return "protected";
    return "public";
}

/** Corta por comas de primer nivel, respetando (), [] y {}. */
function splitTopLevel(text: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = "";

    for (const c of text) {
        if (c === "(" || c === "[" || c === "{") depth++;
        if (c === ")" || c === "]" || c === "}") depth--;
        if (c === "," && depth === 0) {
            parts.push(current);
            current = "";
            continue;
        }
        current += c;
    }

    if (current.trim().length > 0) parts.push(current);
    return parts;
}

export interface ScalaParam {
    name: string;
    type: string;
    visibility: ScalaVisibility;
    /** true cuando el parámetro lleva val/var y por lo tanto es estado. */
    declaresMember: boolean;
}

/** Parsea "[private] [val|var] nombre: Tipo [= default]". */
function parseParam(text: string): ScalaParam | null {
    let rest = text.trim();
    if (rest.length === 0) return null;

    const mods: string[] = [];
    let match = rest.match(/^(private|protected|implicit|using|override|final|val|var)\b\s*/);
    while (match) {
        mods.push(match[1]);
        rest = rest.slice(match[0].length);
        // private[this] val x: Int
        if (rest.startsWith("[")) {
            const close = rest.indexOf("]");
            if (close !== -1) rest = rest.slice(close + 1).trimStart();
        }
        match = rest.match(/^(private|protected|implicit|using|override|final|val|var)\b\s*/);
    }

    const colon = indexOfTopLevel(rest, ":");
    if (colon === -1) return null;

    const name = rest.slice(0, colon).trim();
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) return null;

    let type = rest.slice(colon + 1);
    const eq = indexOfTopLevel(type, "=");
    if (eq !== -1) type = type.slice(0, eq);

    const cleanType = normalizeType(type);
    if (!cleanType) return null;

    return {
        name,
        type: cleanType,
        visibility: visibilityFrom(mods),
        declaresMember: mods.includes("val") || mods.includes("var"),
    };
}

function indexOfTopLevel(text: string, char: string): number {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") depth--;
        else if (c === char && depth === 0) return i;
    }
    return -1;
}

function normalizeType(type: string): string {
    return type.replace(/\s+/g, " ").trim();
}

/** Lista de parámetros implícitos: irrelevante para el diagrama. */
function isImplicitParamList(text: string): boolean {
    return /^\s*(implicit|using)\b/.test(text);
}

export function parseScalaSource(source: string): ScalaTypeDecl[] {
    const scanner = new Scanner(source);
    const decls: ScalaTypeDecl[] = [];
    scanBlock(scanner, 0, scanner.masked.length, decls, null);
    return decls;
}

function scanBlock(
    scanner: Scanner,
    start: number,
    end: number,
    decls: ScalaTypeDecl[],
    owner: ScalaTypeDecl | null
): void {
    const s = scanner.masked;
    let i = start;
    let mods: string[] = [];

    while (i < end) {
        const c = s[i];

        if (isSpace(c)) {
            i++;
            continue;
        }

        if (c === "@") {
            const ident = scanner.readIdent(i + 1, end);
            let j = scanner.skipSpaces(ident.end, end);
            if (s[j] === "(") j = scanner.matchBracket(j, end);
            i = j;
            continue;
        }

        if (c === "{" || c === "(" || c === "[") {
            i = scanner.matchBracket(i, end);
            mods = [];
            continue;
        }

        if (!isIdentStart(c)) {
            i++;
            mods = [];
            continue;
        }

        const { name: word, end: afterWord } = scanner.readIdent(i, end);

        if (MODIFIERS.has(word)) {
            mods.push(word);
            let j = scanner.skipSpaces(afterWord, end);
            // private[paquete]
            if ((word === "private" || word === "protected") && s[j] === "[") {
                j = scanner.matchBracket(j, end);
            }
            i = j;
            continue;
        }

        switch (word) {
            case "package": {
                let j = scanner.skipSpaces(afterWord, end);
                // package objeto/ruta; si abre bloque, se recorre por dentro.
                while (j < end && !isSpace(s[j]) && s[j] !== "{") j++;
                const afterPath = scanner.skipSpaces(j, end);
                if (s[afterPath] === "{") {
                    const close = scanner.matchBracket(afterPath, end);
                    scanBlock(scanner, afterPath + 1, close - 1, decls, null);
                    i = close;
                } else {
                    i = j;
                }
                mods = [];
                break;
            }

            case "import":
            case "export": {
                i = scanner.skipToLineEnd(afterWord, end);
                mods = [];
                break;
            }

            case "class":
            case "trait":
            case "object":
            case "enum": {
                i = parseTypeDecl(scanner, afterWord, end, word, mods, decls);
                mods = [];
                break;
            }

            case "def": {
                i = parseDef(scanner, afterWord, end, mods, owner);
                mods = [];
                break;
            }

            case "val":
            case "var": {
                i = parseValDef(scanner, afterWord, end, mods, owner);
                mods = [];
                break;
            }

            case "type": {
                i = scanner.skipExpression(afterWord, end);
                mods = [];
                break;
            }

            default: {
                i = afterWord;
                mods = [];
                break;
            }
        }
    }
}

function parseTypeDecl(
    scanner: Scanner,
    afterKeyword: number,
    end: number,
    keyword: string,
    mods: string[],
    decls: ScalaTypeDecl[]
): number {
    const s = scanner.masked;
    let i = scanner.skipSpaces(afterKeyword, end);
    const { name, end: afterName } = scanner.readIdent(i, end);
    if (!name) return afterName + 1;

    i = scanner.skipSpaces(afterName, end);
    if (s[i] === "[") i = scanner.skipSpaces(scanner.matchBracket(i, end), end);

    // class Foo private (x: Int)
    while (i < end && isIdentStart(s[i])) {
        const peek = scanner.readIdent(i, end);
        if (peek.name !== "private" && peek.name !== "protected") break;
        i = scanner.skipSpaces(peek.end, end);
        if (s[i] === "[") i = scanner.skipSpaces(scanner.matchBracket(i, end), end);
    }

    const ctorParams: ScalaParam[] = [];
    let hasParamList = false;
    while (i < end && s[i] === "(") {
        hasParamList = true;
        const close = scanner.matchBracket(i, end);
        const body = scanner.masked.slice(i + 1, close - 1);
        if (!isImplicitParamList(body)) {
            splitTopLevel(body).forEach((part) => {
                const param = parseParam(part);
                if (param) ctorParams.push(param);
            });
        }
        i = scanner.skipSpaces(close, end);
    }

    const parents: string[] = [];
    while (i < end && isIdentStart(s[i])) {
        const peek = scanner.readIdent(i, end);
        if (peek.name !== "extends" && peek.name !== "with" && peek.name !== "derives") break;

        i = scanner.skipSpaces(peek.end, end);
        const parentType = readTypeRef(scanner, i, end);
        if (peek.name !== "derives" && parentType.name) parents.push(parentType.name);
        i = scanner.skipSpaces(parentType.end, end);

        // Argumentos del constructor del padre: no aportan al diagrama.
        while (i < end && (s[i] === "(" || s[i] === "[")) {
            i = scanner.skipSpaces(scanner.matchBracket(i, end), end);
        }
    }

    const isType = keyword === "class" || keyword === "trait";
    // Los parámetros de una case class son miembros públicos aunque no lleven val.
    const isCaseClass = mods.includes("case");
    const primaryParams = ctorParams.map((p) => ({
        ...p,
        declaresMember: p.declaresMember || isCaseClass,
    }));

    const decl: ScalaTypeDecl | null = isType
        ? {
              kind:
                  keyword === "trait"
                      ? "trait"
                      : mods.includes("abstract")
                      ? "abstractClass"
                      : "class",
              name,
              constructors:
                  // Un trait no tiene constructor, y una clase sin paréntesis
                  // tampoco declara uno que valga la pena mostrar.
                  keyword === "class" && hasParamList
                      ? [{ params: primaryParams, visibility: visibilityFrom(mods), isPrimary: true }]
                      : [],
              // Solo los parámetros con val/var son estado; el resto vive en la
              // firma del constructor.
              fields: primaryParams
                  .filter((p) => p.declaresMember)
                  .map((p) => ({
                      name: p.name,
                      type: p.type,
                      visibility: p.visibility,
                      fromConstructor: true,
                  })),
              methods: [],
              parents,
          }
        : null;

    // El scope de inferencia incluye los parámetros que no son estado.
    if (decl) constructorScope.set(decl, primaryParams);

    if (decl) decls.push(decl);

    if (i < end && s[i] === "{") {
        const close = scanner.matchBracket(i, end);
        scanBlock(scanner, i + 1, close - 1, decls, decl);
        return close;
    }

    return i;
}

/** Lee una referencia de tipo (Ruta.Tipo[Args]) y devuelve su nombre simple. */
function readTypeRef(
    scanner: Scanner,
    i: number,
    end: number
): { name: string; end: number } {
    const s = scanner.masked;
    let j = i;
    let last = "";

    while (j < end && isIdentStart(s[j])) {
        const ident = scanner.readIdent(j, end);
        last = ident.name;
        j = ident.end;
        if (s[j] === "[") j = scanner.matchBracket(j, end);
        if (s[j] === ".") {
            j++;
            continue;
        }
        break;
    }

    return { name: last, end: j };
}

function parseDef(
    scanner: Scanner,
    afterKeyword: number,
    end: number,
    mods: string[],
    owner: ScalaTypeDecl | null
): number {
    const s = scanner.masked;
    let i = scanner.skipSpaces(afterKeyword, end);

    let name: string;
    if (isIdentStart(s[i])) {
        const ident = scanner.readIdent(i, end);
        name = ident.name;
        i = ident.end;
    } else {
        // Métodos con nombre simbólico: +, ==, etc.
        let j = i;
        while (j < end && /[^\s(\[:={]/.test(s[j])) j++;
        name = s.slice(i, j);
        i = j;
    }

    i = scanner.skipSpaces(i, end);
    if (s[i] === "[") i = scanner.skipSpaces(scanner.matchBracket(i, end), end);

    const paramList: ScalaParam[] = [];
    while (i < end && s[i] === "(") {
        const close = scanner.matchBracket(i, end);
        const body = s.slice(i + 1, close - 1);
        if (!isImplicitParamList(body)) {
            splitTopLevel(body).forEach((part) => {
                const param = parseParam(part);
                if (param) paramList.push(param);
            });
        }
        i = scanner.skipSpaces(close, end);
    }
    const params = paramList.map((param) => param.type);

    let returnType: string | null = null;
    if (s[i] === ":") {
        const typeEnd = findSignatureEnd(scanner, i + 1, end);
        returnType = normalizeType(s.slice(i + 1, typeEnd)) || null;
        i = typeEnd;
    }

    const bodyStart = scanner.skipSpaces(i, end);
    const hasBody = s[bodyStart] === "=" || s[bodyStart] === "{";

    if (owner && name === "this") {
        owner.constructors.push({
            params: paramList,
            visibility: visibilityFrom(mods),
            isPrimary: false,
        });
    } else if (owner) {
        owner.methods.push({
            name,
            params,
            returnType,
            visibility: visibilityFrom(mods),
            isAbstract: !hasBody,
        });
    }

    if (!hasBody) return i;
    return scanner.skipExpression(bodyStart + (s[bodyStart] === "=" ? 1 : 0), end);
}

/** Fin del tipo de retorno: el "=" o "{" de nivel 0, o el salto de línea. */
function findSignatureEnd(scanner: Scanner, i: number, end: number): number {
    const s = scanner.masked;
    let j = i;

    while (j < end) {
        const c = s[j];
        if (c === "[" || c === "(") {
            j = scanner.matchBracket(j, end);
            continue;
        }
        if (c === "=" && s[j + 1] !== ">" && s[j - 1] !== "=" && s[j - 1] !== "<" && s[j - 1] !== "!") {
            return j;
        }
        if (c === "{" || c === "\n") return j;
        j++;
    }
    return end;
}

function parseValDef(
    scanner: Scanner,
    afterKeyword: number,
    end: number,
    mods: string[],
    owner: ScalaTypeDecl | null
): number {
    const s = scanner.masked;
    let i = scanner.skipSpaces(afterKeyword, end);

    // val (a, b) = ... : patrones no se representan en el diagrama.
    if (s[i] === "(") return scanner.skipExpression(i, end);

    const ident = scanner.readIdent(i, end);
    if (!ident.name) return ident.end + 1;
    i = scanner.skipSpaces(ident.end, end);

    let type: string | null = null;
    if (s[i] === ":") {
        const typeEnd = findSignatureEnd(scanner, i + 1, end);
        type = normalizeType(s.slice(i + 1, typeEnd)) || null;
        i = scanner.skipSpaces(typeEnd, end);
    }

    let valueEnd = i;
    let initializer = "";
    if (s[i] === "=") {
        valueEnd = scanner.skipExpression(i + 1, end);
        initializer = scanner.raw.slice(i + 1, valueEnd).trim();
    }

    if (owner) {
        const resolved = type ?? inferType(initializer, owner);
        owner.fields.push({
            name: ident.name,
            type: resolved,
            visibility: visibilityFrom(mods),
            fromConstructor: false,
        });
    }

    return valueEnd;
}

/** Inferencia mínima para vals sin tipo declarado. */
function inferType(initializer: string, owner: ScalaTypeDecl): string {
    const value = initializer.trim();
    if (!value) return "Any";

    if (/^(true|false)$/.test(value)) return "Boolean";
    if (/^-?\d+[lL]$/.test(value)) return "Long";
    if (/^-?\d+$/.test(value)) return "Int";
    if (/^-?\d*\.\d+[dDfF]?$/.test(value)) return value.endsWith("f") || value.endsWith("F") ? "Float" : "Double";
    if (/^".*"$/.test(value) || value.startsWith('"')) return "String";
    if (/^'.'$/.test(value)) return "Char";

    const constructed = value.match(/^new\s+([A-Za-z_][\w.]*(\s*\[[^\]]*\])?)/);
    if (constructed) return normalizeType(constructed[1]);

    const applied = value.match(/^([A-Z][\w.]*(\s*\[[^\]]*\])?)\s*\(/);
    if (applied) return normalizeType(applied[1]);

    const knownField = owner.fields.find((f) => f.name === value);
    if (knownField) return knownField.type;

    const knownParam = constructorScope.get(owner)?.find((p) => p.name === value);
    if (knownParam) return knownParam.type;

    return "Any";
}
