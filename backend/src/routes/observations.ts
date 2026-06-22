import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'observations',
  referenceColumn: 'reference_no',
  referencePrefix: 'OBS',
  writable: [
    'project_id', 'site_id', 'observation_type', 'status', 'title', 'description',
    'location', 'gps_lat', 'gps_lng', 'risk_rating', 'observed_by', 'assigned_to',
    'observation_date', 'closed_date',
  ],
});
