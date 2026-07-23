"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  from: string; // "YYYY-MM-DD"
  to: string;
  onChange: (from: string, to: string) => void;
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const fmtShort = (s: string) => {
  if (!s) return "";
  const d = parseISO(s);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function DateRangePicker({ from, to, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (from ? parseISO(from) : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const fromD = from ? parseISO(from) : null;
  const toD = to ? parseISO(to) : null;
  const today = new Date();

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  function handleDay(day: Date) {
    const iso = toISO(day);
    if (!from || (from && to)) {
      onChange(iso, "");
    } else {
      const f = parseISO(from);
      if (day < f) onChange(iso, from);
      else onChange(from, iso);
    }
  }

  function isInRange(day: Date) {
    if (fromD && toD) return day > fromD && day < toD;
    return false;
  }
  function isEndpoint(day: Date) {
    return (fromD && sameDay(day, fromD)) || (toD && sameDay(day, toD));
  }

  const label =
    from && to
      ? `${fmtShort(from)} → ${fmtShort(to)}`
      : from
        ? `A partir de ${fmtShort(from)}`
        : "Escolher datas";

  const monthLabel = view
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg pl-3 pr-2.5 py-1.5 text-xs font-medium transition-all bg-gradient-to-r from-accent/10 to-hero-purple/10 border ${
          open ? "border-accent/60 shadow-sm shadow-accent/10" : "border-accent/30 hover:border-accent/50"
        }`}
      >
        <CalendarRange className="w-4 h-4 text-accent shrink-0" />
        <span className={from ? "text-foreground" : "text-muted"}>{label}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-[280px] rounded-xl border border-border bg-card p-4 shadow-2xl shadow-black/40">
          {/* Cabeçalho do mês */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const endpoint = isEndpoint(day);
              const inRange = isInRange(day);
              const isToday = sameDay(day, today);
              return (
                <button
                  key={i}
                  onClick={() => handleDay(day)}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    endpoint
                      ? "bg-accent text-white shadow-sm shadow-accent/30"
                      : inRange
                        ? "bg-accent/15 text-accent"
                        : isToday
                          ? "text-accent ring-1 ring-accent/40"
                          : "text-foreground hover:bg-background/60"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <button
              onClick={() => {
                onChange("", "");
              }}
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
            <button
              onClick={() => {
                const t = toISO(new Date());
                onChange(t, t);
                setView(new Date());
              }}
              className="text-xs text-accent hover:text-accent-dark font-medium transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs font-medium px-3 py-1 rounded-md bg-accent hover:bg-accent-dark text-white transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
