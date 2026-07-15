import { z } from 'zod';

const nonEmptyText = z.string().trim().min(1);

export const visibilitySchema = z.enum(['public', 'protected', 'private']);
export const classTypeSchema = z.enum(['concreteClass', 'abstractClass', 'trait']);
// El subconjunto del curso no expone composition en el editor.
// dependency se mantiene en el payload porque se normaliza como asociación en la exportación.
export const relationTypeSchema = z.enum([
  'aggregation',
  'association',
  'dependency',
  'implementation',
  'inheritance',
]);

export const diagramFieldSchema = z.object({
  name: nonEmptyText,
  type: nonEmptyText,
  visibility: visibilitySchema.nullable().optional(),
});

export const diagramMethodSchema = z.object({
  name: nonEmptyText,
  domType: z.array(nonEmptyText),
  codType: z.string().trim().nullable().optional(),
  visibility: visibilitySchema.nullable().optional(),
  abstract: z.boolean(),
});

export const diagramNodeSchema = z.object({
  id: z.coerce.string().trim().regex(/^\d+$/, 'id debe ser numérico'),
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
