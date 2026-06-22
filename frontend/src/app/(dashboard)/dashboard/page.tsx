'use client';

import { KPICards } from '@/components/dashboard/KPICards';
import { IncidentTrendChart } from '@/components/dashboard/IncidentTrendChart';
import {
  useDashboardKpis, useIncidentTrend, useRecentActivity,
} from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data: kpis, isLoading } = useDashboardKpis();
  const { data: trend } = useIncidentTrend();
  const { data: recent } = useRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HSE Command Center</h1>
        <p className="text-sm text-muted-foreground">
          Real-time safety performance overview
        </p>
      </div>

      <KPICards data={kpis} loading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncidentTrendChart data={trend} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Incidents by Severity</h3>
          <div className="space-y-3">
            {(kpis?.incidents_by_severity || []).map((s) => (
              <div key={s.severity} className="flex items-center justify-between text-sm">
                <span>{s.severity}</span>
                <span className="font-semibold">{s.c}</span>
              </div>
            ))}
            {(!kpis?.incidents_by_severity?.length) && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">Recent Incidents</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Ref</th>
                <th className="py-2">Title</th>
                <th className="py-2">Type</th>
                <th className="py-2">Severity</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent || []).map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{r.reference_no}</td>
                  <td className="py-2">{r.title}</td>
                  <td className="py-2">{r.incident_type}</td>
                  <td className="py-2">{r.severity}</td>
                  <td className="py-2">{r.status}</td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    No recent incidents
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
