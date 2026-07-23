"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Trophy,
  XCircle,
  Target,
  DollarSign,
  Activity,
  Plus,
  Pencil,
  Trash2,
  Database,
  Users,
  UserPlus,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { BitrixDeal, ComercialEvent, BitrixStage, DealSemantic, StageStat, ActivityStats } from "@/types/comercial";
import { getDashboardData } from "@/lib/mock-data";
import { SalesFunnel } from "./sales-funnel";
import { DealsTable } from "./deals-table";
import { DateRangePicker } from "./date-range-picker";
import { AgingTable } from "./aging-table";
import { SourcePerformance } from "./source-performance";
import { ActivitiesSection } from "./activities-section";

type Period = "day" | "week" | "month" | "all" | "custom";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "all", label: "Total" },
];

function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return String(v);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function inPeriod(iso: string, period: Period, customFrom: string, customTo: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();

  if (period === "all") return true;
  if (period === "day") {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }
  if (period === "week") {
    // Semana corrente: domingo a sábado
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6, 23, 59, 59, 999);
    const t = d.getTime();
    return t >= sunday.getTime() && t <= saturday.getTime();
  }
  if (period === "month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  // custom — limites opcionais (vazio = sem limite naquele lado)
  const t = d.getTime();
  if (customFrom && t < new Date(`${customFrom}T00:00:00`).getTime()) return false;
  if (customTo && t > new Date(`${customTo}T23:59:59`).getTime()) return false;
  return true;
}

const semanticColor: Record<DealSemantic, string> = {
  open: "#3b82f6",
  won: "#10b981",
  lost: "#ef4444",
};

interface WindowMetrics {
  leads: number;
  openValue: number;
  wonValue: number;
  conversion: number;
  ticket: number;
}

function metricsOf(arr: BitrixDeal[]): WindowMetrics {
  const sum = (a: BitrixDeal[]) => a.reduce((s, d) => s + d.value, 0);
  const won = arr.filter((d) => d.semantic === "won");
  const lost = arr.filter((d) => d.semantic === "lost");
  const open = arr.filter((d) => d.semantic === "open");
  const closed = won.length + lost.length;
  return {
    leads: arr.length,
    openValue: sum(open),
    wonValue: sum(won),
    conversion: closed > 0 ? (won.length / closed) * 100 : 0,
    ticket: won.length > 0 ? sum(won) / won.length : 0,
  };
}

/** Janelas comparáveis (mais recentes ao final) para o período selecionado. */
function buildWindows(
  period: Period,
  customFrom?: string,
  customTo?: string
): { start: number; end: number }[] | null {
  const now = new Date();
  const wins: { start: number; end: number }[] = [];
  if (period === "custom") {
    if (!customFrom || !customTo) return null;
    let fromD = new Date(`${customFrom}T00:00:00`);
    let toD = new Date(`${customTo}T00:00:00`);
    if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return null;
    if (fromD > toD) [fromD, toD] = [toD, fromD];
    const nDays = Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1;
    for (let i = 5; i >= 0; i--) {
      const s = new Date(fromD.getFullYear(), fromD.getMonth(), fromD.getDate() - i * nDays);
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + nDays - 1, 23, 59, 59, 999);
      wins.push({ start: s.getTime(), end: e.getTime() });
    }
    return wins;
  }
  if (period === "day") {
    for (let i = 6; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 23, 59, 59, 999);
      wins.push({ start: s.getTime(), end: e.getTime() });
    }
    return wins;
  }
  if (period === "week") {
    const sundayThis = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    for (let i = 5; i >= 0; i--) {
      const s = new Date(sundayThis.getFullYear(), sundayThis.getMonth(), sundayThis.getDate() - i * 7);
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6, 23, 59, 59, 999);
      wins.push({ start: s.getTime(), end: e.getTime() });
    }
    return wins;
  }
  if (period === "month") {
    for (let i = 5; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      wins.push({ start: s.getTime(), end: e.getTime() });
    }
    return wins;
  }
  return null; // total / personalizado: sem comparação
}

const COMPARE_LABEL: Record<Period, string> = {
  day: "ontem",
  week: "semana anterior",
  month: "mês anterior",
  all: "",
  custom: "período anterior",
};

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const w = 70;
  const h = 24;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ComercialDashboard() {
  const [deals, setDeals] = useState<BitrixDeal[]>([]);
  const [events, setEvents] = useState<ComercialEvent[]>([]);
  const [stages, setStages] = useState<BitrixStage[]>([]);
  const [stageStats, setStageStats] = useState<StageStat[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [, forceTick] = useState(0);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // Trocar por uma chamada à sua API para usar dados reais.
      const d = await getDashboardData();
      setDeals(d.deals);
      setEvents(d.events);
      setStages(d.stages);
      setStageStats(d.stageStats);
      setActivityStats(d.activityStats);
      setLastSync(new Date());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const poll = setInterval(() => fetchData(true), 8000);
    const tick = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [fetchData]);

  const filtered = useMemo(
    () => deals.filter((d) => inPeriod(d.createdAt, period, customFrom, customTo)),
    [deals, period, customFrom, customTo]
  );

  const metrics = useMemo(() => {
    const open = filtered.filter((d) => d.semantic === "open");
    const won = filtered.filter((d) => d.semantic === "won");
    const lost = filtered.filter((d) => d.semantic === "lost");
    const sum = (arr: BitrixDeal[]) => arr.reduce((s, d) => s + d.value, 0);
    const closedCount = won.length + lost.length;
    return {
      total: filtered.length,
      openCount: open.length,
      openValue: sum(open),
      wonCount: won.length,
      wonValue: sum(won),
      lostCount: lost.length,
      lostValue: sum(lost),
      conversion: closedCount > 0 ? Math.round((won.length / closedCount) * 100) : 0,
      ticket: won.length > 0 ? sum(won) / won.length : 0,
      pipeline: sum(open),
    };
  }, [filtered]);

  // Séries comparativas por janela (sparkline + delta período-a-período)
  const series = useMemo(() => {
    const wins = buildWindows(period, customFrom, customTo);
    if (!wins) return null;
    const m = wins.map((w) =>
      metricsOf(deals.filter((d) => {
        const t = new Date(d.createdAt).getTime();
        return t >= w.start && t <= w.end;
      }))
    );
    return {
      leads: m.map((x) => x.leads),
      openValue: m.map((x) => x.openValue),
      wonValue: m.map((x) => x.wonValue),
      conversion: m.map((x) => x.conversion),
      ticket: m.map((x) => x.ticket),
    };
  }, [deals, period, customFrom, customTo]);

  const compareLabel = COMPARE_LABEL[period];

  // Funil por etapa (ordenado pelas etapas do Bitrix)
  const funnel = useMemo(() => {
    const byStage = new Map<string, { name: string; semantic: DealSemantic; count: number; value: number }>();
    for (const st of stages) {
      byStage.set(st.statusId, { name: st.name, semantic: st.semantic, count: 0, value: 0 });
    }
    for (const d of filtered) {
      const cur = byStage.get(d.stageId) || { name: d.stageName || "—", semantic: d.semantic, count: 0, value: 0 };
      cur.count += 1;
      cur.value += d.value;
      byStage.set(d.stageId, cur);
    }
    const rows = Array.from(byStage.values());
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [filtered, stages]);

  // Desempenho por colaborador
  const reps = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; won: number; lost: number; wonValue: number; openValue: number }
    >();
    for (const d of filtered) {
      const key = d.assignedName || "Sem responsável";
      const r = map.get(key) || { name: key, total: 0, won: 0, lost: 0, wonValue: 0, openValue: 0 };
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
      .map((r) => ({ ...r, conversion: r.won + r.lost > 0 ? Math.round((r.won / (r.won + r.lost)) * 100) : 0 }))
      .sort((a, b) => b.wonValue - a.wonValue);
  }, [filtered]);

  const chartData = useMemo(
    () => reps.slice(0, 8).map((r) => ({ name: r.name.split(" ")[0], valor: r.wonValue, full: r.name })),
    [reps]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status + controles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400">
            <Database className="w-3.5 h-3.5" />
            Dados simulados
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Ao vivo {lastSync && `· sincronizado ${relativeTime(lastSync.toISOString())}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-card border border-border p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.id ? "bg-accent text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setPeriod("custom")}
              title="Período personalizado"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === "custom" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Personalizado
            </button>
          </div>

          {period === "custom" && (
            <DateRangePicker
              from={customFrom}
              to={customTo}
              onChange={(f, t) => {
                setCustomFrom(f);
                setCustomTo(t);
              }}
            />
          )}
          <button
            onClick={() => fetchData(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-card border border-border text-muted hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Estado vazio */}
      {deals.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold text-lg">Sem negociações para exibir</h3>
          <p className="text-sm text-muted mt-1 max-w-lg mx-auto">
            Ajuste o período selecionado ou conecte sua fonte de dados em{" "}
            <code className="text-accent">src/lib/mock-data.ts</code>.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<UserPlus className="w-4 h-4 text-pink-400" />}
          tint="bg-pink-500/15"
          label="Leads criados"
          value={String(metrics.total)}
          sub="no período selecionado"
          series={series?.leads}
          compareLabel={compareLabel}
          formatValue={(n) => String(Math.round(n))}
        />
        <KpiCard
          icon={<DollarSign className="w-4 h-4 text-blue-400" />}
          tint="bg-blue-500/15"
          label="Pipeline em aberto"
          value={fmtCurrency(metrics.openValue)}
          sub={`${metrics.openCount} negociações`}
          series={series?.openValue}
          compareLabel={compareLabel}
          formatValue={fmtCurrency}
        />
        <KpiCard
          icon={<Trophy className="w-4 h-4 text-emerald-400" />}
          tint="bg-emerald-500/15"
          label="Ganhas"
          value={fmtCurrency(metrics.wonValue)}
          sub={`${metrics.wonCount} fechadas`}
          series={series?.wonValue}
          compareLabel={compareLabel}
          formatValue={fmtCurrency}
        />
        <KpiCard
          icon={<Target className="w-4 h-4 text-violet-400" />}
          tint="bg-violet-500/15"
          label="Taxa de conversão"
          value={`${metrics.conversion}%`}
          sub={`${metrics.wonCount} ganhas / ${metrics.lostCount} perdidas`}
          series={series?.conversion}
          compareLabel={compareLabel}
          formatValue={(n) => `${Math.round(n)}%`}
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4 text-accent" />}
          tint="bg-accent/15"
          label="Ticket médio"
          value={fmtCurrency(metrics.ticket)}
          sub={`com base em ${metrics.wonCount} ganhas`}
          series={series?.ticket}
          compareLabel={compareLabel}
          formatValue={fmtCurrency}
        />
      </div>

      {/* Funil de Vendas desenhado */}
      <SalesFunnel deals={filtered} stageStats={stageStats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Distribuição por etapa (todas as etapas) */}
        <div className="lg:col-span-3 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Distribuição por Etapa</h3>
              <p className="text-xs text-muted mt-0.5">Todas as etapas (situação atual)</p>
            </div>
          </div>
          {funnel.rows.length === 0 ? (
            <EmptyHint text="Sem etapas para exibir ainda." />
          ) : (
            <div className="space-y-3">
              {funnel.rows.map((row) => (
                <div key={row.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: semanticColor[row.semantic] }}
                      />
                      {row.name}
                    </span>
                    <span className="text-muted">
                      {row.count} · {fmtCurrency(row.value)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-card overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(row.count / funnel.max) * 100}%`,
                        background: semanticColor[row.semantic],
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed em tempo real */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Atividade em tempo real</h3>
              <p className="text-xs text-muted mt-0.5">Últimas movimentações</p>
            </div>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          {events.length === 0 ? (
            <EmptyHint text="Nenhum evento recebido ainda." />
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-card">
                    {ev.action === "created" && <Plus className="w-3.5 h-3.5 text-emerald-400" />}
                    {ev.action === "updated" && <Pencil className="w-3.5 h-3.5 text-blue-400" />}
                    {ev.action === "deleted" && <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    {ev.action === "unknown" && <Activity className="w-3.5 h-3.5 text-muted" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{ev.dealTitle}</p>
                    <p className="text-[11px] text-muted truncate">
                      {ev.action === "created" && "Nova negociação"}
                      {ev.action === "updated" && (ev.stageName ? `Movida para ${ev.stageName}` : "Atualizada")}
                      {ev.action === "deleted" && "Negociação removida"}
                      {ev.assignedName && ` · ${ev.assignedName}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted shrink-0">{relativeTime(ev.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Negociações paradas (aging) */}
      <AgingTable deals={filtered} />

      {/* Desempenho por colaborador */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Desempenho por colaborador
            </h3>
            <p className="text-xs text-muted mt-0.5">Valor ganho e taxa de conversão por responsável</p>
          </div>
        </div>

        {reps.length === 0 ? (
          <EmptyHint text="Sem dados de colaboradores ainda." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 42)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickFormatter={(v) => fmtCompact(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  content={({ active, payload }) =>
                    active && payload && payload[0] ? (
                      <div className="bg-card border border-border rounded-lg p-2.5 shadow-xl">
                        <p className="text-xs font-medium">{payload[0].payload.full}</p>
                        <p className="text-xs text-emerald-400 mt-0.5">{fmtCurrency(Number(payload[0].value))}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#FF0080" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="pb-2 font-medium">Colaborador</th>
                    <th className="pb-2 font-medium text-center">Negs.</th>
                    <th className="pb-2 font-medium text-center">Ganhas</th>
                    <th className="pb-2 font-medium text-center">Conv.</th>
                    <th className="pb-2 font-medium text-right">Valor ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r) => (
                    <tr key={r.name} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 font-medium truncate max-w-[140px]">{r.name}</td>
                      <td className="py-2.5 text-center text-muted">{r.total}</td>
                      <td className="py-2.5 text-center text-emerald-400">{r.won}</td>
                      <td className="py-2.5 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                          {r.conversion}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium">{fmtCurrency(r.wonValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Desempenho por origem + Atividades do time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourcePerformance deals={filtered} />
        <ActivitiesSection stats={activityStats} />
      </div>

      {/* Logs de negociações (todas as do filtro) */}
      <DealsTable deals={filtered} />
    </div>
  );
}

function KpiCard({
  icon,
  tint,
  label,
  value,
  sub,
  series,
  compareLabel,
  formatValue,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string;
  sub: string;
  series?: number[];
  compareLabel?: string;
  formatValue?: (n: number) => string;
}) {
  let delta: number | null = null;
  let up = true;
  let prevValue: number | null = null;
  if (series && series.length >= 2) {
    const cur = series[series.length - 1];
    const prev = series[series.length - 2];
    prevValue = prev;
    if (prev !== 0) {
      delta = ((cur - prev) / Math.abs(prev)) * 100;
      up = delta >= 0;
    } else if (cur > 0) {
      delta = 100;
      up = true;
    } else {
      delta = 0;
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>{icon}</div>
        <p className="text-xs text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {delta !== null ? (
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                up ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(delta).toFixed(0)}%
            </span>
            {compareLabel && <span className="text-[10px] text-muted ml-1">vs {compareLabel}</span>}
            {prevValue !== null && (
              <p className="text-[10px] text-muted/70 mt-0.5">
                anterior: {formatValue ? formatValue(prevValue) : prevValue}
              </p>
            )}
          </div>
          <Sparkline data={series!} up={up} />
        </div>
      ) : (
        <p className="text-[11px] text-muted mt-1">{sub}</p>
      )}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted">
      <XCircle className="w-4 h-4 mr-2 opacity-50" />
      {text}
    </div>
  );
}
