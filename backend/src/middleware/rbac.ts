import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Role hierarchy: higher roles inherit lower-role abilities implicitly via wildcard.
const ROLE_WILDCARD = ['system_owner', 'admin'];

/**
 * Require one of the given roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (ROLE_WILDCARD.includes(req.user.role) || roles.includes(req.user.role)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Insufficient role' });
  };
}

/**
 * Require a specific permission string. system_owner/admin bypass.
 * Permissions come from the role's permissions JSONB array, embedded in JWT.
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (ROLE_WILDCARD.includes(req.user.role)) {
      next();
      return;
    }
    const perms = req.user.permissions || [];
    if (perms.includes('*') || perms.includes(permission)) {
      next();
      return;
    }
    res.status(403).json({ error: `Missing permission: ${permission}` });
  };
}
