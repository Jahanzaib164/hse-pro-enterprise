import { Router } from 'express';
import { buildCrudRouter } from './_crud';

const router = Router();

router.use('/readings', buildCrudRouter({
  table: 'environmental_readings',
  writable: [
    'project_id', 'site_id', 'reading_type', 'value', 'unit', 'reading_date',
    'reading_source', 'notes', 'recorded_by',
  ],
}));

router.use('/waste', buildCrudRouter({
  table: 'waste_records',
  writable: [
    'project_id', 'waste_type', 'waste_category', 'quantity', 'unit', 'disposal_method',
    'disposal_company', 'manifest_number', 'disposal_date', 'cost', 'recorded_by',
  ],
}));

export default router;
