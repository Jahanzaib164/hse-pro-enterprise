'use client';

import { cn } from '@/lib/utils';

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const SEVERITY = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

export function riskScoreColor(score: number): string {
  if (score >= 15) return 'bg-red-500 text-white';
  if (score >= 8) return 'bg-orange-400 text-white';
  if (score >= 4) return 'bg-amber-300 text-black';
  return 'bg-green-400 text-black';
}

export function riskLevel(score: number): string {
  if (score >= 15) return 'Critical';
  if (score >= 8) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

/**
 * Interactive 5x5 risk matrix. Cells are likelihood (rows, 1-5) x severity (cols, 1-5).
 * Clicking a cell calls onSelect with {likelihood, severity, score}.
 */
export function RiskMatrix({
  likelihood,
  severity,
  onSelect,
}: {
  likelihood?: number;
  severity?: number;
  onSelect?: (v: { likelihood: number; severity: number; score: number }) => void;
}) {
  return (
    <div className="inline-block">
      <div className="flex">
        <div className="flex w-6 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-xs font-medium text-muted-foreground">
            Likelihood →
          </span>
        </div>
        <div>
          <table className="border-collapse">
            <tbody>
              {[5, 4, 3, 2, 1].map((l) => (
                <tr key={l}>
                  <td className="px-1 text-right text-xs text-muted-foreground">{LIKELIHOOD[l - 1]}</td>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const score = l * s;
                    const selected = likelihood === l && severity === s;
                    return (
                      <td key={s} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => onSelect?.({ likelihood: l, severity: s, score })}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded text-sm font-semibold transition-all',
                            riskScoreColor(score),
                            selected && 'ring-4 ring-primary ring-offset-1'
                          )}
                        >
                          {score}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td />
                {SEVERITY.map((s) => (
                  <td key={s} className="px-1 pt-1 text-center text-[10px] text-muted-foreground">
                    {s}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-center text-xs font-medium text-muted-foreground">Severity →</p>
        </div>
      </div>
    </div>
  );
}
