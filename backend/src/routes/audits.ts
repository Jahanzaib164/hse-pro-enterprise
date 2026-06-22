import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'audits',
  referenceColumn: 'reference_no',
  referencePrefix: 'AUD',
  writable: [
    'project_id', 'site_id', 'template_id', 'audit_type', 'title', 'status',
    'lead_auditor_id', 'planned_date', 'actual_date', 'score', 'max_score',
    'compliance_percentage', 'findings_count', 'ncr_count',
  ],
});
