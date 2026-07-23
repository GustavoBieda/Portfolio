"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ScrollText } from "lucide-react";
import type { BitrixDeal, DealSemantic } from "@/types/comercial";

const SEM_LABEL: Record<DealSemantic, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
};
const SEM_STYLE: Record<DealSemantic, string> = {
  open: "bg-blue-500/15 text-blue-400",
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-red-500/15 text-red-400",
};
const SEM_DOT: Record<DealSemantic, string> = {
  open: "#3b82f6",
  won: "#10b981",
  lost: "#ef4444",
};

type SortKey = "title" | "stageName" | "assignedName" | "value" | "createdAt" | "updatedAt";

function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 25;

export function DealsTable({ deals }: { deals: BitrixDeal[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? deals.filter((d) =>
          [d.title, d.stageName, d.assignedName, SEM_LABEL[d.semantic]]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : deals;

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "value") cmp = a.value - b.value;
      else if (sortKey === "createdAt" || sortKey === "updatedAt")
        cmp = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [deals, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "updatedAt" || key === "value" ? "desc" : "asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />;
  }

  const shown = filtered.slice(0, visible);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-accent" /> Logs de Negociações
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {filtered.length} {filtered.length === 1 ? "negociação" : "negociações"} no período selecionado
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Buscar por nome, etapa, responsável..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          Nenhuma negociação encontrada.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <Th label="Lead" onClick={() => toggleSort("title")} icon={<SortIcon col="title" />} />
                  <Th label="Etapa" onClick={() => toggleSort("stageName")} icon={<SortIcon col="stageName" />} />
                  <Th label="Responsável" onClick={() => toggleSort("assignedName")} icon={<SortIcon col="assignedName" />} />
                  <Th label="Situação" />
                  <Th label="Valor" align="right" onClick={() => toggleSort("value")} icon={<SortIcon col="value" />} />
                  <Th label="Criado em" onClick={() => toggleSort("createdAt")} icon={<SortIcon col="createdAt" />} />
                  <Th label="Atualizado" onClick={() => toggleSort("updatedAt")} icon={<SortIcon col="updatedAt" />} />
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id} className="border-b border-border/40 last:border-0 hover:bg-card/50 transition-colors">
                    <td className="py-2.5 pr-3 font-medium max-w-[220px] truncate" title={d.title}>
                      {d.title}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEM_DOT[d.semantic] }} />
                        {d.stageName}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted whitespace-nowrap">{d.assignedName}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${SEM_STYLE[d.semantic]}`}>
                        {SEM_LABEL[d.semantic]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium whitespace-nowrap">{fmtCurrency(d.value)}</td>
                    <td className="py-2.5 pr-3 text-muted whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                    <td className="py-2.5 text-muted whitespace-nowrap" title={fmtDateTime(d.updatedAt)}>
                      {fmtDate(d.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visible < filtered.length && (
            <div className="flex justify-center mt-5">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-card border border-border text-muted hover:text-foreground transition-colors"
              >
                Mostrar mais ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Th({
  label,
  onClick,
  icon,
  align = "left",
}: {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={`pb-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {onClick ? (
        <button
          onClick={onClick}
          className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          {label}
          {icon}
        </button>
      ) : (
        label
      )}
    </th>
  );
}
