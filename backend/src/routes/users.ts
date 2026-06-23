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

// MY PROFILE
router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['first_name', 'last_name', 'phone', 'job_title', 'department'];
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const f of allowed) {
      if (req.body[f] !== undefined) { sets.push(`${f}=$${i++}`); values.push(req.body[f]); }
    }
    if (!sets.length) { res.status(400).json({ error: 'No fields to update' }); return; }
    values.push(req.user!.id);
    const result = await query(
      `UPDATE users SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${i} RETURNING id, first_name, last_name, email, role, phone, job_title, department, mfa_enabled`,
      values
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// CHANGE PASSWORD
router.post('/me/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) { res.status(400).json({ error: 'Missing fields' }); return; }
    const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user!.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) { res.status(401).json({ error: 'Current password incorrect' }); return; }
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// LIST SESSIONS
router.get('/me/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT id, device_info, ip_address, created_at FROM user_sessions
       WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// REVOKE SESSION
router.delete('/me/sessions/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `UPDATE user_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2`,
      [req.params.sessionId, req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// MFA SETUP
router.post('/me/mfa/setup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const speakeasy = await import('speakeasy');
    const qrcode = await import('qrcode');
    const secret = speakeasy.default.generateSecret({ name: `HSE Pro (${req.user!.email})` });
    await query('UPDATE users SET mfa_secret=$1 WHERE id=$2', [secret.base32, req.user!.id]);
    const qr_code = await qrcode.default.toDataURL(secret.otpauth_url!);
    res.json({ qr_code, secret: secret.base32 });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// MFA DISABLE
router.delete('/me/mfa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE users SET mfa_enabled=false, mfa_secret=NULL WHERE id=$1', [req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
