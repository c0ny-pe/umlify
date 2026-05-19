import { Request, Response } from 'express';
import { createUser, getUserByCredentials, getUserById } from '../models/user';
import { signAccessToken } from '../utils/auth';

export async function registerUser(req: Request, res: Response) {
  const { username, password } = req.body;
  try {
    const user = await createUser(username, password);
    const token = signAccessToken({ id: user.id, username: user.username });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el usuario' });
  }
}

export async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const user = await getUserByCredentials(username, password);

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = signAccessToken({ id: user.id, username: user.username });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
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
