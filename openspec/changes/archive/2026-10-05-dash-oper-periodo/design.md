# Design

## Context

A RPC `public.dashboard_operacional(p_data_inicial date, p_data_final date)` (referência em `banco.sql:298-312`) retorna `projetos_por_status jsonb`, `enviados_no_periodo bigint` e `enviados_sem_oc bigint`. Hoje apenas `enviados_no_periodo` aplica o período; a distribuição conta o estoque atual de projetos não cancelados e `enviados_sem_oc` ignora as datas (diagnóstico no proposal). O frontend (`src/routes/dashboards/dashboard-operacional.tsx`) já refaz a consulta por período via chave do React Query e deriva tudo da resposta; `src/queries/dashboards.ts` só desempacota as três colunas.

O histórico necessário já existe: `evento_projeto` (imutável, com `tipo`, `status_novo`, `realizado_em timestamptz`) registra `CRIACAO` na criação do projeto e `ALTERACAO_STATUS` com `status_anterior`/`status_novo` em cada transição. Implantação de banco é exclusivamente via MCP Supabase no projeto remoto; `banco.sql` é referência declarativa versionada.

## Goals / Non-Goals

**Goals:**
- As três métricas da RPC honrarem o período informado (requisito modificado no delta de `painel-dashboards`).
- Distribuição por status como fluxo: entradas por status a partir de `evento_projeto`.
- Rótulos da tela coerentes com a semântica de fluxo.

**Non-Goals:**
- Não alterar `v_dashboard_operacional` (retrato de estoque) nem o dashboard financeiro.
- Não adicionar parâmetro de fuso/offset à RPC.
- Não criar índice novo (volume de eventos é pequeno; índice atual `evento_linha_tempo_idx` é por projeto).
- Não alterar a forma da resposta nem o desempacotamento em `queries/dashboards.ts`.

## Decisions

1. **Distribuição como fluxo via `evento_projeto`, não estoque.** Alternativas consideradas: estoque filtrado por criação no período (ignora movimentação de projetos antigos), snapshot na data final (consulta complexa com último evento por projeto) e manter estoque atual mudando a spec (deixa "Período sem dados" sem sentido). Fluxo é o que um painel operacional por período promete e casa com `enviados_no_periodo`, que já é fluxo.

2. **`CRIACAO` conta como entrada em `CADASTRADO`.** Sem isso, projeto criado e ainda não enviado no período sumiria da distribuição, e "Período sem dados" deixaria de refletir cadastros novos. Como todo projeto nasce `CADASTRADO` (default da coluna) e o evento `CRIACAO` é gravado na criação, o mapeamento é direto.

3. **`CANCELADO` continua fora da distribuição.** Mantém consistência com a spec e a tela atuais, sem nova cor no mapa `CORES_GRAFICO`. Reversões para `CADASTRADO` (ENVIADO→CADASTRADO) contam como entrada, pois são movimentação real.

4. **Forma da consulta**: `create or replace function` com mesma assinatura e mesmas colunas de retorno (sem breaking; grants existentes persistem). Esqueleto:

```sql
return query
with entradas as (
  select 'CADASTRADO'::public.project_status as status
  from public.evento_projeto
  where tipo = 'CRIACAO' and realizado_em::date between p_data_inicial and p_data_final
  union all
  select status_novo
  from public.evento_projeto
  where tipo = 'ALTERACAO_STATUS' and realizado_em::date between p_data_inicial and p_data_final
)
select
  coalesce((select jsonb_object_agg(status::text, quantidade) from (
    select status, count(*)::bigint quantidade
    from entradas where status <> 'CANCELADO' group by status
  ) por_status), '{}'::jsonb),
  count(*) filter (where p.data_envio between p_data_inicial and p_data_final)::bigint,
  count(*) filter (where p.data_envio between p_data_inicial and p_data_final
                     and p.ordem_compra_id is null and p.status <> 'CANCELADO')::bigint
from public.projeto p;
```

O agregado de status sai da subconsulta atual e passa a ler `entradas`; os dois `count filter` mantêm um único scan de `projeto`, com a condição de data acrescida ao filtro de `enviados_sem_oc`.

5. **Fronteira de dia dos eventos em UTC.** `realizado_em::date` resolve no fuso da sessão do banco (UTC no Supabase): evento às 22h de Brasília conta no dia seguinte. Desvio máximo de ±3h na borda do período, aceito pragmaticamente. Alternativa descartada: receber fuso do cliente na RPC — amplia a API por uma precisão que a spec não exige (ela exige fuso local apenas nos defaults do seletor, no cliente). `data_envio` é `date` puro e não sofre desse desvio.

6. **Rótulos no frontend, sem mudança de consulta.** Em `dashboard-operacional.tsx`: card "Projetos ativos por status" → "Mudanças de status no período" (o total passa a ser entradas do período); descrição das barras → "Entradas por status no período, excluindo cancelamentos."; descrição da pizza → "Participação de cada status na movimentação do período."; zero-state da pizza → "Nenhuma movimentação no período — valores zerados."; subtítulo da página ajustado para "Movimentação por status e envios no período selecionado.". `montarDistribuicao` permanece: completa status zerados conforme `ROTULOS_STATUS` sem `CANCELADO`, o que satisfaz o cenário de período sem dados.

## Risks / Trade-offs

- [Contagem dupla: projeto conta em vários status no mesmo período] → Inerente à semântica de fluxo; rótulos explicitam "mudanças/entradas", não projetos.
- [Divergência entre `banco.sql` e banco remoto] → Aplicar via MCP Supabase e em seguida atualizar `banco.sql`; validar com chamadas de teste da RPC (período com dados e vazio).
- [Usuário acostumado ao estoque estranha a nova leitura] → Textos da tela definem a métrica como movimentação do período; zero-state orienta.
- [Borda UTC desloca eventos de fim de noite] → Documentado como limitação aceita; revisável se a operação exigir precisão local.

## Migration Plan

1. Aplicar `create or replace function public.dashboard_operacional(date, date)` no projeto remoto via MCP Supabase (mesma assinatura; `grant execute` vigente permanece válido).
2. Validar com chamadas da RPC: período com movimentação, período vazio (retorna distribuição zerada) e comparar `enviados_no_periodo` com contagem direta.
3. Atualizar o bloco da função em `banco.sql` para refletir o estado remoto.
4. Ajustar rótulos no frontend e validar a tela nos dois cenários de período.
5. Rollback: reaplicar a versão anterior da função (histórico do `banco.sql` no git); sem mudança de schema nem de dados, o rollback é só a função.

## Open Questions

Nenhuma.
