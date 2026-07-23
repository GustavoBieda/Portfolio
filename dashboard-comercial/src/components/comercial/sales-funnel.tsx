"use client";

import { Fragment, useMemo } from "react";
import { ChevronDown, Filter, Clock } from "lucide-react";
import type { BitrixDeal, StageStat } from "@/types/comercial";

// Etapas do funil de vendas, na ordem. O `id` deve casar com o `stageId` das negociações.
const FUNNEL_STAGES: { id: string; label: string }[] = [
  { id: "NEW", label: "Lead" },
  { id: "PREPARATION", label: "Assumir Conversa" },
  { id: "PREPAYMENT_INVOICE", label: "Reunião Marcada" },
  { id: "EXECUTING", label: "Reunião Realizada" },
  { id: "FINAL_INVOICE", label: "Proposta Enviada" },
  { id: "WON", label: "Vendas" },
];

// Degradê da marca (rosa → roxo) do topo à base do funil.
const COLORS = ["#FF0080", "#E81D8A", "#C620A0", "#A625B0", "#822ABD", "#5E2EC8"];

function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function convColor(pct: number): string {
  if (pct >= 50) return "text-emerald-400";
  if (pct >= 20) return "text-amber-400";
  return "text-red-400";
}

function fmtDays(d: number): string {
  if (d < 1) {
    const h = Math.round(d * 24);
    return `${h}h`;
  }
  return `${d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${d < 2 ? "dia" : "dias"}`;
}

export function SalesFunnel({ deals, stageStats = [] }: { deals: BitrixDeal[]; stageStats?: StageStat[] }) {
  const statMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stageStats) m.set(s.stageId, s.avgDays);
    return m;
  }, [stageStats]);

  const data = useMemo(() => {
    // Etapas fora do funil (stand-by, perdidas, importadas) contam como topo:
    // toda negociação criada passou pela etapa "Lead".
    const indexOf = (sid: string) => {
      const i = FUNNEL_STAGES.findIndex((s) => s.id === sid);
      return i === -1 ? 0 : i;
    };

    return FUNNEL_STAGES.map((stage, i) => {
      // Negociações atualmente NESTA etapa
      const current = deals.filter((d) => d.stageId === stage.id);
      // Negociações que ALCANÇARAM esta etapa (estão nela ou avançaram além)
      const reachedDeals = deals.filter((d) => {
        const di = indexOf(d.stageId);
        return di >= i;
      });
      return {
        ...stage,
        currentCount: current.length,
        reached: reachedDeals.length,
        reachedValue: reachedDeals.reduce((s, d) => s + d.value, 0),
      };
    });
  }, [deals]);

  const maxReached = Math.max(1, data[0]?.reached ?? 1);
  const overall =
    data[0]?.reached > 0 ? Math.round(((data[data.length - 1]?.reached ?? 0) / data[0].reached) * 100) : 0;

  // Largura (%) de cada faixa — escala raiz quadrada para o funil ficar legível.
  const widthFor = (reached: number) => 46 + 54 * Math.sqrt(reached / maxReached);

  const hasData = data.some((d) => d.reached > 0);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">Funil de Vendas</h3>
          <p className="text-xs text-muted mt-0.5">
            Negociações que alcançaram cada etapa e conversão entre elas
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text leading-none">{overall}%</p>
          <p className="text-[10px] text-muted mt-1">Conversão total (Lead → Vendas)</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted">
          <Filter className="w-4 h-4 mr-2 opacity-50" />
          Sem negociações nas etapas do funil ainda.
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {data.map((stage, i) => {
            const topW = widthFor(stage.reached);
            const next = data[i + 1];
            const botW = next ? widthFor(next.reached) : topW * 0.62;
            const isLast = i === data.length - 1;

            const leftTop = (100 - topW) / 2;
            const leftBot = (100 - botW) / 2;
            const clip = `polygon(${leftTop}% 0, ${100 - leftTop}% 0, ${100 - leftBot}% 100%, ${leftBot}% 100%)`;

            // Conversão da etapa anterior para esta
            const prev = data[i - 1];
            const convFromPrev = prev && prev.reached > 0 ? Math.round((stage.reached / prev.reached) * 100) : null;

            return (
              <Fragment key={stage.id}>
                {i > 0 && (
                  <div className="flex items-center justify-center py-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-card border border-border">
                      <ChevronDown className="w-3 h-3 text-muted" />
                      <span className={convColor(convFromPrev ?? 0)}>{convFromPrev ?? 0}%</span>
                      <span className="text-muted">de conversão</span>
                    </span>
                  </div>
                )}

                <div className="relative h-[68px]">
                  {/* Forma do funil */}
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      clipPath: clip,
                      background: `linear-gradient(180deg, ${COLORS[i]} 0%, ${COLORS[i]}cc 100%)`,
                    }}
                  />
                  {/* Conteúdo (não recortado) */}
                  <div className="absolute inset-0 flex items-center justify-between px-6 text-white">
                    <div className="drop-shadow-sm">
                      <span className="text-sm font-semibold block leading-tight">{stage.label}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] ${statMap.has(stage.id) ? "opacity-80" : "opacity-50"}`}>
                        <Clock className="w-3 h-3" />
                        {statMap.has(stage.id) ? `${fmtDays(statMap.get(stage.id)!)} em média` : "sem dados"}
                      </span>
                    </div>
                    <div className="text-right drop-shadow-sm">
                      <span className="text-xl font-bold leading-none">{stage.reached}</span>
                      <span className="text-[11px] opacity-90 ml-1">
                        {stage.reached === 1 ? "negociação" : "negociações"}
                      </span>
                      <p className="text-[10px] opacity-80">{fmtCurrency(stage.reachedValue)}</p>
                    </div>
                  </div>
                  {isLast && stage.currentCount !== stage.reached && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2" />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Detalhe: quantos estão atualmente em cada etapa */}
      {hasData && (
        <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.map((stage, i) => (
            <div key={stage.id} className="text-center">
              <span className="inline-block w-2 h-2 rounded-full mb-1" style={{ background: COLORS[i] }} />
              <p className="text-base font-bold leading-none">{stage.currentCount}</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">{stage.label}</p>
              <p className="text-[9px] text-muted/60">agora nesta etapa</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
