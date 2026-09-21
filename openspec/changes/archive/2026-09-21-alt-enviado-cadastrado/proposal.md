## Why

Um projeto enviado por engano fica sem saída no fluxo: hoje a única transição manual a partir de `ENVIADO` é o vínculo de OC (que avança o fluxo), e não há como retornar a `CADASTRADO`. Como a edição de identificadores e o cancelamento só existem em `CADASTRADO`, qualquer correção cadastral em projeto já enviado fica impossível — o usuário não tem como desfazer o envio.

## What Changes

- Nova transição manual no fluxo: `ENVIADO → CADASTRADO`, pela RPC existente `alterar_status_projeto`, disponível para ADM e OPER (mesma permissão do envio), sem motivo obrigatório.
- A reversão limpa `data_envio`, para que o projeto revertido não siga contando nos indicadores "Enviados no período" e "Enviados sem OC" do dashboard operacional; um re-envio posterior grava a data nova.
- Nova ação "Cancelar envio" no detalhe do projeto, apenas em status `ENVIADO`, com diálogo de confirmação, posicionada à esquerda do botão "Ordem de compra"; em qualquer outro status a ação não é oferecida.
- A RPC recusa transacionalmente a reversão a partir de qualquer outro status (`CADASTRADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO`, `CANCELADO`).
- A transição continua registrando o evento `ALTERACAO_STATUS` (`ENVIADO → CADASTRADO`) na linha do tempo, mecanismo existente, sem motivo.
- Escopo restrito a `ENVIADO → CADASTRADO`: nenhuma outra transição de retorno é criada (a partir de `OC_REGISTRADA` o projeto já tem OC e centro de custo gravados).

## Capabilities

### New Capabilities

### Modified Capabilities

- `fluxo-projetos`: novo requisito de reversão de envio — ação "Cancelar envio" em `ENVIADO` para ADM e OPER com confirmação, RPC `alterar_status_projeto` aceitando `ENVIADO → CADASTRADO` com limpeza de `data_envio` e recusa fora de `ENVIADO`, evento na linha do tempo, reflexo imediato em listagem, detalhe e dashboards.

## Impact

- Banco (`banco.sql` como referência declarativa + aplicação pelo MCP Supabase): novo `elsif` em `public.alterar_status_projeto` (limpa `status` e `data_envio`); sem alteração de assinatura, de grants ou de outras RPCs.
- Frontend: `src/queries/fluxo.ts` (novo wrapper `retornarEnvio`), `src/routes/projetos/projeto-detalhe.tsx` (novo botão com confirmação no bloco de ações de `ENVIADO`).
- Indireto: `dashboard_operacional` e views que exibem `data_envio` (listagem, detalhe) passam a refletir o projeto revertido como sem data de envio — comportamento desejado, sem alteração de código.
- Tipos: nenhuma alteração (a assinatura da RPC não muda; `database.types.ts` permanece válido).
