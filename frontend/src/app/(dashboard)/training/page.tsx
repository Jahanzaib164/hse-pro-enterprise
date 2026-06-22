'use client';

import Link from 'next/link';
import { ListChecks, BookOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useList } from '@/hooks/useResource';
import { daysUntil } from '@/lib/format';
import type { TrainingCourse, TrainingRecord, User } from '@/types';

function cellState(record?: TrainingRecord): { label: string; cls: string } {
  if (!record) return { label: '—', cls: 'bg-muted text-muted-foreground' };
  if (record.status !== 'COMPLETED') return { label: '◷', cls: 'bg-amber-100 text-amber-800' };
  const d = daysUntil(record.expiry_date);
  if (d != null && d < 0) return { label: '✕', cls: 'bg-red-100 text-red-800' };
  if (d != null && d < 30) return { label: '!', cls: 'bg-orange-100 text-orange-800' };
  return { label: '✓', cls: 'bg-green-100 text-green-800' };
}

export default function TrainingMatrixPage() {
  const { data: coursesResp, isLoading: lc } = useList<TrainingCourse>('/training/courses', { limit: 100 });
  const { data: recordsResp, isLoading: lr } = useList<TrainingRecord>('/training/records', { limit: 200 });
  const { data: usersResp } = useList<User>('/users', { limit: 100 });

  const courses = coursesResp?.data ?? [];
  const records = recordsResp?.data ?? [];
  const users = usersResp?.data ?? [];

  const lookup = (userId: string, courseId: string) =>
    records.find((r) => r.user_id === userId && r.course_id === courseId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Matrix"
        description="Employee training compliance at a glance"
        actions={
          <div className="flex gap-2">
            <Link href="/training/courses"><Button variant="outline"><BookOpen className="h-4 w-4" /> Courses</Button></Link>
            <Link href="/training/records"><Button variant="outline"><ListChecks className="h-4 w-4" /> Records</Button></Link>
            <Link href="/training/records/new"><Button><Plus className="h-4 w-4" /> Record Training</Button></Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><span className="rounded bg-green-100 px-1.5 text-green-800">✓</span> Valid</span>
        <span><span className="rounded bg-orange-100 px-1.5 text-orange-800">!</span> Expiring</span>
        <span><span className="rounded bg-red-100 px-1.5 text-red-800">✕</span> Expired</span>
        <span><span className="rounded bg-amber-100 px-1.5 text-amber-800">◷</span> In progress</span>
        <span><span className="rounded bg-muted px-1.5">—</span> Not assigned</span>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {lc || lr ? (
            <div className="h-40 animate-pulse rounded bg-muted" />
          ) : courses.length === 0 || users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add courses and employees to populate the matrix.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card p-2 text-left">Employee</th>
                  {courses.map((c) => (
                    <th key={c.id} className="p-2 text-center align-bottom">
                      <span className="block max-w-[80px] text-xs">{c.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="sticky left-0 bg-card p-2 font-medium">
                      {u.first_name} {u.last_name}
                    </td>
                    {courses.map((c) => {
                      const s = cellState(lookup(u.id, c.id));
                      return (
                        <td key={c.id} className="p-1 text-center">
                          <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded font-bold', s.cls)}>
                            {s.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
