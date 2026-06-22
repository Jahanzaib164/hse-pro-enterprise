'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { AlertTriangle, Clock } from 'lucide-react';
import { KPICards } from '@/components/dashboard/KPICards';
import { IncidentTrendChart } from '@/components/dashboard/IncidentTrendChart';
import {
  useDashboardKpis, useIncidentTrend, useRecentActivity,
  useDashboardSummary, useRiskMatrix, useTopOpenActions, useExpiringPermits,
} from '@/hooks/useDashboard';

const ACTION_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
};

function daysUntil(date?: string): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { data: kpis, isLoading } = useDashboardKpis();
  const { data: trend } = useIncidentTrend();
  const { data: recent } = useRecentActivity();
  const { data: summary } = useDashboardSummary();
  const { data: riskMatrix } = useRiskMatrix();
  const { data: openActions } = useTopOpenActions();
  const { data: permits } = useExpiringPermits();

  const actionData = summary
    ? [
        { name: 'Open', value: summary.actions.open },
        { name: 'In Progress', value: Math.max(summary.actions.total - summary.actions.open - summary.actions.completed - summary.actions.overdue, 0) },
        { name: 'Completed', value: summary.actions.completed },
        { name: 'Overdue', value: summary.actions.overdue },
      ]
    : [];

  const complianceRate = summary?.training.compliance_rate ?? 0;
  const complianceData = [
    { name: 'Compliant', value: complianceRate, fill: '#10b981' },
  ];

  const riskData = (riskMatrix || []).map((r) => ({
    name: r.level.charAt(0) + r.level.slice(1).toLowerCase(),
    count: r.count,
    fill: RISK_COLORS[r.level] || '#6b7280',
  }));

  const top5Actions = (openActions || []).slice(0, 5);

  const expiringSoon = (permits || [])
    .map((p: any) => ({ ...p, _days: daysUntil(p.end_datetime) }))
    .filter((p: any) => p._days !== null && p._days <= 7)
    .sort((a: any, b: any) => (a._days ?? 0) - (b._days ?? 0))
    .slice(0, 8);

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Actions by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {actionData.map((_, i) => <Cell key={i} fill={ACTION_COLORS[i % ACTION_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold">Training Compliance</h3>
          <p className="mb-2 text-xs text-muted-foreground">% of valid mandatory training</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              innerRadius="70%" outerRadius="100%" data={complianceData}
              startAngle={90} endAngle={-270}
            >
              <RadialBar background dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="-mt-28 text-center text-3xl font-bold">{complianceRate}%</p>
          <div className="mt-24" />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Risks">
                {riskData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Top 5 Open CAPA</h3>
          <ul className="space-y-2">
            {top5Actions.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="truncate">{a.title}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                </span>
              </li>
            ))}
            {top5Actions.length === 0 && (
              <p className="text-sm text-muted-foreground">No open corrective actions</p>
            )}
          </ul>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Permits Expiring This Week</h3>
          <ul className="space-y-2">
            {expiringSoon.map((p: any) => {
              const urgent = (p._days ?? 99) <= 2;
              return (
                <li key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 truncate">
                    {urgent
                      ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      : <Clock className="h-4 w-4 shrink-0 text-amber-500" />}
                    <span className="truncate">{p.title || p.permit_number}</span>
                  </span>
                  <span className={`ml-2 shrink-0 text-xs font-semibold ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
                    {p._days <= 0 ? 'today' : `${p._days}d`}
                  </span>
                </li>
              );
            })}
            {expiringSoon.length === 0 && (
              <p className="text-sm text-muted-foreground">No permits expiring this week</p>
            )}
          </ul>
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
