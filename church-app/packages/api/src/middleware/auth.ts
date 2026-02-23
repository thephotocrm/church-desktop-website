import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthPayload {
  userId: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  globalRole: 'super_admin' | 'admin' | 'pastor' | 'staff' | 'member';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
    // Invalid token — treat as unauthenticated guest
  }
  next();
}

export function requireActive(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.status !== 'active') {
    res.status(403).json({ error: 'Account not active' });
    return;
  }
  next();
}

export function requireRole(...roles: AuthPayload['globalRole'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.globalRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
