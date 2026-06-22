import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

interface CrudOptions {
  table: string;
  // columns clients may set on create/update
  writable: string[];
  // generate a reference number column + prefix when creating
  referenceColumn?: string;
  referencePrefix?: string;
  // org scoping column (default org_id)
  orgColumn?: string;
}

function isSafeIdentifier(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(name);
}

export function buildCrudRouter(opts: CrudOptions): Router {
  const router = Router();
  const orgCol = opts.orgColumn || 'org_id';
  const { table, writable } = opts;

  if (!isSafeIdentifier(table)) {
    throw new Error(`Unsafe table name: ${table}`);
  }

  router.use(authenticate);

  // LIST with pagination + simple filters
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
      const offset = parseInt((req.query.offset as string) || '0', 10);
      const params: any[] = [req.user!.org_id];
      let where = `WHERE ${orgCol} = $1`;
      let idx = 2;

      if (req.query.status) {
        where += ` AND status = $${idx++}`;
        params.push(req.query.status);
      }
      if (req.query.project_id) {
        where += ` AND project_id = $${idx++}`;
        params.push(req.query.project_id);
      }

      params.push(limit, offset);
      const sql = `SELECT * FROM ${table} ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
      const result = await query(sql, params);
      const countResult = await query(
        `SELECT COUNT(*)::int AS total FROM ${table} ${where}`,
        params.slice(0, params.length - 2)
      );
      res.json({ data: result.rows, total: countResult.rows[0].total, limit, offset });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET ONE
  router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        `SELECT * FROM ${table} WHERE id=$1 AND ${orgCol}=$2`,
        [req.params.id, req.user!.org_id]
      );
      if (!result.rows[0]) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // CREATE
  router.post('/', async (req: AuthRequest, res: Response) => {
    try {
      const cols: string[] = [orgCol];
      const placeholders: string[] = ['$1'];
      const values: any[] = [req.user!.org_id];
      let i = 2;

      for (const col of writable) {
        if (req.body[col] !== undefined) {
          if (!isSafeIdentifier(col)) continue;
          cols.push(col);
          placeholders.push(`$${i++}`);
          values.push(req.body[col]);
        }
      }

      if (opts.referenceColumn && opts.referencePrefix) {
        const year = new Date().getFullYear();
        const ref = `${opts.referencePrefix}-${year}-${uuidv4().slice(0, 6).toUpperCase()}`;
        cols.push(opts.referenceColumn);
        placeholders.push(`$${i++}`);
        values.push(ref);
      }

      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      const result = await query(sql, values);
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // UPDATE
  router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      for (const col of writable) {
        if (req.body[col] !== undefined && isSafeIdentifier(col)) {
          sets.push(`${col} = $${i++}`);
          values.push(req.body[col]);
        }
      }
      if (sets.length === 0) {
        res.status(400).json({ error: 'No updatable fields provided' });
        return;
      }
      values.push(req.params.id, req.user!.org_id);
      const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id=$${i++} AND ${orgCol}=$${i} RETURNING *`;
      const result = await query(sql, values);
      if (!result.rows[0]) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        `DELETE FROM ${table} WHERE id=$1 AND ${orgCol}=$2 RETURNING id`,
        [req.params.id, req.user!.org_id]
      );
      if (!result.rows[0]) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ deleted: result.rows[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
