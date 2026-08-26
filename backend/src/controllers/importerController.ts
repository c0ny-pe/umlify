import { Request, Response } from 'express';
import { buildDiagramFromScala } from '../importer/diagramBuilder';
import { diagramPayloadSchema } from '../schemas/diagramSchemas';

export async function importScalaCode(req: Request, res: Response) {
    const { code } = req.body as { code: string };

    try {
        const diagram = buildDiagramFromScala(code);

        if (diagram.nodes.length === 0) {
            res.status(422).json({
                error: 'No se encontraron clases ni traits en el código entregado',
            });
            return;
        }

        const parsed = diagramPayloadSchema.safeParse(diagram);

        if (!parsed.success) {
            res.status(422).json({
                error: 'El código produjo un diagrama inválido',
                details: parsed.error.issues.map((issue) => issue.message),
            });
            return;
        }

        res.status(200).json(parsed.data);
    } catch (err) {
        res.status(500).json({ error: 'Error al interpretar el código Scala' });
    }
}
