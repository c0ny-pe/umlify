import { Request, Response } from 'express';
import { createDiagram, getDiagramsByUserId } from '../models/diagram';

export async function uploadDiagram(req: Request, res: Response) {
  const { user_id, name, content } = req.body;
  try {
    const diagram = await createDiagram(Number(user_id), name, content);
    res.status(201).json(diagram);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo guardar el diagrama' });
  }
}

export async function listUserDiagrams(req: Request, res: Response) {
  const { user_id } = req.params;
  try {
    const diagrams = await getDiagramsByUserId(Number(user_id));
    res.json(diagrams);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los diagramas' });
  }
}
