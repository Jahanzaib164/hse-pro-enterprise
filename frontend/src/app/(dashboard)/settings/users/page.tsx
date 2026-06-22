'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Field } from '@/components/shared/Field';
import {
  Badge, Button, Dialog, DialogFooter, DialogHeader, DialogTitle, Input, Select,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

const ROLES = ['system_owner', 'admin', 'safety_officer', 'supervisor', 'worker', 'auditor', 'contractor'];

export default function UsersPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useList<User>('/users', { limit: 100 });
  const create = useCreate<User>('/users');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'worker', department: '' });

  const canManage = user?.role === 'system_owner' || user?.role === 'admin';

  if (user && !canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" />
        <EmptyState title="Access restricted" description="Only system owners and admins can manage users." />
      </div>
    );
  }

  const submit = () => {
    if (!form.email || !form.first_name) return;
    create.mutate(form, { onSuccess: () => { setOpen(false); setForm({ first_name: '', last_name: '', email: '', password: '', role: 'worker', department: '' }); } });
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', sortable: true, accessor: (u) => `${u.first_name} ${u.last_name}`, render: (u) => `${u.first_name} ${u.last_name}` },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', render: (u) => <Badge className="border-slate-200 bg-slate-100 text-slate-700">{u.role}</Badge> },
    { key: 'department', header: 'Department', render: (u) => u.department || '—' },
    { key: 'mfa_enabled', header: 'MFA', render: (u) => <StatusBadge value={u.mfa_enabled ? 'ACTIVE' : 'DRAFT'} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add User</Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No users" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Last Name"><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="Email" required className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Temporary Password" required><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Department" className="sm:col-span-2"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !form.email || !form.first_name}>{create.isPending ? 'Saving…' : 'Add User'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
