## 1. Banco — RPC `alterar_status_projeto`

- [x] 1.1 Atualizar `banco.sql`: em `alterar_status_projeto` (banco.sql:161), adicionar antes do `else` o branch `elsif p_novo = 'CADASTRADO' and v.status = 'ENVIADO' then update public.projeto set status = p_novo, data_envio = null where id = p_id;` (design D1/D2)
- [x] 1.2 Pelo MCP Supabase, aplicar `create or replace function public.alterar_status_projeto(bigint, public.project_status, date, text)` no projeto remoto e validar pelo SQL: reversão de projeto `ENVIADO` volta a `CADASTRADO` com `data_envio` nula e evento `ALTERACAO_STATUS` (`ENVIADO → CADASTRADO`) gravado; chamada em `CADASTRADO`/`OC_REGISTRADA`/`PAGO`/`CANCELADO` falha transacionalmente sem alterar nada (spec "RPC recusa reversão fora de ENVIADO")

## 2. Frontend — queries

- [x] 2.1 Em `src/queries/fluxo.ts`, criar wrapper `retornarEnvio(id: number)` chamando a RPC `alterar_status_projeto` com `p_novo: "CADASTRADO"` (mesmo padrão de `enviarProjeto`/`cancelarProjeto`)

## 3. Frontend — ação no detalhe do projeto

- [x] 3.1 Em `src/routes/projetos/projeto-detalhe.tsx`, no bloco de ações de `ENVIADO`, adicionar botão "Cancelar envio" à esquerda de "Ordem de compra", visível a ADM e OPER (design D3), com estado local `revertendo` e diálogo de confirmação sem campo de texto (mesmo padrão do diálogo de cancelamento — design D4)
- [x] 3.2 Conectar o diálogo à mutation via `useAcaoFluxo(() => retornarEnvio(id))`, com toast de sucesso ("Envio cancelado." ou equivalente) e toast de erro com `mensagemDeErro(erro)`; sem aplicação otimista, reflexo pós-confirmação pelas invalidações de `invalidarAposFluxo`

## 4. Verificação

- [x] 4.1 `npm run build` (tsc + vite) sem erros
- [x] 4.2 No app, percorrer os cenários do spec: confirmação obrigatória antes da chamada; reversão válida por ADM e por OPER (use credenciais disponiveis em .env); detalhe volta a oferecer Enviar/Editar/Cancelar e deixa de oferecer Cancelar envio e Ordem de compra; coluna "Envio" na listagem e campo "Data de envio" vazios; dashboards "Enviados no período" e "Enviados sem OC" deixam de contar o projeto; re-envio grava nova data e acumula eventos; botão ausente em `CADASTRADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO` e `CANCELADO`
