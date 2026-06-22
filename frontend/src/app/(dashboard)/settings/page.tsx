'use client';

import Link from 'next/link';
import { Users, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization profile and system configuration" />

      <Card>
        <CardHeader><CardTitle>Organization Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization ID">
            <Input value={user?.org_id || ''} readOnly />
          </Field>
          <Field label="Your Role">
            <Input value={user?.role || ''} readOnly />
          </Field>
          <Field label="Contact Email">
            <Input value={user?.email || ''} readOnly />
          </Field>
          <Field label="Department">
            <Input value={user?.department || ''} readOnly />
          </Field>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings/users">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">Manage system users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/roles">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Role Management</p>
                <p className="text-sm text-muted-foreground">Roles and permissions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
