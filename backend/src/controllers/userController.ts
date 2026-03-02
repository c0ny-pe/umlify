import { Request, Response } from 'express';
import { createUser, getUserById } from '../models/user';

export async function registerUser(req: Request, res: Response) {
  const { username, password } = req.body;
  try {
    const user = await createUser(username, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el usuario' });
  }
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await getUserById(Number(id));
    if (user) res.json(user);
    else res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
}
