import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

export const visibilitySchema = z.enum(["public", "protected", "private"]);
export const classTypeSchema = z.enum(["concreteClass", "abstractClass", "trait"]);
export const relationTypeSchema = z.enum([
  "aggregation",
  "association",
  "composition",
  "dependency",
  "implementation",
  "inheritance",
]);

export const diagramFieldSchema = z.object({
  name: nonEmptyText,
  type: nonEmptyText,
  visibility: visibilitySchema,
});

export const diagramMethodSchema = z.object({
  name: nonEmptyText,
  domType: z.array(nonEmptyText),
  codType: z.string().trim(),
  visibility: visibilitySchema,
  abstract: z.boolean(),
});

export const diagramNodeSchema = z.object({
  id: z.coerce.string().trim().regex(/^\d+$/, "id debe ser numerico"),
  name: nonEmptyText,
  classType: classTypeSchema,
  fields: z.array(diagramFieldSchema),
  methods: z.array(diagramMethodSchema),
  x: z.number(),
  y: z.number(),
});

export const diagramEdgeSchema = z.object({
  source: nonEmptyText,
  target: nonEmptyText,
  sourceHandle: nonEmptyText,
  targetHandle: nonEmptyText,
  type: relationTypeSchema,
});

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const diagramPayloadSchema = z.object({
  nodes: z.array(diagramNodeSchema),
  edges: z.array(diagramEdgeSchema),
  viewport: viewportSchema.optional(),
});

export type DiagramPayload = z.infer<typeof diagramPayloadSchema>;
