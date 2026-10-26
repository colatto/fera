# Proposal

## Why

A change anterior abriu o retrocesso até `OC_REGISTRADA → ENVIADO`, mas manteve `AUTORIZADO_FATURAMENTO` como ponto sem volta. Quando o ADM autoriza o faturamento por engano — vínculo de OC errado que só é percebido depois, ou autorização prematura — não há como desfazer antes de emitir a nota: o projeto fica preso em `AUTORIZADO_FATURAMENTO` e a correção exigiria emitir uma nota incorreta ou intervenção manual no banco.

## What Changes

- Nova ação de retrocesso `AUTORIZADO_FATURAMENTO → OC_REGISTRADA`, exclusiva de ADM, um passo, sem motivo, apagando o registro correspondente em `autorizacao_faturamento` na mesma transação. A OC vinculada, o centro de custo, `data_envio` e o valor do projeto permanecem intactos.
- A exclusão do registro é o que viabiliza a re-autorização futura — a tabela tem `projeto_id` único — sem alterar a RPC `autorizar_faturamento`, que permanece intocada.
- A partir de `NOTA_EMITIDA` (inclusive) nenhum retrocesso continua possível: `NOTA_EMITIDA` e `PAGO` não oferecem ação de retrocesso. O cenário "Nenhum retrocesso a partir da autorização" da spec passa a valer a partir da nota emitida.
- A linha do tempo acumula o evento `AUTORIZADO_FATURAMENTO → OC_REGISTRADA`; o item "Autorização de faturamento" da linha do tempo de documentos desaparece junto com o registro apagado e volta a constar, com a nova data, na re-autorização.
- Ações existentes ("Autorizar faturamento", "Registrar nota fiscal", "Cancelar vínculo de OC", "Cancelar envio") permanecem inalteradas; nenhum formulário novo.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: novo requisito de reversão da autorização de faturamento (`AUTORIZADO_FATURAMENTO → OC_REGISTRADA`) com gate ADM e apagamento do registro em `autorizacao_faturamento`; ajuste do cenário "Nenhum retrocesso a partir da autorização" (requisito "Reversão de OC para enviado") para restringir a proibição a `NOTA_EMITIDA` e `PAGO`.

## Impact

- **Banco (via MCP Supabase, `banco.sql` como referência declarativa)**: a RPC `alterar_status_projeto` ganha a transição `AUTORIZADO_FATURAMENTO → OC_REGISTRADA` com gate ADM, exclusão do registro em `autorizacao_faturamento` e update de status na mesma transação; recusas transacionais para demais origens e para não-ADM. `autorizar_faturamento` permanece inalterada.
- **Interface**: `projeto-detalhe.tsx` ganha botão e diálogo de confirmação de reversão da autorização (ADM, apenas em `AUTORIZADO_FATURAMENTO`, à esquerda de "Registrar nota fiscal"); `fluxo.ts` ganha a função de chamada da RPC.
- **Dashboards**: nenhuma mudança estrutural — o financeiro não é afetado (não existe nota fiscal em `AUTORIZADO_FATURAMENTO`) e o operacional reflete a transição pelos eventos de status existentes.
- **Sem impacto**: vínculo e desvínculo de OC, centro de custo, emissão de nota, recebimentos, lote e cancelamento seguem inalterados.
