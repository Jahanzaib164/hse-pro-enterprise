'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { IncidentTrendPoint } from '@/types';

interface Props {
  data?: IncidentTrendPoint[];
}

export function IncidentTrendChart({ data }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">Incident Trend (12 months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="incidents" name="Incidents" stroke="#ef4444" strokeWidth={2} />
          <Line type="monotone" dataKey="near_misses" name="Near Misses" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
