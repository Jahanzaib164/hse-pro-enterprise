'use client';

import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { EnvironmentalReading, WasteRecord } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  WASTE: 'Waste', WATER: 'Water', FUEL: 'Fuel', ELECTRICITY: 'Electricity',
  EMISSIONS: 'Carbon', NOISE: 'Noise', AIR_QUALITY: 'Air',
};
const CARBON_FACTORS: Record<string, number> = { ELECTRICITY: 0.4, FUEL: 2.68 };

export default function EnvironmentalPage() {
  const { data: readings } = useList<EnvironmentalReading>('/environmental/readings', { limit: 500 });
  const { data: waste } = useList<WasteRecord>('/environmental/waste', { limit: 500 });

  const rows = readings?.data ?? [];
  const totals = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.reading_type] = (acc[r.reading_type] || 0) + (Number(r.value) || 0);
    return acc;
  }, {});

  const carbon = rows.reduce((sum, r) => sum + (Number(r.value) || 0) * (CARBON_FACTORS[r.reading_type] || 0), 0);
  const wasteTotal = (waste?.data ?? []).reduce((s, w) => s + (Number(w.quantity) || 0), 0);

  const chartData = Object.entries(totals).map(([k, v]) => ({ name: TYPE_LABELS[k] || k, value: Math.round(v) }));

  const kpis = [
    { label: 'Total Waste', value: `${wasteTotal.toFixed(1)}`, unit: 'kg' },
    { label: 'Water', value: (totals.WATER || 0).toFixed(0), unit: 'm³' },
    { label: 'Fuel', value: (totals.FUEL || 0).toFixed(0), unit: 'L' },
    { label: 'Electricity', value: (totals.ELECTRICITY || 0).toFixed(0), unit: 'kWh' },
    { label: 'Carbon (est.)', value: carbon.toFixed(0), unit: 'kg CO₂e' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environmental Management"
        description="Resource consumption, waste and carbon overview"
        actions={
          <div className="flex gap-2">
            <Link href="/environmental/waste"><Button variant="outline"><Trash2 className="h-4 w-4" /> Waste Log</Button></Link>
            <Link href="/environmental/readings"><Button><Plus className="h-4 w-4" /> Enter Readings</Button></Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.unit}</p>
              <p className="mt-1 text-sm font-medium">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Consumption by Category</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No readings yet. Enter readings to see charts.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Readings</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No readings recorded.</p>
          ) : (
            <ul className="divide-y">
              {rows.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{TYPE_LABELS[r.reading_type] || r.reading_type}</span>
                  <span className="text-muted-foreground">{fmtDate(r.reading_date)}</span>
                  <span className="font-medium">{r.value} {r.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
