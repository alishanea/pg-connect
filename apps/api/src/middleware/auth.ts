import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types/enums';
import { UserPayload } from './tenantScope';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pg-connect-jwt-key-change-in-production';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header token',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token',
      },
    });
  }
}

export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: requires one of roles [${allowedRoles.join(', ')}]`,
        },
      });
    }

    next();
  };
}
