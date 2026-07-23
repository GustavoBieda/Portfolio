"use client";

import { useMemo, useState } from "react";
import { AlarmClock, Clock } from "lucide-react";
import type { BitrixDeal, DealSemantic } from "@/types/comercial";

const SEM_DOT: Record<DealSemantic, string> = {
  open: "#3b82f6",
  won: "#10b981",
  lost: "#ef4444",
};

const THRESHOLDS = [
  { id: 7, label: "+7 dias" },
  { id: 14, label: "+14 dias" },
  { id: 30, label: "+30 dias" },
];

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ageColor(d: number): string {
  if (d >= 30) return "text-red-400 bg-red-500/15";
  if (d >= 14) return "text-amber-400 bg-amber-500/15";
  return "text-blue-400 bg-blue-500/15";
}

export function AgingTable({ deals }: { deals: BitrixDeal[] }) {
  const [threshold, setThreshold] = useState(7);
  const [visible, setVisible] = useState(10);

  const stalled = useMemo(() => {
    return deals
      .filter((d) => d.semantic === "open")
      .map((d) => ({ ...d, age: daysSince(d.enteredStageAt || d.updatedAt || d.createdAt) }))
      .filter((d) => d.age >= threshold)
      .sort((a, b) => b.age - a.age);
  }, [deals, threshold]);

  const totalValue = stalled.reduce((s, d) => s + d.value, 0);
  const shown = stalled.slice(0, visible);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <AlarmClock className="w-4 h-4 text-amber-400" /> Negociações Paradas
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {stalled.length} em aberto sem avançar de etapa · {fmtCurrency(totalValue)} parados
          </p>
        </div>
        <div className="flex rounded-lg bg-card border border-border p-0.5">
          {THRESHOLDS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setThreshold(t.id);
                setVisible(10);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                threshold === t.id ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted">
          <Clock className="w-4 h-4 mr-2 opacity-50" />
          Nenhuma negociação parada além de {threshold} dias. 🎉
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {shown.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEM_DOT[d.semantic] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-[11px] text-muted truncate">
                    {d.stageName} · {d.assignedName} · {fmtCurrency(d.value)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${ageColor(d.age)}`}>
                  {d.age} {d.age === 1 ? "dia" : "dias"}
                </span>
              </div>
            ))}
          </div>
          {visible < stalled.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisible((v) => v + 10)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-card border border-border text-muted hover:text-foreground transition-colors"
              >
                Mostrar mais ({stalled.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
