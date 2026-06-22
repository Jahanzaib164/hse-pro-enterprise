import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { body } from 'express-validator';
import { query } from '../config/database';
import { validate } from '../middleware/validation';
import { signAccessToken, authenticate, AuthRequest, AuthUser } from '../middleware/auth';

const router = Router();
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function loadPermissions(userId: string): Promise<string[]> {
  const result = await query(
    `SELECT r.permissions FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const perms = new Set<string>();
  for (const row of result.rows) {
    const list = Array.isArray(row.permissions) ? row.permissions : [];
    list.forEach((p: string) => perms.add(p));
  }
  return Array.from(perms);
}

function issueTokens(user: AuthUser): { accessToken: string; refreshToken: string } {
  const accessToken = signAccessToken(user);
  const refreshToken = jwt.sign(
    { id: user.id, org_id: user.org_id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

async function persistRefresh(userId: string, refreshToken: string, req: Request) {
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await query(
    `INSERT INTO user_sessions(user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      userId,
      hashToken(refreshToken),
      JSON.stringify({ ua: req.headers['user-agent'] || '' }),
      req.ip,
      expires,
    ]
  );
}

// REGISTER
router.post(
  '/register',
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('org_id').notEmpty(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { email, password, first_name, last_name, org_id, role, department, job_title } =
        req.body;
      const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.rows[0]) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      const hash = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users(org_id, email, password_hash, first_name, last_name, role, department, job_title)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, org_id, email, first_name, last_name, role`,
        [org_id, email, hash, first_name, last_name, role || 'worker', department, job_title]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// LOGIN
router.post(
  '/login',
  validate([body('email').isEmail(), body('password').notEmpty()]),
  async (req: Request, res: Response) => {
    try {
      const { email, password, mfa_token } = req.body;
      const result = await query('SELECT * FROM users WHERE email=$1', [email]);
      const user = result.rows[0];
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        res.status(423).json({ error: 'Account locked. Try again later.' });
        return;
      }
      if (!user.is_active) {
        res.status(403).json({ error: 'Account disabled' });
        return;
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        const attempts = user.failed_login_attempts + 1;
        const lock =
          attempts >= MAX_FAILED
            ? new Date(Date.now() + LOCK_MINUTES * 60000)
            : null;
        await query(
          'UPDATE users SET failed_login_attempts=$1, locked_until=$2 WHERE id=$3',
          [attempts, lock, user.id]
        );
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      if (user.mfa_enabled) {
        if (!mfa_token) {
          res.status(200).json({ mfa_required: true });
          return;
        }
        const verified = speakeasy.totp.verify({
          secret: user.mfa_secret,
          encoding: 'base32',
          token: mfa_token,
          window: 1,
        });
        if (!verified) {
          res.status(401).json({ error: 'Invalid MFA token' });
          return;
        }
      }

      await query(
        'UPDATE users SET failed_login_attempts=0, locked_until=NULL, last_login=now() WHERE id=$1',
        [user.id]
      );

      const permissions = await loadPermissions(user.id);
      const authUser: AuthUser = {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        role: user.role,
        permissions,
      };
      const { accessToken, refreshToken } = issueTokens(authUser);
      await persistRefresh(user.id, refreshToken, req);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          org_id: user.org_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          mfa_enabled: user.mfa_enabled,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// REFRESH
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Missing refresh token' });
      return;
    }
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    const session = await query(
      `SELECT * FROM user_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at > now()`,
      [hashToken(refreshToken)]
    );
    if (!session.rows[0]) {
      res.status(401).json({ error: 'Session expired or revoked' });
      return;
    }
    const userResult = await query('SELECT * FROM users WHERE id=$1', [decoded.id]);
    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const permissions = await loadPermissions(user.id);
    const accessToken = signAccessToken({
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      role: user.role,
      permissions,
    });
    res.json({ accessToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query(
        'UPDATE user_sessions SET revoked_at=now() WHERE token_hash=$1',
        [hashToken(refreshToken)]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MFA SETUP
router.post('/mfa/setup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `HSE Pro (${req.user!.email})`,
    });
    await query('UPDATE users SET mfa_secret=$1 WHERE id=$2', [
      secret.base32,
      req.user!.id,
    ]);
    const qr = await qrcode.toDataURL(secret.otpauth_url || '');
    res.json({ secret: secret.base32, qr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MFA VERIFY/ENABLE
router.post('/mfa/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const result = await query('SELECT mfa_secret FROM users WHERE id=$1', [
      req.user!.id,
    ]);
    const secret = result.rows[0]?.mfa_secret;
    if (!secret) {
      res.status(400).json({ error: 'MFA not set up' });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    await query('UPDATE users SET mfa_enabled=true WHERE id=$1', [req.user!.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MFA DISABLE
router.post('/mfa/disable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      'UPDATE users SET mfa_enabled=false, mfa_secret=NULL WHERE id=$1',
      [req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CURRENT USER
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, org_id, email, first_name, last_name, role, department, job_title, phone, avatar_url, mfa_enabled
       FROM users WHERE id=$1`,
      [req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
