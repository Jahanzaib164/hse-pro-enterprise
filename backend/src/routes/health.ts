import { Router } from 'express';
import { buildCrudRouter } from './_crud';

const router = Router();

router.use('/medical', buildCrudRouter({
  table: 'medical_records',
  writable: [
    'user_id', 'record_type', 'examination_date', 'examining_physician', 'facility',
    'fitness_status', 'restrictions', 'next_exam_date', 'notes', 'created_by',
  ],
}));

router.use('/monitoring', buildCrudRouter({
  table: 'health_monitoring',
  writable: [
    'project_id', 'monitoring_type', 'reading_value', 'unit', 'threshold_limit',
    'status', 'recorded_at', 'location', 'recorded_by',
  ],
}));

export default router;
