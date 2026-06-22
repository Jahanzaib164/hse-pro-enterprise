import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface AuthUser {
  id: string;
  org_id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
