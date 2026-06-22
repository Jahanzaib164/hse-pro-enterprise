'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { Incident } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  incident_type: z.enum(['INCIDENT', 'NEAR_MISS', 'OBSERVATION', 'PROPERTY_DAMAGE', 'VEHICLE', 'ENVIRONMENTAL']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  incident_date: z.string().min(1, 'Date is required'),
  incident_time: z.string().optional(),
  location: z.string().optional(),
  gps_lat: z.string().optional(),
  gps_lng: z.string().optional(),
  description: z.string().min(10, 'Please describe what happened'),
  injured_person_name: z.string().optional(),
  injury_type: z.string().optional(),
  witnesses: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewIncidentPage() {
  const router = useRouter();
  const create = useCreate<Incident>('/incidents');
  const [, setUploaded] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { incident_type: 'INCIDENT', severity: 'MEDIUM' },
  });

  const captureGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setValue('gps_lat', pos.coords.latitude.toFixed(6));
      setValue('gps_lng', pos.coords.longitude.toFixed(6));
    });
  };

  const onSubmit = (values: FormValues) => {
    const { gps_lat, gps_lng, witnesses, ...rest } = values;
    create.mutate(
      {
        ...rest,
        status: 'REPORTED',
        gps_lat: gps_lat ? Number(gps_lat) : undefined,
        gps_lng: gps_lng ? Number(gps_lng) : undefined,
        contributing_factors: witnesses ? `Witnesses: ${witnesses}` : undefined,
      },
      { onSuccess: (created) => router.push(`/incidents/${created.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report New Incident" description="Capture all details of the event" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
              <Input {...register('title')} placeholder="Brief summary" />
            </Field>
            <Field label="Incident Type" required error={errors.incident_type?.message}>
              <Select {...register('incident_type')}>
                {['INCIDENT', 'NEAR_MISS', 'OBSERVATION', 'PROPERTY_DAMAGE', 'VEHICLE', 'ENVIRONMENTAL'].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </Field>
            <Field label="Severity" required error={errors.severity?.message}>
              <Select {...register('severity')}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date" required error={errors.incident_date?.message}>
              <Input type="date" {...register('incident_date')} />
            </Field>
            <Field label="Time" error={errors.incident_time?.message}>
              <Input type="time" {...register('incident_time')} />
            </Field>
            <Field label="Description" required error={errors.description?.message} className="sm:col-span-2">
              <Textarea rows={4} {...register('description')} placeholder="Describe what happened…" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" className="sm:col-span-2">
              <Input {...register('location')} placeholder="Area / building / zone" />
            </Field>
            <Field label="GPS Latitude">
              <Input {...register('gps_lat')} placeholder="e.g. 25.276987" />
            </Field>
            <Field label="GPS Longitude">
              <Input {...register('gps_lng')} placeholder="e.g. 55.296249" />
            </Field>
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={captureGps}>
                <MapPin className="h-4 w-4" /> Capture current GPS
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People Involved</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Injured Person">
              <Input {...register('injured_person_name')} placeholder="Full name (if any)" />
            </Field>
            <Field label="Injury Type">
              <Input {...register('injury_type')} placeholder="e.g. Laceration" />
            </Field>
            <Field label="Witnesses" className="sm:col-span-2">
              <Textarea rows={2} {...register('witnesses')} placeholder="Names of witnesses, comma separated" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload autoUpload onUploaded={setUploaded} />
          </CardContent>
        </Card>

        {create.isError && (
          <p className="text-sm text-red-600">Failed to submit incident. Please try again.</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Submitting…' : 'Submit Incident'}
          </Button>
        </div>
      </form>
    </div>
  );
}
