import { Request, Response } from 'express';
import { JSONDiagram } from '../types/generator';
import { parseDiagram } from '../generator/parser';
import { generateScalaCode } from '../generator/generator';

export async function generateCode(req: Request, res: Response) {
    const diagram = req.body as JSONDiagram;

    if (!diagram.nodes || !diagram.edges) {
        res.status(400).json({ error: 'El diagrama debe contener nodos y aristas' });
        return;
    }

    try {
        const model = parseDiagram(diagram);
        const code = generateScalaCode(model);

        res.type('text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="diagram.scala"');
        res.status(200).send(code);
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el código Scala' });
    }
}