import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'permits',
  referenceColumn: 'permit_number',
  referencePrefix: 'PTW',
  writable: [
    'project_id', 'site_id', 'permit_type', 'title', 'description', 'work_location',
    'risk_level', 'status', 'requested_by', 'approved_by', 'issuer_id', 'contractor_id',
    'start_datetime', 'end_datetime', 'actual_end_datetime', 'precautions',
    'ppe_required', 'gas_test_required', 'gas_test_results', 'attendant_required',
  ],
});
