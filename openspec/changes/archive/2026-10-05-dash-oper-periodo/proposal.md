# Proposal

## Why

No dashboard operacional, ao selecionar um período, apenas o card "Enviados no período" reage às datas: a distribuição por status (card + gráficos de barra e pizza) e "Enviados sem OC" permanecem constantes. A RPC `dashboard_operacional` calcula essas duas métricas sem aplicar o filtro de período, contradizendo os cenários "Período com dados" e "Período sem dados" da spec `painel-dashboards`, que exigem os valores "para o período informado" e zerados em período sem atividade.

## What Changes

- Reescrever a distribuição por status da RPC `dashboard_operacional` com semântica de **fluxo do período**: contagem de entradas em cada status a partir de `evento_projeto`, em vez do estoque atual de projetos.
  - Eventos `ALTERACAO_STATUS` contam por `status_novo` no período.
  - Eventos `CRIACAO` contam como entrada em `CADASTRADO` no período.
  - `CANCELADO` permanece fora da distribuição (entradas em CANCELADO não aparecem nos gráficos).
  - Um projeto que mudou de status mais de uma vez no período conta em cada status por onde passou (fluxo, não estoque).
- Aplicar o filtro de período (`p.data_envio between p_data_inicial and p_data_final`) à métrica `enviados_sem_oc`, que hoje ignora as datas.
- `enviados_no_periodo` permanece como está (já é filtrada pelo período).
- Atualizar os rótulos da tela de linguagem de estoque para linguagem de fluxo ("Projetos ativos por status" → movimentação do período; descrições dos gráficos; zero-state da pizza).
- Atualizar a spec `painel-dashboards` para definir explicitamente a semântica de fluxo da distribuição por período.
- Implantar a função alterada no projeto remoto do Supabase via MCP Supabase e atualizar a referência declarativa `banco.sql`.
- A assinatura da RPC (`dashboard_operacional(date, date)` e colunas de retorno) não muda; não há mudança breaking na API.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova. -->

### Modified Capabilities

- `painel-dashboards`: o requisito "Dashboard operacional por período" passa a definir a distribuição por status como movimentação do período (entradas por status via `evento_projeto`, criação conta como entrada em CADASTRADO, cancelados excluídos) e as métricas "enviados no período" e "enviados sem OC" como escopadas por `data_envio`.

## Impact

- **Banco (Supabase remoto)**: `create or replace function public.dashboard_operacional(date, date)` aplicado exclusivamente via MCP Supabase; `banco.sql` atualizado como referência versionada.
- **Frontend**: `src/routes/dashboards/dashboard-operacional.tsx` (rótulos e textos de estado zero). `src/queries/dashboards.ts` não precisa de alteração — a forma da resposta e a chave de consulta por período permanecem.
- **Consultas existentes**: nenhum outro consumidor da RPC; a view `v_dashboard_operacional` (estoque atual) não faz parte deste change.
- **Limitação aceita**: a fronteira de dia dos eventos resolve no fuso do banco (UTC), pois `evento_projeto.realizado_em` é `timestamptz`; desvio máximo de ±3h na borda do período para o fuso de Brasília, documentada no design.
