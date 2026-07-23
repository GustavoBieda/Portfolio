"use client";

import { useMemo } from "react";
import { Radio } from "lucide-react";
import type { BitrixDeal } from "@/types/comercial";

function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function SourcePerformance({ deals }: { deals: BitrixDeal[] }) {
  const rows = useMemo(() => {
    const map = new Map<
      string,
      { label: string; total: number; won: number; lost: number; wonValue: number; openValue: number }
    >();
    for (const d of deals) {
      const key = d.sourceLabel || "Sem origem";
      const r = map.get(key) || { label: key, total: 0, won: 0, lost: 0, wonValue: 0, openValue: 0 };
      r.total += 1;
      if (d.semantic === "won") {
        r.won += 1;
        r.wonValue += d.value;
      } else if (d.semantic === "lost") {
        r.lost += 1;
      } else {
        r.openValue += d.value;
      }
      map.set(key, r);
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        conversion: r.won + r.lost > 0 ? Math.round((r.won / (r.won + r.lost)) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [deals]);

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent" /> Desempenho por Origem
          </h3>
          <p className="text-xs text-muted mt-0.5">Volume, valor e conversão por canal de entrada</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted">Sem dados de origem.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="pb-2 font-medium">Origem</th>
                <th className="pb-2 font-medium">Volume</th>
                <th className="pb-2 font-medium text-center">Ganhas</th>
                <th className="pb-2 font-medium text-center">Conversão</th>
                <th className="pb-2 font-medium text-right">Valor ganho</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-3 font-medium max-w-[180px] truncate" title={r.label}>
                    {r.label}
                  </td>
                  <td className="py-2.5 pr-3 w-[36%]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-card overflow-hidden flex-1 min-w-[60px]">
                        <div
                          className="h-full rounded-full bg-accent/80"
                          style={{ width: `${(r.total / maxTotal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-8 text-right">{r.total}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-400">{r.won}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                      {r.conversion}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium whitespace-nowrap">{fmtCurrency(r.wonValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
