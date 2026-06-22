import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'corrective_actions',
  writable: [
    'source_type', 'source_id', 'title', 'description', 'action_type', 'priority',
    'status', 'assigned_to', 'assigned_by', 'due_date', 'completed_date',
    'verified_by', 'verified_date', 'evidence_path',
  ],
});
