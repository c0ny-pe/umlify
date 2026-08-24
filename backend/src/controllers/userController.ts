import crypto from 'crypto';
import { Request, Response } from 'express';
import { createUser, getUserByCredentials, getUserById, updateUserUsername } from '../models/user';
import { signAccessToken } from '../utils/auth';

function setSessionCookie(res: Response, id: number, username: string) {
  const csrf = crypto.randomUUID();
  const token = signAccessToken({ id, username, csrf });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.setHeader('X-CSRF-Token', csrf);
}

export async function registerUser(req: Request, res: Response) {
  const { username, password } = req.body;
  try {
    const user = await createUser(username, password);
    setSessionCookie(res, user.id, user.username);
    res.status(201).json({ user });
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

    setSessionCookie(res, user.id, user.username);
    res.json({ user });
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

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
}

export async function logoutUser(_req: Request, res: Response) {
  res.clearCookie('token');
  res.status(200).json({ ok: true });
}

export async function updateCurrentUser(req: Request, res: Response) {
  const { username } = req.body;

  try {
    const updatedUser = await updateUserUsername(req.userId!, username);

    if (!updatedUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    setSessionCookie(res, updatedUser.id, updatedUser.username);
    res.json({ user: updatedUser });
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      return;
    }

    res.status(500).json({ error: 'No se pudo actualizar el usuario' });
  }
}
