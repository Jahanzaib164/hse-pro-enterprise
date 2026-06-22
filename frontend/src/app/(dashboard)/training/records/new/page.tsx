'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, Input, Select } from '@/components/ui';
import { useCreate, useList } from '@/hooks/useResource';
import type { TrainingRecord, TrainingCourse, User } from '@/types';

const schema = z.object({
  user_id: z.string().min(1, 'Select an employee'),
  course_id: z.string().min(1, 'Select a course'),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED']),
  completion_date: z.string().optional(),
  expiry_date: z.string().optional(),
  score: z.string().optional(),
  training_provider: z.string().optional(),
  instructor: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewTrainingRecordPage() {
  const router = useRouter();
  const create = useCreate<TrainingRecord>('/training/records');
  const { data: courses } = useList<TrainingCourse>('/training/courses', { limit: 100 });
  const { data: users } = useList<User>('/users', { limit: 100 });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'COMPLETED' },
  });

  const onSubmit = (v: FormValues) => {
    create.mutate(
      { ...v, score: v.score ? Number(v.score) : undefined },
      { onSuccess: () => router.push('/training/records') }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Record Training" description="Log a training completion for an employee" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Employee" required error={errors.user_id?.message}>
              <Select {...register('user_id')}>
                <option value="">Select employee…</option>
                {(users?.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Course" required error={errors.course_id?.message}>
              <Select {...register('course_id')}>
                <option value="">Select course…</option>
                {(courses?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Status" required>
              <Select {...register('status')}>
                {['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </Field>
            <Field label="Score (%)">
              <Input type="number" {...register('score')} />
            </Field>
            <Field label="Completion Date">
              <Input type="date" {...register('completion_date')} />
            </Field>
            <Field label="Expiry Date">
              <Input type="date" {...register('expiry_date')} />
            </Field>
            <Field label="Provider">
              <Input {...register('training_provider')} />
            </Field>
            <Field label="Instructor">
              <Input {...register('instructor')} />
            </Field>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save Record'}</Button>
        </div>
      </form>
    </div>
  );
}
