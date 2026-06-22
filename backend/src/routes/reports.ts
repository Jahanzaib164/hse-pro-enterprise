import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

// ============================================================
// Legacy endpoints (kept for backward compatibility)
// ============================================================
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}.csv"`);
    res.send(toCsv(result.rows));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Helpers
// ============================================================
function toCsv(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any): string => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

type ModuleKey =
  | 'incidents'
  | 'observations'
  | 'audits'
  | 'permits'
  | 'training'
  | 'environmental'
  | 'actions';

const MODULE_QUERIES: Record<ModuleKey, { label: string; sql: string }> = {
  incidents: {
    label: 'Incidents',
    sql: `SELECT reference_no, title, incident_type, severity, status, incident_date, location, lost_time_days
          FROM incidents WHERE org_id=$1 AND created_at BETWEEN $2 AND $3 {PROJECT}
          ORDER BY incident_date DESC NULLS LAST LIMIT 5000`,
  },
  observations: {
    label: 'Observations',
    sql: `SELECT reference_no, title, observation_type, risk_rating, status, observation_date, location
          FROM observations WHERE org_id=$1 AND created_at BETWEEN $2 AND $3 {PROJECT}
          ORDER BY observation_date DESC NULLS LAST LIMIT 5000`,
  },
  audits: {
    label: 'Audits',
    sql: `SELECT reference_no, title, audit_type, status, planned_date, actual_date, compliance_percentage, findings_count
          FROM audits WHERE org_id=$1 AND created_at BETWEEN $2 AND $3 {PROJECT}
          ORDER BY planned_date DESC NULLS LAST LIMIT 5000`,
  },
  permits: {
    label: 'Permits',
    sql: `SELECT permit_number, title, permit_type, risk_level, status, start_datetime, end_datetime
          FROM permits WHERE org_id=$1 AND created_at BETWEEN $2 AND $3 {PROJECT}
          ORDER BY start_datetime DESC NULLS LAST LIMIT 5000`,
  },
  training: {
    label: 'Training Records',
    sql: `SELECT tr.status, tr.start_date, tr.completion_date, tr.expiry_date, tr.score, tc.name AS course
          FROM training_records tr LEFT JOIN training_courses tc ON tc.id = tr.course_id
          WHERE tr.org_id=$1 AND tr.created_at BETWEEN $2 AND $3
          ORDER BY tr.completion_date DESC NULLS LAST LIMIT 5000`,
  },
  environmental: {
    label: 'Environmental Readings',
    sql: `SELECT reading_type, value, unit, reading_date, reading_source, notes
          FROM environmental_readings WHERE org_id=$1 AND created_at BETWEEN $2 AND $3 {PROJECT}
          ORDER BY reading_date DESC NULLS LAST LIMIT 5000`,
  },
  actions: {
    label: 'Corrective Actions',
    sql: `SELECT title, action_type, priority, status, source_type, due_date, completed_date
          FROM corrective_actions WHERE org_id=$1 AND created_at BETWEEN $2 AND $3
          ORDER BY due_date DESC NULLS LAST LIMIT 5000`,
  },
};

const ALL_MODULES = Object.keys(MODULE_QUERIES) as ModuleKey[];
const PROJECT_TABLES: Set<ModuleKey> = new Set([
  'incidents',
  'observations',
  'audits',
  'permits',
  'environmental',
]);

function resolveDates(req: AuthRequest): { start: string; end: string } {
  const now = new Date();
  let start = req.query.startDate as string | undefined;
  let end = req.query.endDate as string | undefined;
  if (!start || !end) {
    const type = (req.query.type as string) || 'monthly';
    const s = new Date(now);
    if (type === 'daily') s.setDate(now.getDate() - 1);
    else if (type === 'weekly') s.setDate(now.getDate() - 7);
    else if (type === 'annual') s.setFullYear(now.getFullYear() - 1);
    else s.setMonth(now.getMonth() - 1);
    start = start || s.toISOString().slice(0, 10);
    end = end || now.toISOString().slice(0, 10);
  }
  return { start: `${start} 00:00:00`, end: `${end} 23:59:59` };
}

async function fetchModuleData(
  org: string,
  start: string,
  end: string,
  projectId: string | undefined,
  modules: ModuleKey[]
): Promise<Record<ModuleKey, any[]>> {
  const out = {} as Record<ModuleKey, any[]>;
  await Promise.all(
    modules.map(async (m) => {
      const def = MODULE_QUERIES[m];
      const params: any[] = [org, start, end];
      let sql = def.sql;
      if (PROJECT_TABLES.has(m) && projectId) {
        params.push(projectId);
        sql = sql.replace('{PROJECT}', `AND project_id=$${params.length}`);
      } else {
        sql = sql.replace('{PROJECT}', '');
      }
      const r = await query(sql, params);
      out[m] = r.rows;
    })
  );
  return out;
}

function selectedModules(req: AuthRequest): ModuleKey[] {
  const module = (req.query.module as string) || 'all';
  if (module === 'all') return ALL_MODULES;
  if ((ALL_MODULES as string[]).includes(module)) return [module as ModuleKey];
  return ALL_MODULES;
}

// ============================================================
// GET /api/reports/generate
// ============================================================
router.get('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const org = req.user!.org_id;
    const format = ((req.query.format as string) || 'json').toLowerCase();
    const type = (req.query.type as string) || 'monthly';
    const projectId = req.query.projectId as string | undefined;
    const modules = selectedModules(req);
    const { start, end } = resolveDates(req);

    const data = await fetchModuleData(org, start, end, projectId, modules);

    const orgRow = await query(`SELECT name FROM organizations WHERE id=$1`, [org]);
    const orgName = orgRow.rows[0]?.name || 'Organization';

    if (format === 'json') {
      res.json({
        meta: { type, modules, startDate: start, endDate: end, organization: orgName },
        data,
      });
      return;
    }

    if (format === 'csv') {
      const sections = modules.map((m) => {
        const rows = data[m];
        return `# ${MODULE_QUERIES[m].label}\n${toCsv(rows)}`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      res.send(sections.join('\n\n'));
      return;
    }

    if (format === 'excel') {
      await streamExcel(res, orgName, type, start, end, modules, data);
      return;
    }

    if (format === 'pdf') {
      streamPdf(res, orgName, req.user!.email, type, start, end, modules, data);
      return;
    }

    res.status(400).json({ error: `Unsupported format: ${format}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function streamExcel(
  res: Response,
  orgName: string,
  type: string,
  start: string,
  end: string,
  modules: ModuleKey[],
  data: Record<ModuleKey, any[]>
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HSE Pro Enterprise';
  wb.created = new Date();

  const cover = wb.addWorksheet('Summary');
  cover.columns = [{ width: 28 }, { width: 40 }];
  cover.addRow(['HSE Pro Enterprise Report']);
  cover.getCell('A1').font = { bold: true, size: 16 };
  cover.addRow(['Organization', orgName]);
  cover.addRow(['Report Type', type]);
  cover.addRow(['Date Range', `${start.slice(0, 10)} to ${end.slice(0, 10)}`]);
  cover.addRow(['Generated', new Date().toISOString()]);
  cover.addRow([]);
  cover.addRow(['Module', 'Record Count']);
  cover.getRow(7).font = { bold: true };
  modules.forEach((m) => cover.addRow([MODULE_QUERIES[m].label, data[m].length]));

  for (const m of modules) {
    const rows = data[m];
    const ws = wb.addWorksheet(MODULE_QUERIES[m].label.slice(0, 31));
    if (rows.length === 0) {
      ws.addRow(['No data for this period']);
      continue;
    }
    const headers = Object.keys(rows[0]);
    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.min(Math.max(h.length + 4, 14), 40),
    }));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    rows.forEach((r) => {
      const flat: Record<string, any> = {};
      headers.forEach((h) => {
        const v = r[h];
        flat[h] = v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
      });
      ws.addRow(flat);
    });
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
  await wb.xlsx.write(res);
  res.end();
}

function streamPdf(
  res: Response,
  orgName: string,
  generatedBy: string,
  type: string,
  start: string,
  end: string,
  modules: ModuleKey[],
  data: Record<ModuleKey, any[]>
): void {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
  doc.pipe(res);

  // Cover page
  doc.moveDown(6);
  doc.fontSize(28).fillColor('#1E3A8A').text('HSE Pro Enterprise', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(18).fillColor('#111827').text(
    `${type.charAt(0).toUpperCase() + type.slice(1)} HSE Report`,
    { align: 'center' }
  );
  doc.moveDown(2);
  doc.fontSize(12).fillColor('#374151');
  doc.text(`Organization: ${orgName}`, { align: 'center' });
  doc.text(`Date Range: ${start.slice(0, 10)} to ${end.slice(0, 10)}`, { align: 'center' });
  doc.text(`Generated By: ${generatedBy}`, { align: 'center' });
  doc.text(`Generated On: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, {
    align: 'center',
  });

  // Table of contents
  doc.addPage();
  doc.fontSize(18).fillColor('#1E3A8A').text('Table of Contents');
  doc.moveDown();
  doc.fontSize(12).fillColor('#111827');
  doc.text('1. Executive Summary');
  modules.forEach((m, i) => doc.text(`${i + 2}. ${MODULE_QUERIES[m].label}`));

  // Executive summary / KPIs
  doc.addPage();
  doc.fontSize(18).fillColor('#1E3A8A').text('Executive Summary');
  doc.moveDown();
  doc.fontSize(12).fillColor('#111827');
  modules.forEach((m) => {
    doc.text(`${MODULE_QUERIES[m].label}: ${data[m].length} record(s)`);
  });

  // Module data tables
  for (const m of modules) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1E3A8A').text(MODULE_QUERIES[m].label);
    doc.moveDown(0.5);
    const rows = data[m];
    if (rows.length === 0) {
      doc.fontSize(11).fillColor('#6B7280').text('No data for this period.');
      continue;
    }
    const headers = Object.keys(rows[0]).slice(0, 6);
    drawTable(doc, headers, rows.slice(0, 200));
  }

  // Footer page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .text(
        `HSE Pro Enterprise  |  Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 35,
        { align: 'center', width: doc.page.width - 100 }
      );
  }

  doc.end();
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: any[]): void {
  const startX = doc.page.margins.left;
  const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usable / headers.length;
  const cell = (text: string, x: number, y: number): void => {
    doc.text(text, x + 2, y + 3, { width: colWidth - 4, ellipsis: true, height: 14 });
  };

  let y = doc.y;
  doc.fontSize(9).fillColor('#FFFFFF');
  doc.rect(startX, y, usable, 16).fill('#1E3A8A');
  doc.fillColor('#FFFFFF');
  headers.forEach((h, i) => cell(h, startX + i * colWidth, y));
  y += 16;

  doc.fontSize(8);
  rows.forEach((r, idx) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = doc.y;
    }
    if (idx % 2 === 0) {
      doc.rect(startX, y, usable, 14).fill('#F3F4F6');
    }
    doc.fillColor('#111827');
    headers.forEach((h, i) => {
      const v = r[h];
      const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      cell(s, startX + i * colWidth, y);
    });
    y += 14;
  });
  doc.y = y + 6;
  doc.x = startX;
}

// ============================================================
// GET /api/reports/dashboard-summary
// ============================================================
router.get('/dashboard-summary', async (req: AuthRequest, res: Response) => {
  try {
    const org = req.user!.org_id;
    const [
      inc,
      incTrend,
      obs,
      obsType,
      actions,
      audits,
      permits,
      training,
      env,
      drills,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*)::int total,
                COUNT(*) FILTER (WHERE status NOT IN ('CLOSED','VERIFIED'))::int open,
                COUNT(*) FILTER (WHERE status IN ('CLOSED','VERIFIED'))::int closed,
                COUNT(*) FILTER (WHERE lost_time_days > 0)::int lti,
                COUNT(*) FILTER (WHERE incident_type='NEAR_MISS')::int near_misses,
                COUNT(*) FILTER (WHERE date_trunc('month', incident_date) = date_trunc('month', CURRENT_DATE))::int this_month
         FROM incidents WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT to_char(date_trunc('month', incident_date),'YYYY-MM') month, COUNT(*)::int total
         FROM incidents WHERE org_id=$1 AND incident_date >= (CURRENT_DATE - INTERVAL '12 months')
         GROUP BY 1 ORDER BY 1`,
        [org]
      ),
      query(
        `SELECT COUNT(*)::int total,
                COUNT(*) FILTER (WHERE status != 'CLOSED')::int open,
                COUNT(*) FILTER (WHERE status = 'CLOSED')::int closed
         FROM observations WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT observation_type, COUNT(*)::int c FROM observations WHERE org_id=$1 GROUP BY observation_type`,
        [org]
      ),
      query(
        `SELECT COUNT(*)::int total,
                COUNT(*) FILTER (WHERE status IN ('OPEN','IN_PROGRESS'))::int open,
                COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED','VERIFIED','CLOSED') AND due_date < CURRENT_DATE)::int overdue,
                COUNT(*) FILTER (WHERE status IN ('COMPLETED','VERIFIED','CLOSED'))::int completed
         FROM corrective_actions WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT COUNT(*)::int total,
                COUNT(*) FILTER (WHERE status='COMPLETED')::int completed,
                COALESCE(AVG(compliance_percentage) FILTER (WHERE compliance_percentage IS NOT NULL),0)::numeric(5,2) avg_compliance
         FROM audits WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status='ACTIVE')::int active,
                COUNT(*) FILTER (WHERE status='ACTIVE' AND end_datetime BETWEEN now() AND now() + INTERVAL '7 days')::int expiring_soon
         FROM permits WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status='COMPLETED' AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE))::int compliant,
                COUNT(*) FILTER (WHERE status='COMPLETED' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::int expiring_soon,
                COUNT(*) FILTER (WHERE status='EXPIRED' OR (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE))::int expired,
                COUNT(*)::int total
         FROM training_records WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT
            COALESCE(SUM(value) FILTER (WHERE reading_type='WASTE' AND date_trunc('month',reading_date)=date_trunc('month',CURRENT_DATE)),0)::numeric waste,
            COALESCE(SUM(value) FILTER (WHERE reading_type='WATER' AND date_trunc('month',reading_date)=date_trunc('month',CURRENT_DATE)),0)::numeric water,
            COALESCE(SUM(value) FILTER (WHERE reading_type='FUEL' AND date_trunc('month',reading_date)=date_trunc('month',CURRENT_DATE)),0)::numeric fuel
         FROM environmental_readings WHERE org_id=$1`,
        [org]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE date_trunc('year',scheduled_date)=date_trunc('year',CURRENT_DATE))::int planned,
                COUNT(*) FILTER (WHERE status='COMPLETED' AND date_trunc('year',COALESCE(actual_date,scheduled_date))=date_trunc('year',CURRENT_DATE))::int completed
         FROM emergency_drills WHERE org_id=$1`,
        [org]
      ),
    ]);

    const t = training.rows[0];
    const complianceRate =
      t.total > 0 ? Math.round((t.compliant / t.total) * 100) : 0;
    const byType: Record<string, number> = {};
    obsType.rows.forEach((r: any) => {
      byType[r.observation_type] = r.c;
    });

    res.json({
      incidents: {
        total: inc.rows[0].total,
        open: inc.rows[0].open,
        closed: inc.rows[0].closed,
        lti: inc.rows[0].lti,
        near_misses: inc.rows[0].near_misses,
        this_month: inc.rows[0].this_month,
        trend: incTrend.rows,
      },
      observations: {
        total: obs.rows[0].total,
        open: obs.rows[0].open,
        closed: obs.rows[0].closed,
        by_type: byType,
      },
      actions: {
        total: actions.rows[0].total,
        open: actions.rows[0].open,
        overdue: actions.rows[0].overdue,
        completed: actions.rows[0].completed,
      },
      audits: {
        total: audits.rows[0].total,
        completed: audits.rows[0].completed,
        avg_compliance: Number(audits.rows[0].avg_compliance),
      },
      permits: {
        active: permits.rows[0].active,
        expiring_soon: permits.rows[0].expiring_soon,
      },
      training: {
        compliant: t.compliant,
        expiring_soon: t.expiring_soon,
        expired: t.expired,
        compliance_rate: complianceRate,
      },
      environmental: {
        waste_this_month: Number(env.rows[0].waste),
        water_this_month: Number(env.rows[0].water),
        fuel_this_month: Number(env.rows[0].fuel),
      },
      emergency_drills: {
        planned_this_year: drills.rows[0].planned,
        completed_this_year: drills.rows[0].completed,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/reports/incident-trend
// ============================================================
router.get('/incident-trend', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS m
       )
       SELECT to_char(months.m,'YYYY-MM') AS month,
              COUNT(i.id)::int AS total,
              COUNT(i.id) FILTER (WHERE i.incident_type='NEAR_MISS')::int AS near_misses,
              COUNT(i.id) FILTER (WHERE i.incident_type='INCIDENT')::int AS incidents
       FROM months
       LEFT JOIN incidents i
         ON i.org_id=$1 AND date_trunc('month', i.incident_date) = months.m
       GROUP BY months.m ORDER BY months.m`,
      [req.user!.org_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/reports/risk-matrix-data
// ============================================================
router.get('/risk-matrix-data', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT COALESCE(rh.risk_level_after, 'UNSPECIFIED') AS risk_level, COUNT(*)::int c
       FROM risk_hazards rh
       JOIN risk_assessments ra ON ra.id = rh.assessment_id
       WHERE ra.org_id=$1
       GROUP BY 1`,
      [req.user!.org_id]
    );
    const levels: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    result.rows.forEach((r: any) => {
      const key = String(r.risk_level).toUpperCase();
      if (key in levels) levels[key] = r.c;
    });
    res.json({
      data: Object.entries(levels).map(([level, count]) => ({ level, count })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
