"use client";

import { useState, useMemo } from "react";
import {
  Phone,
  Users2,
  CalendarCheck,
  Mail,
  MessageSquare,
  MessagesSquare,
  ClipboardList,
  AppWindow,
  FileText,
  Activity,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  LayoutGrid,
  CalendarDays,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { ActivityStats, ActivityItem, ActivityStatus } from "@/types/comercial";
import { ActivityCalendar } from "./activity-calendar";

const TYPE_ICON: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4 text-emerald-400" />,
  todo: <ClipboardList className="w-4 h-4 text-blue-400" />,
  meeting: <CalendarCheck className="w-4 h-4 text-violet-400" />,
  email: <Mail className="w-4 h-4 text-amber-400" />,
  chat: <MessagesSquare className="w-4 h-4 text-cyan-400" />,
  whatsapp: <MessageSquare className="w-4 h-4 text-green-400" />,
  form: <FileText className="w-4 h-4 text-pink-400" />,
  app: <AppWindow className="w-4 h-4 text-muted" />,
  other: <Activity className="w-4 h-4 text-muted" />,
};
const TYPE_TINT: Record<string, string> = {
  call: "bg-emerald-500/15",
  todo: "bg-blue-500/15",
  meeting: "bg-violet-500/15",
  email: "bg-amber-500/15",
  chat: "bg-cyan-500/15",
  whatsapp: "bg-green-500/15",
  form: "bg-pink-500/15",
  app: "bg-card",
  other: "bg-card",
};
const TYPE_HINT: Record<string, string> = {
  call: "Chamadas telefônicas",
  todo: "Lembretes e tarefas no CRM",
  meeting: "Reuniões agendadas",
  email: "E-mails enviados/recebidos",
  chat: "Atendimentos por chat / canais",
  whatsapp: "Conversas no WhatsApp",
  form: "Respostas de formulário",
  app: "Geradas por integrações",
  other: "Outras atividades",
};
const STATUS_CHIP: Record<ActivityStatus, string> = {
  done: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-blue-500/15 text-blue-400",
  overdue: "bg-red-500/15 text-red-400",
};
const STATUS_LABEL: Record<ActivityStatus, string> = {
  done: "Concluída",
  pending: "Pendente",
  overdue: "Atrasada",
};

type View = "resumo" | "calendario" | "lista";
type StatusFilter = "all" | ActivityStatus;

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivitiesSection({ stats }: { stats: ActivityStats | null }) {
  const [view, setView] = useState<View>("resumo");
  const [openKind, setOpenKind] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listLimit, setListLimit] = useState(20);

  const items: ActivityItem[] = useMemo(() => stats?.items ?? [], [stats]);
  const maxUser = Math.max(1, ...(stats?.byUser ?? []).map((u) => u.count));
  const detail = openKind ? items.filter((i) => i.kind === openKind) : [];
  const openLabel = stats?.byType.find((t) => t.type === openKind)?.label ?? "";

  const listItems = useMemo(() => {
    const base = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);
    return [...base].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [items, statusFilter]);

  const empty = !stats || stats.items.length === 0;

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Users2 className="w-4 h-4 text-accent" /> Tarefas & Atividades
          </h3>
          <p className="text-xs text-muted mt-0.5">Concluídas, pendentes e atrasadas do time</p>
        </div>
        {/* Seletor de visualização */}
        <div className="flex rounded-lg bg-card border border-border p-0.5">
          {([
            ["resumo", "Resumo", <LayoutGrid key="i" className="w-3.5 h-3.5" />],
            ["calendario", "Calendário", <CalendarDays key="i" className="w-3.5 h-3.5" />],
            ["lista", "Lista", <List key="i" className="w-3.5 h-3.5" />],
          ] as [View, string, React.ReactNode][]).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === id ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs de status */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatusKpi icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} tint="bg-emerald-500/15" label="Concluídas" value={stats?.total ?? 0} />
        <StatusKpi icon={<Clock className="w-4 h-4 text-blue-400" />} tint="bg-blue-500/15" label="Pendentes" value={stats?.pending ?? 0} />
        <StatusKpi icon={<AlertTriangle className="w-4 h-4 text-red-400" />} tint="bg-red-500/15" label="Atrasadas" value={stats?.overdue ?? 0} />
      </div>

      {empty ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted">
          <Activity className="w-4 h-4 mr-2 opacity-50" />
          Nenhuma tarefa registrada ainda.
        </div>
      ) : view === "calendario" ? (
        <ActivityCalendar items={items} />
      ) : view === "lista" ? (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ["all", "Todas"],
              ["done", "Concluídas"],
              ["pending", "Pendentes"],
              ["overdue", "Atrasadas"],
            ] as [StatusFilter, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setStatusFilter(id);
                  setListLimit(20);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === id
                    ? "bg-accent text-white border-accent"
                    : "bg-card border-border text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {listItems.slice(0, listLimit).map((it) => (
              <div key={it.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-card/40 border border-border/40">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[it.kind] || "bg-card"}`}>
                  {TYPE_ICON[it.kind] || <Activity className="w-4 h-4 text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{it.subject}</p>
                  <p className="text-[11px] text-muted truncate">
                    com <span className="text-foreground/80">{it.dealTitle}</span> · {it.responsibleName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[it.status]}`}>
                    {STATUS_LABEL[it.status]}
                  </span>
                  <p className="text-[10px] text-muted mt-1">{fmtDateTime(it.at)}</p>
                </div>
              </div>
            ))}
          </div>
          {listLimit < listItems.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setListLimit((v) => v + 20)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-card border border-border text-muted hover:text-foreground transition-colors"
              >
                Mostrar mais ({listItems.length - listLimit} restantes)
              </button>
            </div>
          )}
        </>
      ) : (
        /* RESUMO */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-muted mb-3">Concluídas por tipo · clique para detalhar</p>
              {stats!.byType.length === 0 ? (
                <p className="text-xs text-muted py-4">Nenhuma atividade concluída ainda.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats!.byType.map((t) => {
                    const active = openKind === t.type;
                    return (
                      <button
                        key={t.type}
                        onClick={() => setOpenKind(active ? null : t.type)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          active ? "border-accent/60 bg-accent/5" : "border-border/50 bg-card/50 hover:border-border"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[t.type] || "bg-card"}`}>
                          {TYPE_ICON[t.type] || <Activity className="w-4 h-4 text-muted" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold leading-none">{t.count}</span>
                            <span className="text-sm font-medium truncate">{t.label}</span>
                          </div>
                          <p className="text-[10px] text-muted/70 leading-tight mt-0.5">{TYPE_HINT[t.type] || ""}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${active ? "rotate-180" : ""}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted mb-3">Concluídas por colaborador</p>
              <div className="space-y-2.5">
                {stats!.byUser.slice(0, 8).map((u) => (
                  <div key={u.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium truncate max-w-[180px]">{u.name}</span>
                      <span className="text-muted">{u.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-card overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-hero-purple" style={{ width: `${(u.count / maxUser) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {openKind && (
            <div className="mt-5 pt-5 border-t border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${TYPE_TINT[openKind] || "bg-card"}`}>
                  {TYPE_ICON[openKind]}
                </div>
                <p className="text-sm font-medium">
                  {openLabel} <span className="text-muted">· {detail.length}</span>
                </p>
              </div>
              {detail.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">Sem detalhes disponíveis.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {detail.map((it) => (
                    <div key={it.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-card/40 border border-border/40">
                      <div className="mt-0.5 shrink-0">
                        {it.kind === "call" && it.direction === "1" ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        ) : it.kind === "call" && it.direction === "2" ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          TYPE_ICON[it.kind]
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{it.subject}</p>
                        <p className="text-[11px] text-muted truncate">
                          com <span className="text-foreground/80">{it.dealTitle}</span> · {it.responsibleName}
                          {it.kind === "call" && it.direction === "1" && " · recebida"}
                          {it.kind === "call" && it.direction === "2" && " · feita"}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted shrink-0 whitespace-nowrap">{fmtDateTime(it.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusKpi({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-[11px] text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}
