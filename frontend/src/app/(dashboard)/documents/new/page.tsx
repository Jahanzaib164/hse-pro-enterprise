'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { DocumentRecord } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  document_number: z.string().optional(),
  document_type: z.enum(['POLICY', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'RECORD', 'MANUAL']),
  iso_standard: z.enum(['ISO_9001', 'ISO_14001', 'ISO_45001', 'NONE']),
  version: z.string().min(1, 'Version required'),
  category: z.string().optional(),
  effective_date: z.string().optional(),
  review_date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewDocumentPage() {
  const router = useRouter();
  const create = useCreate<DocumentRecord>('/documents');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { document_type: 'PROCEDURE', iso_standard: 'ISO_45001', version: '1.0' },
  });

  const onSubmit = (v: FormValues) => {
    create.mutate(
      { ...v, status: 'DRAFT' },
      { onSuccess: (c) => router.push(`/documents/${c.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Upload Document" description="Add a controlled document to the IMS library" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Document Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
              <Input {...register('title')} />
            </Field>
            <Field label="Document Number"><Input {...register('document_number')} placeholder="e.g. HSE-PROC-001" /></Field>
            <Field label="Version" required error={errors.version?.message}><Input {...register('version')} /></Field>
            <Field label="Document Type" required>
              <Select {...register('document_type')}>
                {['POLICY', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'RECORD', 'MANUAL'].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </Field>
            <Field label="ISO Standard" required>
              <Select {...register('iso_standard')}>
                {['ISO_9001', 'ISO_14001', 'ISO_45001', 'NONE'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Category"><Input {...register('category')} /></Field>
            <Field label="Effective Date"><Input type="date" {...register('effective_date')} /></Field>
            <Field label="Review Date"><Input type="date" {...register('review_date')} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>File</CardTitle></CardHeader>
          <CardContent>
            <FileUpload multiple={false} accept=".pdf,.doc,.docx,.xls,.xlsx" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save Document'}</Button>
        </div>
      </form>
    </div>
  );
}
