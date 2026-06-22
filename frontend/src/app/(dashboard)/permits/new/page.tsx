'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { Permit } from '@/types';

const PPE_OPTIONS = ['Hard Hat', 'Safety Glasses', 'Gloves', 'Safety Boots', 'Hi-Vis Vest', 'Respirator', 'Fall Arrest Harness', 'Face Shield'];

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  permit_type: z.enum(['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL', 'EXCAVATION', 'LIFTING', 'WORK_AT_HEIGHT', 'GENERAL']),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  work_location: z.string().optional(),
  start_datetime: z.string().min(1, 'Start required'),
  end_datetime: z.string().min(1, 'End required'),
  description: z.string().optional(),
  precautions: z.string().optional(),
  gas_test_required: z.boolean().optional(),
  ppe: z.array(z.string()).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewPermitPage() {
  const router = useRouter();
  const create = useCreate<Permit>('/permits');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { permit_type: 'GENERAL', risk_level: 'MEDIUM', ppe: [] },
  });

  const onSubmit = (v: FormValues) => {
    const { ppe, ...rest } = v;
    create.mutate(
      { ...rest, status: 'PENDING_APPROVAL', ppe_required: (ppe || []).join(', ') },
      { onSuccess: (c) => router.push(`/permits/${c.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Permit to Work" description="Define the work, hazards, PPE and submit for approval" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Work Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
              <Input {...register('title')} />
            </Field>
            <Field label="Permit Type" required>
              <Select {...register('permit_type')}>
                {['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL', 'EXCAVATION', 'LIFTING', 'WORK_AT_HEIGHT', 'GENERAL'].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </Field>
            <Field label="Risk Level" required>
              <Select {...register('risk_level')}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Work Location" className="sm:col-span-2">
              <Input {...register('work_location')} />
            </Field>
            <Field label="Start" required error={errors.start_datetime?.message}>
              <Input type="datetime-local" {...register('start_datetime')} />
            </Field>
            <Field label="End" required error={errors.end_datetime?.message}>
              <Input type="datetime-local" {...register('end_datetime')} />
            </Field>
            <Field label="Description of Work" className="sm:col-span-2">
              <Textarea rows={3} {...register('description')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hazards & PPE</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Precautions / Control Measures">
              <Textarea rows={3} {...register('precautions')} placeholder="List required precautions…" />
            </Field>
            <Field label="PPE Required">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PPE_OPTIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={p} {...register('ppe')} />
                    {p}
                  </label>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('gas_test_required')} />
              Gas test required before entry
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Submitting…' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  );
}
