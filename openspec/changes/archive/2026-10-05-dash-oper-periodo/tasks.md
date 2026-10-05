# Tasks

## 1. Banco remoto (MCP Supabase)

- [x] 1.1 Via MCP Supabase, aplicar `create or replace function public.dashboard_operacional(date, date)` conforme o esqueleto do design.md (CTE `entradas` com `CRIACAO`→`CADASTRADO` e `ALTERACAO_STATUS` por `realizado_em::date`, excluindo `CANCELADO`; `data_envio between` nos dois `count filter`), mantendo assinatura e colunas de retorno, e confirmar a recriação consultando a definição vigente em `pg_proc`
- [x] 1.2 Validar via MCP em período com movimentação: chamar a RPC e conferir `projetos_por_status`, `enviados_no_periodo` e `enviados_sem_oc` contra consultas diretas equivalentes (`evento_projeto` agrupado por status de entrada; `projeto` filtrado por `data_envio`), exigindo contagens iguais
- [x] 1.3 Validar via MCP os casos de borda: período sem atividade retorna distribuição zerada e contadores 0 sem erro; projeto criado dentro do período aparece como entrada em `CADASTRADO`; cancelamento do período não entra na distribuição

## 2. Referência declarativa

- [x] 2.1 Atualizar o bloco `create or replace function public.dashboard_operacional` em `banco.sql` para ficar idêntico à definição aplicada remotamente, verificando a igualdade entre os dois textos SQL

## 3. Frontend

- [x] 3.1 Em `src/routes/dashboards/dashboard-operacional.tsx`, reescrever os rótulos para linguagem de fluxo conforme design.md: card principal "Mudanças de status no período", descrição das barras "Entradas por status no período, excluindo cancelamentos.", descrição da pizza "Participação de cada status na movimentação do período.", zero-state "Nenhuma movimentação no período — valores zerados." e subtítulo da página "Movimentação por status e envios no período selecionado."; verificar com `npm run build` sem erros de tipo
- [x] 3.2 Validar a tela com dois períodos distintos (um com movimentação, um vazio): card principal, gráficos e "Enviados sem OC" mudam conforme o período e zeram no período vazio, e o tooltip das barras e da pizza continua exibindo a legenda na cor do status

## 4. Verificação final

- [x] 4.1 Rodar `openspec validate dash-oper-periodo` e corrigir qualquer apontamento até validação limpa
