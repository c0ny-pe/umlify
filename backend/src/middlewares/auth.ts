import { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/auth';

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'token missing or invalid' });
    return;
  }

  const token = auth.substring(7);
  try {
    const decoded = verifyAccessToken(token);
    // attach user info to request
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'token invalid' });
  }
};
