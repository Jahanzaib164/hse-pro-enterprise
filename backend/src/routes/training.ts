import { Router } from 'express';
import { buildCrudRouter } from './_crud';

const router = Router();

router.use('/courses', buildCrudRouter({
  table: 'training_courses',
  writable: [
    'name', 'code', 'description', 'category', 'duration_hours', 'validity_months',
    'is_mandatory', 'competency_level',
  ],
}));

router.use('/records', buildCrudRouter({
  table: 'training_records',
  writable: [
    'user_id', 'course_id', 'status', 'start_date', 'completion_date', 'expiry_date',
    'score', 'pass_mark', 'certificate_path', 'training_provider', 'instructor',
  ],
}));

export default router;
