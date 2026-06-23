import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// POST /api/qr/generate — generate QR code for a site (auth required)
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const { site_id, label } = req.body;
    const user = (req as any).user;
    const code = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    await pool.query(
      `INSERT INTO qr_codes (org_id, site_id, code, label, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      [user.org_id, site_id || null, code, label || 'Hazard Observation Point']
    );

    const url = `${BASE_URL}/report/${code}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });

    res.json({ code, url, qr_image: qrDataUrl, label });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /api/qr/list — list all QR codes for org (auth required)
router.get('/list', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rows } = await pool.query(
      `SELECT q.*, s.name AS site_name
       FROM qr_codes q
       LEFT JOIN sites s ON q.site_id = s.id
       WHERE q.org_id = $1
       ORDER BY q.created_at DESC`,
      [user.org_id]
    );

    // Re-generate QR images
    const result = await Promise.all(rows.map(async (r) => {
      const url = `${BASE_URL}/report/${r.code}`;
      const qr_image = await QRCode.toDataURL(url, { width: 200 });
      return { ...r, url, qr_image };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list QR codes' });
  }
});

// GET /api/qr/:code — public — get site info for QR scan
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.code, q.label, q.is_active, s.name AS site_name, o.name AS org_name
       FROM qr_codes q
       LEFT JOIN sites s ON q.site_id = s.id
       JOIN organizations o ON q.org_id = o.id
       WHERE q.code = $1`,
      [req.params.code]
    );
    if (!rows[0] || !rows[0].is_active) {
      return res.status(404).json({ error: 'QR code not found or inactive' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to lookup QR code' });
  }
});

// POST /api/qr/:code/report — public — submit observation via QR
router.post('/:code/report', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { observer_name, observation_type, description, risk_rating, gps_lat, gps_lng } = req.body;

    const { rows: qrRows } = await pool.query(
      `SELECT q.org_id, q.site_id FROM qr_codes q WHERE q.code = $1 AND q.is_active = true`,
      [code]
    );
    if (!qrRows[0]) return res.status(404).json({ error: 'Invalid QR code' });

    const { org_id, site_id } = qrRows[0];

    // Generate reference number
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM observations WHERE org_id = $1`, [org_id]
    );
    const ref = `OBS-${String(parseInt(countRows[0].count) + 1).padStart(5, '0')}`;

    const { rows } = await pool.query(
      `INSERT INTO observations
         (org_id, site_id, reference_no, observation_type, status, title, description,
          risk_rating, gps_lat, gps_lng, observation_date)
       VALUES ($1,$2,$3,$4,'OPEN',$5,$6,$7,$8,$9,CURRENT_DATE)
       RETURNING id, reference_no`,
      [org_id, site_id, ref,
       observation_type || 'UNSAFE_CONDITION',
       `QR Report by ${observer_name || 'Anonymous'}`,
       description, risk_rating || 'LOW',
       gps_lat || null, gps_lng || null]
    );

    res.status(201).json({ success: true, reference_no: rows[0].reference_no });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit observation' });
  }
});

export default router;
