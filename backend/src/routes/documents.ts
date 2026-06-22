import { buildCrudRouter } from './_crud';

export default buildCrudRouter({
  table: 'documents',
  writable: [
    'document_number', 'title', 'document_type', 'category', 'status', 'version',
    'iso_standard', 'current_file_path', 'owner_id', 'approved_by', 'effective_date',
    'review_date',
  ],
});
