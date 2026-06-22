import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/kpis', async (req: AuthRequest, res: Response) => {
  try {
    const org = req.user!.org_id;
    const [
      incidents,
      openIncidents,
      observations,
      openObs,
      capa,
      overdueCapa,
      permits,
      activePermits,
      training,
      audits,
    ] = await Promise.all([
      query(`SELECT COUNT(*)::int c FROM incidents WHERE org_id=$1`, [org]),
      query(`SELECT COUNT(*)::int c FROM incidents WHERE org_id=$1 AND status NOT IN ('CLOSED','VERIFIED')`, [org]),
      query(`SELECT COUNT(*)::int c FROM observations WHERE org_id=$1`, [org]),
      query(`SELECT COUNT(*)::int c FROM observations WHERE org_id=$1 AND status='OPEN'`, [org]),
      query(`SELECT COUNT(*)::int c FROM corrective_actions WHERE org_id=$1`, [org]),
      query(`SELECT COUNT(*)::int c FROM corrective_actions WHERE org_id=$1 AND status NOT IN ('CLOSED','VERIFIED','COMPLETED') AND due_date < CURRENT_DATE`, [org]),
      query(`SELECT COUNT(*)::int c FROM permits WHERE org_id=$1`, [org]),
      query(`SELECT COUNT(*)::int c FROM permits WHERE org_id=$1 AND status='ACTIVE'`, [org]),
      query(`SELECT COUNT(*)::int c FROM training_records WHERE org_id=$1 AND status='COMPLETED'`, [org]),
      query(`SELECT COUNT(*)::int c FROM audits WHERE org_id=$1`, [org]),
    ]);

    const severity = await query(
      `SELECT severity, COUNT(*)::int c FROM incidents WHERE org_id=$1 GROUP BY severity`,
      [org]
    );

    const ltiResult = await query(
      `SELECT COALESCE(SUM(lost_time_days),0)::int days,
              COUNT(*) FILTER (WHERE lost_time_days > 0)::int lti_count
       FROM incidents WHERE org_id=$1`,
      [org]
    );

    res.json({
      totals: {
        incidents: incidents.rows[0].c,
        open_incidents: openIncidents.rows[0].c,
        observations: observations.rows[0].c,
        open_observations: openObs.rows[0].c,
        corrective_actions: capa.rows[0].c,
        overdue_actions: overdueCapa.rows[0].c,
        permits: permits.rows[0].c,
        active_permits: activePermits.rows[0].c,
        completed_training: training.rows[0].c,
        audits: audits.rows[0].c,
      },
      incidents_by_severity: severity.rows,
      lost_time: ltiResult.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incident-trend', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT to_char(date_trunc('month', incident_date), 'YYYY-MM') AS month,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE incident_type='NEAR_MISS')::int AS near_misses,
              COUNT(*) FILTER (WHERE incident_type='INCIDENT')::int AS incidents
       FROM incidents
       WHERE org_id=$1 AND incident_date >= (CURRENT_DATE - INTERVAL '12 months')
       GROUP BY 1 ORDER BY 1`,
      [req.user!.org_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-activity', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, reference_no, title, incident_type, severity, status, created_at
       FROM incidents WHERE org_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [req.user!.org_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
