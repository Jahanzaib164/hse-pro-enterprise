'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, Input, Select, Textarea } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { EmergencyDrill } from '@/types';

const schema = z.object({
  drill_type: z.enum(['FIRE', 'EVACUATION', 'MEDICAL', 'SPILL', 'LOCKDOWN']),
  status: z.enum(['PLANNED', 'COMPLETED', 'CANCELLED']),
  scheduled_date: z.string().min(1, 'Scheduled date required'),
  actual_date: z.string().optional(),
  duration_minutes: z.string().optional(),
  participants_count: z.string().optional(),
  scenario_description: z.string().optional(),
  objectives: z.string().optional(),
  results: z.string().optional(),
  lessons_learned: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewDrillPage() {
  const router = useRouter();
  const create = useCreate<EmergencyDrill>('/emergency/drills');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { drill_type: 'FIRE', status: 'PLANNED' },
  });

  const onSubmit = (v: FormValues) => {
    create.mutate(
      {
        ...v,
        duration_minutes: v.duration_minutes ? Number(v.duration_minutes) : undefined,
        participants_count: v.participants_count ? Number(v.participants_count) : undefined,
      },
      { onSuccess: () => router.push('/emergency/drills') }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Plan / Record Drill" description="Schedule a drill or record its outcome" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Drill Type" required>
              <Select {...register('drill_type')}>
                {['FIRE', 'EVACUATION', 'MEDICAL', 'SPILL', 'LOCKDOWN'].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Status" required>
              <Select {...register('status')}>
                {['PLANNED', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Scheduled Date" required error={errors.scheduled_date?.message}>
              <Input type="date" {...register('scheduled_date')} />
            </Field>
            <Field label="Actual Date">
              <Input type="date" {...register('actual_date')} />
            </Field>
            <Field label="Duration (minutes)">
              <Input type="number" {...register('duration_minutes')} />
            </Field>
            <Field label="Participants">
              <Input type="number" {...register('participants_count')} />
            </Field>
            <Field label="Scenario" className="sm:col-span-2">
              <Textarea rows={2} {...register('scenario_description')} />
            </Field>
            <Field label="Objectives" className="sm:col-span-2">
              <Textarea rows={2} {...register('objectives')} />
            </Field>
            <Field label="Results" className="sm:col-span-2">
              <Textarea rows={2} {...register('results')} />
            </Field>
            <Field label="Lessons Learned" className="sm:col-span-2">
              <Textarea rows={2} {...register('lessons_learned')} />
            </Field>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save Drill'}</Button>
        </div>
      </form>
    </div>
  );
}
