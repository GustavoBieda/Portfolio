// Tipos do módulo Comercial (integração Bitrix24 — base: Negociações/Deals)

export type DealSemantic = "open" | "won" | "lost";

/** Uma negociação (deal) sincronizada do Bitrix24. */
export interface BitrixDeal {
  id: string;
  title: string;
  stageId: string;
  stageName: string;
  semantic: DealSemantic;
  categoryId: string;
  value: number;
  currency: string;
  assignedById: string;
  assignedName: string;
  createdAt: string; // ISO (DATE_CREATE)
  updatedAt: string; // ISO (DATE_MODIFY)
  closeDate: string; // ISO (CLOSEDATE)
  closed: boolean;
  source: string; // SOURCE_ID bruto
  sourceLabel: string; // rótulo legível da origem
  enteredStageAt: string; // ISO — quando entrou na etapa atual
  fetchedAt: string; // quando o Hub armazenou
}

/** Tempo médio que as negociações levam em cada etapa. */
export interface StageStat {
  stageId: string;
  avgDays: number; // média de dias para sair da etapa
  samples: number; // quantas transições mediram isso
}

export type ActivityStatus = "done" | "pending" | "overdue";

/** Uma atividade/tarefa individual. */
export interface ActivityItem {
  id: string;
  kind: string; // call, todo, meeting...
  label: string;
  subject: string;
  dealId: string;
  dealTitle: string;
  responsibleName: string;
  at: string; // ISO — data de referência (conclusão ou prazo)
  status: ActivityStatus;
  direction: string; // "1" recebida, "2" feita, "0" n/a
}

/** Resumo de atividades/tarefas do time. */
export interface ActivityStats {
  total: number; // concluídas
  pending: number; // pendentes (prazo futuro)
  overdue: number; // atrasadas (prazo vencido)
  byType: { type: string; label: string; count: number }[];
  byUser: { name: string; count: number }[];
  items: ActivityItem[];
  updatedAt: string;
}

/** Entrada do feed de atividade em tempo real. */
export interface ComercialEvent {
  id: string;
  type: string; // ex.: ONCRMDEALADD, ONCRMDEALUPDATE, ONCRMDEALDELETE
  action: "created" | "updated" | "deleted" | "unknown";
  dealId: string;
  dealTitle: string;
  stageName: string;
  semantic: DealSemantic | "";
  assignedName: string;
  value: number;
  at: string; // ISO
}

/** Metadados de uma etapa do funil (cache). */
export interface BitrixStage {
  statusId: string;
  name: string;
  semantic: DealSemantic;
  sort: number;
  categoryId: string;
}

/** Rótulos legíveis para as origens de lead mais comuns. */
export const SOURCE_LABELS: Record<string, string> = {
  CALL: "Ligação",
  EMAIL: "E-mail",
  WEB: "Site/Web",
  WEBFORM: "Formulário web",
  CALLBACK: "Retorno de ligação",
  RC_GENERATOR: "Gerador de vendas",
  STORE: "Loja online",
  PARTNER: "Parceiro",
  ADVERTISING: "Anúncio",
  RECOMMENDATION: "Indicação",
  OTHER: "Outro",
  "": "Sem origem",
};

export function sourceLabelFor(id: string): string {
  return SOURCE_LABELS[id] ?? (id || "Sem origem");
}
