/**
 * Dados simulados do Dashboard Comercial.
 *
 * Este módulo substitui a integração com o CRM. Ele gera um conjunto
 * coerente de negociações, eventos, tempos por etapa e atividades,
 * distribuídos ao longo dos últimos meses para que os filtros de período
 * e os comparativos período-a-período tenham dados reais para exibir.
 *
 * Para plugar uma fonte de dados real, basta trocar `getDashboardData()`
 * por uma chamada à sua API mantendo o mesmo formato de retorno.
 */

import type {
  BitrixDeal,
  BitrixStage,
  ComercialEvent,
  StageStat,
  ActivityStats,
  ActivityItem,
  DealSemantic,
} from "@/types/comercial";
import { sourceLabelFor } from "@/types/comercial";

/* ------------------------------------------------------------------ *
 * PRNG com semente — mantém os dados estáveis entre renders
 * ------------------------------------------------------------------ */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rng = makeRng(20260602);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (min: number, max: number) => min + rng() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

/* ------------------------------------------------------------------ *
 * Catálogos
 * ------------------------------------------------------------------ */
export const MOCK_STAGES: BitrixStage[] = [
  { statusId: "NEW", name: "Lead", semantic: "open", sort: 10, categoryId: "0" },
  { statusId: "PREPARATION", name: "Assumir Conversa", semantic: "open", sort: 20, categoryId: "0" },
  { statusId: "PREPAYMENT_INVOICE", name: "Reunião Marcada", semantic: "open", sort: 30, categoryId: "0" },
  { statusId: "EXECUTING", name: "Reunião Realizada", semantic: "open", sort: 40, categoryId: "0" },
  { statusId: "FINAL_INVOICE", name: "Proposta Enviada", semantic: "open", sort: 50, categoryId: "0" },
  { statusId: "UC_STANDBY", name: "Stand-by", semantic: "open", sort: 60, categoryId: "0" },
  { statusId: "WON", name: "Negócios Fechados", semantic: "won", sort: 70, categoryId: "0" },
  { statusId: "LOSE", name: "Negócios Perdidos", semantic: "lost", sort: 80, categoryId: "0" },
];

const REPS = ["Gustavo Bieda", "Lucas Gomes", "Elaine Cordeiro", "Marina Alves"];
const SOURCES = ["Disparo_Speedio", "CALL", "WEB", "RECOMMENDATION", ""];

const COMPANIES = [
  "Yalla Car", "Storge", "Blauberg Brasil", "Revelar Gestão", "Bamboo Fit",
  "Usegas", "Avalyst Serviços", "Nexo Contábil", "Grupo Vertex", "Clínica Vida",
  "TechnoPar", "Alfa Log", "Casa & Cia", "Meridiano Seguros", "Poli Engenharia",
  "Doce Sabor", "Norte Agro", "Vitalis Saúde", "Prime Móveis", "Rota Certa",
  "Ubik Software", "Lumen Design", "Fortis Advogados", "Selva Turismo", "Aura Cosméticos",
  "Delta Transportes", "Verde Campo", "Orion Energia", "Praia Azul Hotel", "Foco Educação",
];
const PEOPLE = [
  "Patrícia Meneses", "Ricardo Menezes", "Vitória Fim", "Carlos Duarte", "Ana Beatriz",
  "Rogério Lima", "Fernanda Castro", "Bruno Tavares", "Juliana Reis", "Marcos Pinho",
];

/**
 * Peso de cada etapa por idade do mês. Negociações recentes concentram-se no
 * topo do funil; as mais antigas já tiveram tempo de fechar (ganhas/perdidas).
 */
function stageWeightsFor(monthsAgo: number): { id: string; weight: number }[] {
  const recent = monthsAgo === 0;
  return [
    { id: "NEW", weight: recent ? 45 : 22 },
    { id: "PREPARATION", weight: recent ? 12 : 10 },
    { id: "PREPAYMENT_INVOICE", weight: recent ? 9 : 10 },
    { id: "EXECUTING", weight: recent ? 8 : 10 },
    { id: "FINAL_INVOICE", weight: recent ? 8 : 10 },
    { id: "UC_STANDBY", weight: recent ? 4 : 5 },
    { id: "WON", weight: recent ? 7 : 17 },
    { id: "LOSE", weight: recent ? 7 : 16 },
  ];
}

function weightedStage(monthsAgo: number): string {
  const weights = stageWeightsFor(monthsAgo);
  const total = weights.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (const s of weights) {
    r -= s.weight;
    if (r <= 0) return s.id;
  }
  return "NEW";
}

const stageById = new Map(MOCK_STAGES.map((s) => [s.statusId, s]));
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

/* ------------------------------------------------------------------ *
 * Negociações
 * ------------------------------------------------------------------ */
function buildDeals(): BitrixDeal[] {
  const deals: BitrixDeal[] = [];
  const now = new Date();
  let id = 1000;

  // Distribui por mês (0 = mês atual) para que todos os períodos tenham dados
  for (let m = 0; m < 6; m++) {
    const count = m === 0 ? 46 : Math.max(18, 40 - m * 4);
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd =
      m === 0 ? now : new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59);

    for (let i = 0; i < count; i++) {
      let created: Date;
      if (m === 0 && i < 14) {
        // garante volume em "Hoje" e "Semana"
        created = new Date(now.getTime() - Math.floor(rng() * (i < 4 ? 1 : 7)) * 86400000);
      } else {
        created = new Date(monthStart.getTime() + rng() * (monthEnd.getTime() - monthStart.getTime()));
      }
      if (created > now) created = now;

      const ageDays = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86400000));
      deals.push(makeDeal(id++, weightedStage(m), created, ageDays));
    }
  }
  return deals;
}

function makeDeal(id: number, stageId: string, created: Date, ageDays: number): BitrixDeal {
  {
    const stage = stageById.get(stageId)!;
    const semantic: DealSemantic = stage.semantic;
    const createdAt = created.toISOString();

    // Entrou na etapa atual em algum momento depois da criação.
    // Distribuição realista: a maioria com poucos dias parada, teto de ~35 dias.
    const inStageDays = Math.min(ageDays, Math.floor(Math.pow(rng(), 2.2) * 35));
    const enteredStageAt = daysAgo(inStageDays);

    // Leads crus costumam ter valor 0; quanto mais avançado, maior o valor
    const advanced = ["EXECUTING", "FINAL_INVOICE", "WON", "UC_STANDBY"].includes(stageId);
    const value =
      stageId === "NEW" && rng() < 0.7
        ? 0
        : Math.round(between(advanced ? 8000 : 1500, advanced ? 90000 : 30000) / 100) * 100;

    const isPerson = rng() < 0.35;
    const title = isPerson ? pick(PEOPLE) : pick(COMPANIES);
    const source = pick(SOURCES);
    const closed = semantic !== "open";

    const assignedName = pick(REPS);

    return {
      id: String(id),
      title,
      stageId,
      stageName: stage.name,
      semantic,
      categoryId: "0",
      value,
      currency: "BRL",
      assignedById: String(1 + REPS.indexOf(assignedName)),
      assignedName,
      createdAt,
      updatedAt: enteredStageAt,
      closeDate: closed ? enteredStageAt : "",
      closed,
      source,
      sourceLabel: sourceLabelFor(source),
      enteredStageAt,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Tempo médio por etapa
 * ------------------------------------------------------------------ */
const MOCK_STAGE_STATS: StageStat[] = [
  { stageId: "NEW", avgDays: 7.2, samples: 320 },
  { stageId: "PREPARATION", avgDays: 1.8, samples: 74 },
  { stageId: "PREPAYMENT_INVOICE", avgDays: 4.1, samples: 41 },
  { stageId: "EXECUTING", avgDays: 8.5, samples: 28 },
  { stageId: "FINAL_INVOICE", avgDays: 9.8, samples: 22 },
  { stageId: "UC_STANDBY", avgDays: 21.4, samples: 11 },
];

/* ------------------------------------------------------------------ *
 * Feed de eventos
 * ------------------------------------------------------------------ */
function buildEvents(deals: BitrixDeal[]): ComercialEvent[] {
  const recent = [...deals]
    .sort((a, b) => new Date(b.enteredStageAt).getTime() - new Date(a.enteredStageAt).getTime())
    .slice(0, 14);
  return recent.map((d, i) => {
    const action = i % 5 === 0 ? "created" : i % 11 === 0 ? "deleted" : "updated";
    return {
      id: `ev-${d.id}-${i}`,
      type:
        action === "created" ? "ONCRMDEALADD" : action === "deleted" ? "ONCRMDEALDELETE" : "ONCRMDEALUPDATE",
      action: action as ComercialEvent["action"],
      dealId: d.id,
      dealTitle: d.title,
      stageName: d.stageName,
      semantic: d.semantic,
      assignedName: d.assignedName,
      value: d.value,
      at: new Date(Date.now() - i * intBetween(20, 180) * 60000).toISOString(),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Atividades / tarefas
 * ------------------------------------------------------------------ */
const ACTIVITY_KINDS: { kind: string; label: string; subjects: string[] }[] = [
  { kind: "todo", label: "Tarefa (a fazer)", subjects: ["Contatar cliente", "Enviar proposta", "Fazer follow-up", "Revisar contrato"] },
  { kind: "call", label: "Ligação", subjects: ["Ligação de qualificação", "Retorno ao cliente", "Lembrar sobre a fatura"] },
  { kind: "meeting", label: "Reunião", subjects: ["Reunião de apresentação", "Call de alinhamento", "Demo do produto"] },
  { kind: "email", label: "E-mail", subjects: ["Envio de proposta", "Follow-up por e-mail"] },
  { kind: "whatsapp", label: "WhatsApp", subjects: ["Conversa no WhatsApp", "Envio de material"] },
];

function buildActivities(deals: BitrixDeal[]): ActivityStats {
  const items: ActivityItem[] = [];
  const byTypeCount = new Map<string, { label: string; count: number }>();
  const byUserCount = new Map<string, number>();
  let pending = 0;
  let overdue = 0;
  let done = 0;

  // Concluídas — espalhadas nos últimos 60 dias
  for (let i = 0; i < 64; i++) {
    const k = pick(ACTIVITY_KINDS);
    const deal = pick(deals);
    const rep = pick(REPS);
    const at = daysAgo(Math.floor(Math.pow(rng(), 1.4) * 60));
    done += 1;
    const cur = byTypeCount.get(k.kind) || { label: k.label, count: 0 };
    cur.count += 1;
    byTypeCount.set(k.kind, cur);
    byUserCount.set(rep, (byUserCount.get(rep) || 0) + 1);
    items.push({
      id: `act-done-${i}`,
      kind: k.kind,
      label: k.label,
      subject: pick(k.subjects),
      dealId: deal.id,
      dealTitle: deal.title,
      responsibleName: rep,
      at,
      status: "done",
      direction: k.kind === "call" ? (rng() < 0.5 ? "1" : "2") : "0",
    });
  }

  // Pendentes (prazo futuro) e atrasadas (prazo vencido)
  for (let i = 0; i < 18; i++) {
    const k = pick(ACTIVITY_KINDS);
    const deal = pick(deals);
    const rep = pick(REPS);
    const isOverdue = rng() < 0.35;
    const at = isOverdue ? daysAgo(intBetween(1, 20)) : daysAgo(-intBetween(1, 25));
    if (isOverdue) overdue += 1;
    else pending += 1;
    items.push({
      id: `act-open-${i}`,
      kind: k.kind,
      label: k.label,
      subject: pick(k.subjects),
      dealId: deal.id,
      dealTitle: deal.title,
      responsibleName: rep,
      at,
      status: isOverdue ? "overdue" : "pending",
      direction: "0",
    });
  }

  return {
    total: done,
    pending,
    overdue,
    byType: Array.from(byTypeCount.entries())
      .map(([type, v]) => ({ type, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count),
    byUser: Array.from(byUserCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    items,
    updatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ *
 * API pública do mock
 * ------------------------------------------------------------------ */
export interface DashboardData {
  deals: BitrixDeal[];
  events: ComercialEvent[];
  stages: BitrixStage[];
  stageStats: StageStat[];
  activityStats: ActivityStats;
}

const DEALS = buildDeals();
const DATA: DashboardData = {
  deals: DEALS,
  events: buildEvents(DEALS),
  stages: MOCK_STAGES,
  stageStats: MOCK_STAGE_STATS,
  activityStats: buildActivities(DEALS),
};

/**
 * Ponto único de troca. Hoje devolve os dados simulados;
 * troque o corpo por um `fetch("/sua-api")` para usar dados reais.
 */
export async function getDashboardData(): Promise<DashboardData> {
  // pequena latência para simular rede
  await new Promise((r) => setTimeout(r, 120));
  return DATA;
}
