'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea,
} from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import type { Incident } from '@/types';

const FISHBONE = ['Man', 'Machine', 'Method', 'Material', 'Measurement', 'Environment'];

export default function InvestigatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: incident } = useItem<Incident>('/incidents', id);
  const update = useUpdate<Incident>('/incidents');

  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
  const [fishbone, setFishbone] = useState<Record<string, string>>({});
  const [rootCause, setRootCause] = useState('');

  useEffect(() => {
    if (incident?.root_cause) setRootCause(incident.root_cause);
  }, [incident]);

  const save = () => {
    const factors = [
      ...whys.filter(Boolean).map((w, i) => `Why ${i + 1}: ${w}`),
      ...FISHBONE.filter((f) => fishbone[f]).map((f) => `${f}: ${fishbone[f]}`),
    ].join('\n');
    update.mutate(
      { id, payload: { root_cause: rootCause, contributing_factors: factors, status: 'UNDER_INVESTIGATION' } },
      { onSuccess: () => router.push(`/incidents/${id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation"
        description={incident ? `${incident.reference_no} · ${incident.title}` : 'Loading…'}
      />

      <Card>
        <CardHeader><CardTitle>5-Why Analysis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {whys.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">Why {i + 1}</span>
              <Input
                value={w}
                placeholder={i === 0 ? 'Why did the incident happen?' : 'Why did that happen?'}
                onChange={(e) => setWhys(whys.map((x, idx) => (idx === i ? e.target.value : x)))}
              />
              {whys.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setWhys(whys.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setWhys([...whys, ''])}>
            <Plus className="h-4 w-4" /> Add Why
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fishbone (Ishikawa) Analysis</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {FISHBONE.map((cat) => (
            <Field key={cat} label={cat}>
              <Textarea
                rows={2}
                value={fishbone[cat] || ''}
                placeholder={`Causes related to ${cat.toLowerCase()}…`}
                onChange={(e) => setFishbone({ ...fishbone, [cat]: e.target.value })}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Root Cause Conclusion</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="State the identified root cause(s)…"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save Investigation'}
        </Button>
      </div>
    </div>
  );
}
