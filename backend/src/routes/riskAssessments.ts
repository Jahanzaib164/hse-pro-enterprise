import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'risk_assessments',
  referenceColumn: 'reference_no',
  referencePrefix: 'RA',
  writable: [
    'project_id', 'site_id', 'assessment_type', 'title', 'description', 'activity',
    'department', 'status', 'risk_owner_id', 'approved_by', 'review_date',
  ],
});
