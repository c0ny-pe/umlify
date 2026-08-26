import { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const csrfHeader = req.headers['x-csrf-token'];

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !decoded.id ||
      !decoded.csrf ||
      decoded.csrf !== csrfHeader
    ) {
      res.status(401).json({ error: 'invalid token' });
      return;
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
};
