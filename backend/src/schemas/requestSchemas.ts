import { z } from 'zod';
import { diagramPayloadSchema } from './diagramSchemas';

const nonEmptyText = z.string().trim().min(1);

export const userRegisterBodySchema = z.object({
  username: nonEmptyText,
  password: nonEmptyText,
});

export const userLoginBodySchema = z.object({
  username: nonEmptyText,
  password: nonEmptyText,
});

export const userUpdateBodySchema = z.object({
  username: nonEmptyText,
});

export const userIdParamsSchema = z.object({
  id: z.coerce.string().refine((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
  }, 'id debe ser un entero positivo'),
});

export const userDiagramsParamsSchema = z.object({
  user_id: z.coerce.string().refine((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
  }, 'user_id debe ser un entero positivo'),
});

export const uploadDiagramBodySchema = z.object({
  name: nonEmptyText,
  content: diagramPayloadSchema,
});

export const updateDiagramBodySchema = z.object({
  name: nonEmptyText,
  content: diagramPayloadSchema,
});

export const generateCodeBodySchema = diagramPayloadSchema;
