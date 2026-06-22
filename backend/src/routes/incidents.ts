import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'incidents',
  referenceColumn: 'reference_no',
  referencePrefix: 'INC',
  writable: [
    'project_id', 'site_id', 'incident_type', 'severity', 'status', 'title',
    'description', 'incident_date', 'incident_time', 'location', 'gps_lat', 'gps_lng',
    'reported_by', 'assigned_to', 'injured_person_name', 'injury_type',
    'body_part_affected', 'treatment_provided', 'lost_time_days',
    'property_damage_cost', 'root_cause', 'contributing_factors',
  ],
});
