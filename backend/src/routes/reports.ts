import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

const ALLOWED: Record<string, string> = {
  incidents: 'incidents',
  observations: 'observations',
  corrective_actions: 'corrective_actions',
  permits: 'permits',
  audits: 'audits',
  training_records: 'training_records',
};

router.get('/summary/:entity', async (req: AuthRequest, res: Response) => {
  try {
    const table = ALLOWED[req.params.entity];
    if (!table) {
      res.status(400).json({ error: 'Unsupported report entity' });
      return;
    }
    const result = await query(
      `SELECT status, COUNT(*)::int c FROM ${table} WHERE org_id=$1 GROUP BY status`,
      [req.user!.org_id]
    );
    res.json({ entity: req.params.entity, breakdown: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/:entity', async (req: AuthRequest, res: Response) => {
  try {
    const table = ALLOWED[req.params.entity];
    if (!table) {
      res.status(400).json({ error: 'Unsupported report entity' });
      return;
    }
    const result = await query(
      `SELECT * FROM ${table} WHERE org_id=$1 ORDER BY created_at DESC LIMIT 5000`,
      [req.user!.org_id]
    );
    const rows = result.rows;
    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.send('');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = r[h];
            if (v === null || v === undefined) return '';
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
