# Tasks

## 1. Banco — RPC `alterar_status_projeto` (somente via MCP Supabase)

- [x] 1.1 Aplicar pelo MCP Supabase o novo corpo de `alterar_status_projeto` com os ramos do design D1 (reversão `OC_REGISTRADA → ENVIADO` com gate ADM e desvínculo de OC/centro; recusa específica para alvo `ENVIADO` de outra origem) e validar com `execute_sql`: após chamada de ADM em projeto `OC_REGISTRADA`, o projeto fica `ENVIADO` com `ordem_compra_id` e `centro_custo` nulos, `data_envio` preservada e evento `OC_REGISTRADA → ENVIADO` gravado; re-vincular a OC ao final para restaurar o estado anterior
- [x] 1.2 Validar as recusas no remoto: chamada de OPER recebe erro transacional de permissão, chamada com alvo `ENVIADO` de status fora de `OC_REGISTRADA`/`CADASTRADO` recebe a mensagem específica, e envio (`CADASTRADO → ENVIADO`) e reversão de envio (`ENVIADO → CADASTRADO`) seguem funcionando como hoje
- [x] 1.3 Atualizar `banco.sql` com o mesmo corpo da função implantada (referência declarativa) e conferir que o texto do arquivo corresponde à definição vigente no remoto

## 2. Interface — ação "Cancelar vínculo de OC"

- [x] 2.1 Adicionar `retrocederOc` em `src/queries/fluxo.ts` chamando `alterar_status_projeto` com `p_novo: "ENVIADO"` no padrão de `retornarEnvio`, e verificar que `npm run build` passa
- [x] 2.2 Criar o diálogo de confirmação e o botão "Cancelar vínculo de OC" em `src/routes/projetos/projeto-detalhe.tsx` (visível somente para ADM em `OC_REGISTRADA`, à esquerda de "Autorizar faturamento", descrição informando desvínculo da OC, liberação do centro e preservação da data de envio, erro do banco exibido por `mensagemDeErro`), e verificar que `npm run build` passa
- [x] 2.3 Verificar na interface (browser) o gating da ação: botão oculto para OPER e para todo status diferente de `OC_REGISTRADA` (inclusive `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` e `PAGO`), e demais ações de cada status preservadas

## 3. Integração — reversão e re-vinculação ponta a ponta

- [x] 3.1 Percorrer no remoto com a interface publicada: vincular OC com centro → "Cancelar vínculo de OC" → detalhe/listagem/dashboards refletem `ENVIADO` sem OC (contando em "Enviados sem OC") com data de envio mantida → re-vincular a mesma OC com outro centro por "Vincular existente" → linha do tempo acumula as transições e o centro liberado fica reutilizável por outro projeto
