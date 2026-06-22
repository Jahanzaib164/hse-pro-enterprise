'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button, Card, CardContent, Input, Select, Textarea } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { Observation } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  observation_type: z.enum(['UNSAFE_ACT', 'UNSAFE_CONDITION', 'POSITIVE', 'GOOD_CATCH']),
  risk_rating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  observation_date: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  gps_lat: z.string().optional(),
  gps_lng: z.string().optional(),
  description: z.string().min(5, 'Description is required'),
});
type FormValues = z.infer<typeof schema>;

export default function NewObservationPage() {
  const router = useRouter();
  const create = useCreate<Observation>('/observations');
  const [, setFiles] = useState<File[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { observation_type: 'UNSAFE_CONDITION', risk_rating: 'MEDIUM' },
  });

  const captureGps = () => {
    navigator.geolocation?.getCurrentPosition((p) => {
      setValue('gps_lat', p.coords.latitude.toFixed(6));
      setValue('gps_lng', p.coords.longitude.toFixed(6));
    });
  };

  const onSubmit = (v: FormValues) => {
    const { gps_lat, gps_lng, ...rest } = v;
    create.mutate(
      { ...rest, status: 'OPEN', gps_lat: gps_lat ? Number(gps_lat) : undefined, gps_lng: gps_lng ? Number(gps_lng) : undefined },
      { onSuccess: (c) => router.push(`/observations/${c.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report Observation" description="Record a hazard observation or good catch" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
              <Input {...register('title')} placeholder="Short summary" />
            </Field>
            <Field label="Type" required error={errors.observation_type?.message}>
              <Select {...register('observation_type')}>
                {['UNSAFE_ACT', 'UNSAFE_CONDITION', 'POSITIVE', 'GOOD_CATCH'].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </Field>
            <Field label="Risk Rating" required error={errors.risk_rating?.message}>
              <Select {...register('risk_rating')}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Date" required error={errors.observation_date?.message}>
              <Input type="date" {...register('observation_date')} />
            </Field>
            <Field label="Location">
              <Input {...register('location')} placeholder="Area / zone" />
            </Field>
            <Field label="GPS Latitude">
              <Input {...register('gps_lat')} />
            </Field>
            <Field label="GPS Longitude">
              <Input {...register('gps_lng')} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={captureGps}>
                <MapPin className="h-4 w-4" /> Capture GPS
              </Button>
            </div>
            <Field label="Description" required error={errors.description?.message} className="sm:col-span-2">
              <Textarea rows={4} {...register('description')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Photos">
                <FileUpload accept="image/*" onFilesChange={setFiles} />
              </Field>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Submitting…' : 'Submit Observation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
