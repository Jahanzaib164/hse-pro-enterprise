import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../config/database';

/**
 * Records an audit log entry for mutating requests after they succeed.
 */
export function auditLog(action: string, entityType: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = (req.params && (req.params.id as string)) || null;
        query(
          `INSERT INTO audit_logs(org_id, user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            req.user.org_id,
            req.user.id,
            action,
            entityType,
            entityId,
            req.body ? JSON.stringify(req.body) : null,
            req.ip,
            req.headers['user-agent'] || null,
          ]
        ).catch(() => {
          /* swallow audit errors */
        });
      }
    });
    next();
  };
}
