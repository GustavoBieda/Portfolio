# Dashboard Comercial

Dashboard de performance do time comercial, **100% autocontido e com dados simulados**.
Não depende de Bitrix24, banco de dados, API externa ou variáveis de ambiente.

## Rodando

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

## O que tem dentro

| Bloco | Descrição |
|---|---|
| **KPIs** | Leads criados, pipeline em aberto, ganhas, taxa de conversão e ticket médio — com **comparativo período-a-período** (▲/▼ %), valor do período anterior e **sparkline** de tendência |
| **Filtro de período** | Hoje · Semana (dom→sáb) · Mês · Total · **Personalizado** (date range picker próprio, com calendário estilizado) |
| **Funil de Vendas** | Funil desenhado (trapézios) com quantidade por etapa, **conversão entre etapas** e **tempo médio por etapa** |
| **Distribuição por etapa** | Barras com todas as etapas |
| **Atividade em tempo real** | Feed das últimas movimentações |
| **Negociações paradas (aging)** | Lista do que está estagnado, com filtro +7/+14/+30 dias |
| **Desempenho por colaborador** | Gráfico + tabela (negociações, ganhas, conversão, valor) |
| **Desempenho por origem** | Volume, ganhas, conversão e valor por canal de entrada |
| **Tarefas & Atividades** | 3 visualizações: **Resumo**, **Calendário** e **Lista**, com status concluída/pendente/atrasada |
| **Logs** | Tabela completa de negociações com busca, ordenação e paginação |

## Estrutura

```
src/
├── app/
│   ├── globals.css              # design system (tokens, glass, gradientes)
│   ├── layout.tsx
│   └── page.tsx                 # monta o dashboard
├── components/comercial/
│   ├── comercial-dashboard.tsx  # componente raiz (KPIs, filtros, orquestra tudo)
│   ├── sales-funnel.tsx         # funil desenhado + conversão + tempo por etapa
│   ├── aging-table.tsx          # negociações paradas
│   ├── source-performance.tsx   # desempenho por origem
│   ├── activities-section.tsx   # tarefas (resumo / calendário / lista)
│   ├── activity-calendar.tsx    # calendário de tarefas
│   ├── deals-table.tsx          # logs de negociações
│   └── date-range-picker.tsx    # seletor de período personalizado
├── lib/
│   └── mock-data.ts             # 👈 gerador dos dados simulados
└── types/
    └── comercial.ts             # tipos compartilhados
```

## Trocando os dados simulados por dados reais

Tudo passa por **um único ponto**. Em `src/lib/mock-data.ts`:

```ts
export async function getDashboardData(): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 120));
  return DATA;
}
```

Troque o corpo pela sua fonte de dados, mantendo o formato:

```ts
export async function getDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/seu-endpoint", { cache: "no-store" });
  return res.json(); // { deals, events, stages, stageStats, activityStats }
}
```

Os tipos de cada campo estão em `src/types/comercial.ts`.

### Ajustando as etapas do funil

As 6 etapas do funil desenhado ficam no topo de `src/components/comercial/sales-funnel.tsx`:

```ts
const FUNNEL_STAGES = [
  { id: "NEW", label: "Lead" },
  { id: "PREPARATION", label: "Assumir Conversa" },
  // ...
];
```

O `id` precisa casar com o `stageId` das negociações.

## Notas

- O dashboard faz **polling a cada 8s** (`comercial-dashboard.tsx`) para simular tempo real.
- O funil conta, em cada etapa, as negociações que **alcançaram aquela etapa ou avançaram além** — é o que torna a conversão entre etapas coerente.
- Stack: Next.js (App Router) + React + TypeScript + Tailwind v4 + Recharts + lucide-react.
