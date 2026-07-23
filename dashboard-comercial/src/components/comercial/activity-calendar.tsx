"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActivityItem, ActivityStatus } from "@/types/comercial";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS: Record<ActivityStatus, { label: string; dot: string; chip: string }> = {
  done: { label: "Concluída", dot: "#10b981", chip: "bg-emerald-500/15 text-emerald-400" },
  pending: { label: "Pendente", dot: "#3b82f6", chip: "bg-blue-500/15 text-blue-400" },
  overdue: { label: "Atrasada", dot: "#ef4444", chip: "bg-red-500/15 text-red-400" },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ActivityCalendar({ items }: { items: ActivityItem[] }) {
  const [view, setView] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = view.getFullYear();
  const monthIndex = view.getMonth();

  const itemsByDay = useMemo(() => {
    const map = new Map<number, ActivityItem[]>();
    for (const it of items) {
      if (!it.at) continue;
      const d = new Date(it.at);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getMonth() !== monthIndex || d.getFullYear() !== year) continue;
      const day = d.getDate();
      const arr = map.get(day) ?? [];
      arr.push(it);
      map.set(day, arr);
    }
    return map;
  }, [items, monthIndex, year]);

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === monthIndex && today.getFullYear() === year;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = view
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  const selectedItems = selectedDay ? itemsByDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setView(new Date(year, monthIndex - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button
          onClick={() => setView(new Date(year, monthIndex + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-3 text-[10px] text-muted">
        {(Object.keys(STATUS) as ActivityStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS[s].dot }} />
            {STATUS[s].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`b-${idx}`} className="min-h-[84px] rounded-lg bg-background/30" />;
          const dayItems = itemsByDay.get(day) ?? [];
          const visible = dayItems.slice(0, 3);
          const extra = dayItems.length - visible.length;
          return (
            <div
              key={day}
              onClick={() => dayItems.length > 0 && setSelectedDay(day)}
              className={`min-h-[84px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors ${
                dayItems.length > 0 ? "cursor-pointer hover:border-accent/40" : ""
              } ${isToday(day) ? "border-accent/60 bg-accent/5" : "border-border bg-background/40"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${isToday(day) ? "text-accent" : "text-foreground"}`}>
                  {day}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[9px] font-medium text-muted">{dayItems.length}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((it) => (
                  <span
                    key={it.id}
                    title={`${it.subject} · ${it.dealTitle} · ${STATUS[it.status].label}`}
                    className={`truncate text-[9px] leading-tight px-1 py-0.5 rounded ${STATUS[it.status].chip}`}
                  >
                    {it.subject}
                  </span>
                ))}
                {extra > 0 && <span className="text-[9px] text-muted pl-1">+{extra} mais</span>}
              </div>
            </div>
          );
        })}
      </div>

      {itemsByDay.size === 0 && (
        <p className="text-center text-xs text-muted py-8">Nenhuma tarefa neste mês.</p>
      )}

      {/* Modal do dia */}
      {selectedDay !== null && selectedItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div className="glass w-full max-w-md rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                {new Date(year, monthIndex, selectedDay).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-muted hover:text-foreground text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedItems.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-background/50 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{it.subject}</p>
                    <p className="text-[11px] text-muted truncate">
                      com <span className="text-foreground/80">{it.dealTitle}</span> · {it.responsibleName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS[it.status].chip}`}>
                      {STATUS[it.status].label}
                    </span>
                    {fmtTime(it.at) && <p className="text-[10px] text-muted mt-1">{fmtTime(it.at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
