import cron from 'node-cron';
import { pool } from '../config/database';
import {
  sendActionDueSoonAlert,
  sendActionOverdueAlert,
  sendTrainingExpiryAlert,
  sendPermitApprovalRequest,
} from './emailService';

export function startScheduler(): void {
  // Daily 8am – mark overdue actions + send alerts
  cron.schedule('0 8 * * *', async () => {
    try {
      const { rows: overdueActions } = await pool.query(`
        UPDATE corrective_actions ca
        SET status = 'OVERDUE', updated_at = NOW()
        FROM users u
        WHERE ca.status IN ('OPEN','IN_PROGRESS')
          AND ca.due_date < CURRENT_DATE
          AND ca.assigned_to = u.id
          AND ca.status != 'OVERDUE'
        RETURNING ca.id, ca.title, ca.due_date, ca.priority, u.email, u.first_name
      `);
      for (const a of overdueActions) {
        await sendActionOverdueAlert(
          { id: a.id, title: a.title, due_date: a.due_date, priority: a.priority },
          { email: a.email, first_name: a.first_name }
        );
      }
      console.log(`[scheduler] Marked ${overdueActions.length} actions as OVERDUE`);
    } catch (err) {
      console.error('[scheduler] overdue actions job failed:', err);
    }
  });

  // Daily 9am – actions due in 3 days
  cron.schedule('0 9 * * *', async () => {
    try {
      const { rows } = await pool.query(`
        SELECT ca.id, ca.title, ca.due_date, ca.priority, u.email, u.first_name
        FROM corrective_actions ca
        JOIN users u ON ca.assigned_to = u.id
        WHERE ca.status IN ('OPEN','IN_PROGRESS')
          AND ca.due_date = CURRENT_DATE + INTERVAL '3 days'
      `);
      for (const a of rows) {
        await sendActionDueSoonAlert(
          { id: a.id, title: a.title, due_date: a.due_date, priority: a.priority },
          { email: a.email, first_name: a.first_name }
        );
      }
      console.log(`[scheduler] Sent ${rows.length} due-soon alerts`);
    } catch (err) {
      console.error('[scheduler] due-soon job failed:', err);
    }
  });

  // Daily 9am – training expiring in 30 days
  cron.schedule('5 9 * * *', async () => {
    try {
      const { rows } = await pool.query(`
        SELECT tr.id, tc.name AS course_name, tr.expiry_date, u.email, u.first_name
        FROM training_records tr
        JOIN training_courses tc ON tr.course_id = tc.id
        JOIN users u ON tr.user_id = u.id
        WHERE tr.status = 'COMPLETED'
          AND tr.expiry_date = CURRENT_DATE + INTERVAL '30 days'
      `);
      for (const r of rows) {
        await sendTrainingExpiryAlert(
          { course_name: r.course_name, expiry_date: r.expiry_date },
          { email: r.email, first_name: r.first_name }
        );
      }
      console.log(`[scheduler] Sent ${rows.length} training expiry alerts`);
    } catch (err) {
      console.error('[scheduler] training expiry job failed:', err);
    }
  });

  // Daily 7am – permits expiring today
  cron.schedule('0 7 * * *', async () => {
    try {
      await pool.query(`
        UPDATE permits SET status = 'EXPIRED', updated_at = NOW()
        WHERE status = 'ACTIVE' AND end_datetime < NOW()
      `);

      const { rows } = await pool.query(`
        SELECT p.id, p.permit_number, p.title, p.permit_type, p.risk_level, u.email, u.first_name
        FROM permits p
        JOIN users u ON p.requested_by = u.id
        WHERE p.status = 'ACTIVE'
          AND p.end_datetime::date = CURRENT_DATE
      `);
      for (const p of rows) {
        await sendPermitApprovalRequest(
          { id: p.id, permit_number: p.permit_number, title: p.title, permit_type: p.permit_type, risk_level: p.risk_level },
          { email: p.email, first_name: p.first_name }
        );
      }
      console.log(`[scheduler] Processed ${rows.length} expiring permits`);
    } catch (err) {
      console.error('[scheduler] permits expiry job failed:', err);
    }
  });

  // Midnight – cleanup expired sessions
  cron.schedule('0 0 * * *', async () => {
    try {
      const { rowCount } = await pool.query(
        `DELETE FROM user_sessions WHERE expires_at < NOW() AND revoked_at IS NULL`
      );
      console.log(`[scheduler] Cleaned up ${rowCount} expired sessions`);
    } catch (err) {
      console.error('[scheduler] session cleanup failed:', err);
    }
  });

  console.log('[scheduler] All scheduled jobs started');
}
