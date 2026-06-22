import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { query } from '../config/database';
import {
  listNotifications,
  markRead,
} from '../services/notificationService';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'safety_officer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, department, job_title, phone, is_active, mfa_enabled, last_login, created_at
       FROM users WHERE org_id=$1 ORDER BY created_at DESC`,
      [req.user!.org_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const rows = await listNotifications(req.user!.id);
    res.json({ data: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    await markRead(req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, department, job_title, phone, avatar_url, is_active, mfa_enabled, last_login
       FROM users WHERE id=$1 AND org_id=$2`,
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

router.post('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, first_name, last_name, role, department, job_title, phone } =
      req.body;
    const hash = await bcrypt.hash(password || 'ChangeMe123!', 10);
    const result = await query(
      `INSERT INTO users(org_id, email, password_hash, first_name, last_name, role, department, job_title, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, email, first_name, last_name, role`,
      [req.user!.org_id, email, hash, first_name, last_name, role || 'worker', department, job_title, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['first_name', 'last_name', 'role', 'department', 'job_title', 'phone', 'is_active'];
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        sets.push(`${f}=$${i++}`);
        values.push(req.body[f]);
      }
    }
    if (!sets.length) {
      res.status(400).json({ error: 'No fields' });
      return;
    }
    values.push(req.params.id, req.user!.org_id);
    const result = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id=$${i++} AND org_id=$${i} RETURNING id, email, role`,
      values
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
