import { Router } from 'express';
import { buildCrudRouter } from './_crud';

const router = Router();

router.use('/plans', buildCrudRouter({
  table: 'emergency_plans',
  writable: [
    'project_id', 'plan_type', 'title', 'description', 'version', 'status',
    'approved_by', 'review_date', 'file_path',
  ],
}));

router.use('/contacts', buildCrudRouter({
  table: 'emergency_contacts',
  writable: ['name', 'role', 'phone_primary', 'phone_secondary', 'email', 'available_24_7'],
}));

router.use('/drills', buildCrudRouter({
  table: 'emergency_drills',
  writable: [
    'project_id', 'site_id', 'drill_type', 'status', 'scheduled_date', 'actual_date',
    'duration_minutes', 'participants_count', 'scenario_description', 'objectives',
    'results', 'findings', 'lessons_learned', 'conducted_by', 'report_path',
  ],
}));

export default router;
