import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Debug logging
  console.log('[Auth] Request URL:', req.path);
  console.log('[Auth] Method:', req.method);
  console.log('[Auth] Auth Header:', authHeader ? 'Present' : 'Missing');
  console.log('[Auth] Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('[Auth] REJECTED: No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
    };
    req.user = decoded;
    console.log('[Auth] APPROVED: User', decoded.email, 'with role', decoded.role);
    next();
  } catch (error) {
    console.log('[Auth] REJECTED: Invalid token -', error instanceof Error ? error.message : 'Unknown error');
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log('[Authz] Checking roles for:', req.path);
    console.log('[Authz] User:', req.user);
    console.log('[Authz] Allowed roles:', allowedRoles);
    
    if (!req.user) {
      console.log('[Authz] REJECTED: No user in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('[Authz] REJECTED: User role', req.user.role, 'not in', allowedRoles);
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource' 
      });
    }

    console.log('[Authz] APPROVED: User role', req.user.role, 'is authorized');
    next();
  };
};
