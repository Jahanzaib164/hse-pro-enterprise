'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, Input, Select, Textarea } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { Contractor } from '@/types';

const schema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  registration_number: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contractor_type: z.string().optional(),
  prequalification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']),
  risk_category: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});
type FormValues = z.infer<typeof schema>;

export default function NewContractorPage() {
  const router = useRouter();
  const create = useCreate<Contractor>('/contractors');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { prequalification_status: 'PENDING', risk_category: 'MEDIUM' },
  });

  const onSubmit = (v: FormValues) => {
    create.mutate({ ...v, email: v.email || undefined }, { onSuccess: (c) => router.push(`/contractors/${c.id}`) });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Register Contractor" description="Add a new contractor to the register" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Company Name" required error={errors.company_name?.message} className="sm:col-span-2">
              <Input {...register('company_name')} />
            </Field>
            <Field label="Registration Number"><Input {...register('registration_number')} /></Field>
            <Field label="Contractor Type"><Input {...register('contractor_type')} placeholder="e.g. Civil, MEP" /></Field>
            <Field label="Contact Person"><Input {...register('contact_person')} /></Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
            <Field label="Phone"><Input {...register('phone')} /></Field>
            <Field label="Prequalification Status">
              <Select {...register('prequalification_status')}>
                {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Risk Category">
              <Select {...register('risk_category')}>
                {['LOW', 'MEDIUM', 'HIGH'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Address" className="sm:col-span-2"><Textarea rows={2} {...register('address')} /></Field>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Register'}</Button>
        </div>
      </form>
    </div>
  );
}
