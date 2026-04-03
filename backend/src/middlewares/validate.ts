import { RequestHandler } from 'express';
import { ZodType } from 'zod';

const formatIssues = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((issue) => ({
    path: issue.path.map((part) => String(part)).join('.'),
    message: issue.message,
  }));

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Body inválido',
        details: formatIssues(result.error.issues),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

export const validateParams = <T extends Record<string, string>>(
  schema: ZodType<T>
): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        error: 'Parámetros inválidos',
        details: formatIssues(result.error.issues),
      });
      return;
    }

    req.params = result.data;
    next();
  };
};
