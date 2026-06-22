'use client';

import {
  AlertTriangle, Eye, CheckSquare, FileText, GraduationCap, Clock,
} from 'lucide-react';
import type { DashboardKpis } from '@/types';

interface Props {
  data?: DashboardKpis;
  loading?: boolean;
}

export function KPICards({ data, loading }: Props) {
  const t = data?.totals;
  const cards = [
    { label: 'Open Incidents', value: t?.open_incidents, total: t?.incidents, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Open Observations', value: t?.open_observations, total: t?.observations, icon: Eye, color: 'text-amber-500' },
    { label: 'Overdue Actions', value: t?.overdue_actions, total: t?.corrective_actions, icon: CheckSquare, color: 'text-orange-500' },
    { label: 'Active Permits', value: t?.active_permits, total: t?.permits, icon: FileText, color: 'text-blue-500' },
    { label: 'Completed Training', value: t?.completed_training, icon: GraduationCap, color: 'text-green-500' },
    { label: 'Lost Time Days', value: data?.lost_time?.days, icon: Clock, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {loading ? '—' : c.value ?? 0}
              {c.total !== undefined && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {c.total}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
