import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { buildCrudRouter } from './_crud';
import { query } from '../config/database';

const router = Router();

// Main contractors CRUD (org-scoped)
router.use('/', buildCrudRouter({
  table: 'contractors',
  writable: [
    'company_name', 'registration_number', 'contact_person', 'email', 'phone',
    'address', 'contractor_type', 'prequalification_status', 'risk_category',
  ],
}));

// Sub-resources scoped via parent contractor's org
router.use(authenticate);

async function assertContractorInOrg(contractorId: string, orgId: string): Promise<boolean> {
  const r = await query('SELECT id FROM contractors WHERE id=$1 AND org_id=$2', [
    contractorId,
    orgId,
  ]);
  return !!r.rows[0];
}

router.get('/:id/evaluations', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await assertContractorInOrg(req.params.id, req.user!.org_id))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const r = await query(
      'SELECT * FROM contractor_evaluations WHERE contractor_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ data: r.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/evaluations', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await assertContractorInOrg(req.params.id, req.user!.org_id))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const { evaluation_date, safety_score, quality_score, compliance_score, overall_score, status, valid_until, notes } = req.body;
    const r = await query(
      `INSERT INTO contractor_evaluations(contractor_id, evaluation_date, evaluator_id, safety_score, quality_score, compliance_score, overall_score, status, valid_until, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.id, evaluation_date, req.user!.id, safety_score, quality_score, compliance_score, overall_score, status, valid_until, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/documents', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await assertContractorInOrg(req.params.id, req.user!.org_id))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const r = await query(
      'SELECT * FROM contractor_documents WHERE contractor_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ data: r.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
