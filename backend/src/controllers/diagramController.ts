import { Request, Response } from 'express';
import { createDiagram, getDiagramsByUserId, getDiagramById, updateDiagram, deleteDiagram } from '../models/diagram';

export async function uploadDiagram(req: Request, res: Response) {
  const { name, content } = req.body;
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'usuario no autenticado' });
    return;
  }

  try {
    const diagram = await createDiagram(Number(user.id), name, content);
    res.status(201).json(diagram);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo guardar el diagrama' });
  }
}

export async function listUserDiagrams(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'usuario no autenticado' });
    return;
  }

  try {
    const diagrams = await getDiagramsByUserId(Number(user.id));
    res.json(diagrams);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los diagramas' });
  }
}

export async function getDiagram(req: Request, res: Response) {
  const id = req.params.id as string;
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'usuario no autenticado' });
    return;
  }

  try {
    const diagram = await getDiagramById(id);
    if (!diagram) {
      res.status(404).json({ error: 'Diagrama no encontrado' });
      return;
    }

    // verify ownership
    if (diagram.user_id !== Number(user.id)) {
      res.status(403).json({ error: 'No tienes permiso para acceder a este diagrama' });
      return;
    }

    res.json(diagram);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el diagrama' });
  }
}

export async function updateDiagramHandler(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name, content } = req.body;
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'usuario no autenticado' });
    return;
  }

  try {
    const diagram = await getDiagramById(id);
    if (!diagram) {
      res.status(404).json({ error: 'Diagrama no encontrado' });
      return;
    }

    // verify ownership
    if (diagram.user_id !== Number(user.id)) {
      res.status(403).json({ error: 'No tienes permiso para editar este diagrama' });
      return;
    }

    const updated = await updateDiagram(id, name, content);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar el diagrama' });
  }
}

export async function deleteDiagramHandler(req: Request, res: Response) {
  const id = req.params.id as string;
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'usuario no autenticado' });
    return;
  }

  try {
    const diagram = await getDiagramById(id);
    if (!diagram) {
      res.status(404).json({ error: 'Diagrama no encontrado' });
      return;
    }

    // verify ownership
    if (diagram.user_id !== Number(user.id)) {
      res.status(403).json({ error: 'No tienes permiso para eliminar este diagrama' });
      return;
    }

    await deleteDiagram(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el diagrama' });
  }
}
