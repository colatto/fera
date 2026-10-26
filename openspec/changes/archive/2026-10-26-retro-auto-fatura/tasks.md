# Tasks

## 1. Banco — RPC `alterar_status_projeto` (somente via MCP Supabase)

- [x] 1.1 Aplicar pelo MCP Supabase o novo corpo de `alterar_status_projeto` com os ramos do design D1 (reversão `AUTORIZADO_FATURAMENTO → OC_REGISTRADA` com gate ADM, `delete` do registro em `autorizacao_faturamento` e update de status na mesma transação; recusa específica para destino `OC_REGISTRADA` de outra origem) e validar com `execute_sql`: após chamada de ADM em projeto `AUTORIZADO_FATURAMENTO`, o projeto fica `OC_REGISTRADA` sem registro em `autorizacao_faturamento`, com OC, centro de custo e `data_envio` preservados e evento `AUTORIZADO_FATURAMENTO → OC_REGISTRADA` gravado; re-autorizar ao final para restaurar o estado anterior
- [x] 1.2 Validar as recusas no remoto: chamada de OPER recebe erro transacional de permissão, chamada com destino `OC_REGISTRADA` a partir de status diferente de `AUTORIZADO_FATURAMENTO` recebe a mensagem específica, e envio, reversão de envio e reversão de OC seguem funcionando como hoje
- [x] 1.3 Atualizar `banco.sql` com o mesmo corpo da função implantada (referência declarativa) e conferir que o texto do arquivo corresponde à definição vigente no remoto

## 2. Interface — ação "Cancelar autorização de faturamento"

- [x] 2.1 Adicionar `retrocederAutorizacao` em `src/queries/fluxo.ts` chamando `alterar_status_projeto` com `p_novo: "OC_REGISTRADA"` no padrão de `retrocederOc`, e verificar que `npm run build` passa
- [x] 2.2 Criar o diálogo de confirmação e o botão "Cancelar autorização de faturamento" em `src/routes/projetos/projeto-detalhe.tsx` (visível somente para ADM em `AUTORIZADO_FATURAMENTO`, à esquerda de "Registrar nota fiscal", descrição informando que o status volta a `OC_REGISTRADA` mantendo OC e centro de custo, erro do banco exibido por `mensagemDeErro`), e verificar que `npm run build` passa
- [x] 2.3 Verificar na interface (browser) o gating da ação: botão oculto para OPER e para todo status diferente de `AUTORIZADO_FATURAMENTO` (inclusive `NOTA_EMITIDA` e `PAGO`), e demais ações de cada status preservadas

## 3. Integração — reversão e re-autorização ponta a ponta

- [x] 3.1 Percorrer no remoto com a interface publicada: autorizar faturamento → "Cancelar autorização de faturamento" → detalhe/listagem/dashboards refletem `OC_REGISTRADA` sem exibição de autorização (item "Autorização de faturamento" fora da linha do tempo de documentos) com OC, centro de custo e data de envio mantidos → re-autorizar → nova autorização com autor e data novos, linha do tempo acumulando as transições e o dashboard financeiro inalterado
