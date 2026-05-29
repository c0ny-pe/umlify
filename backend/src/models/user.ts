import pool from '../db';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  password: string;
}

export type PublicUser = Omit<User, 'password'>;

function toPublicUser(user: User | null): PublicUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

export async function createUser(username: string, password: string): Promise<PublicUser> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const result = await pool.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
    [username, hash]
  );
  return toPublicUser(result.rows[0]) as PublicUser;
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return toPublicUser(result.rows[0] || null);
}

export async function getUserByCredentials(
  username: string,
  password: string
): Promise<PublicUser | null> {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0] as User | undefined;

  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return toPublicUser(user) as PublicUser;
}

export async function updateUserUsername(id: number, username: string): Promise<PublicUser | null> {
  const result = await pool.query(
    'UPDATE users SET username = $1 WHERE id = $2 RETURNING *',
    [username, id]
  );

  return toPublicUser(result.rows[0] || null);
}
