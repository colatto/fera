# Proposal

## Why

Hoje o único retrocesso possível no fluxo de projetos é "Cancelar envio" (`ENVIADO → CADASTRADO`). Quando a ordem de compra é vinculada errada — número incorreto ou centro de custo errado — não há como desfazer: o projeto fica preso em `OC_REGISTRADA` e o centro de custo, imutável por especificação, ocupa a unicidade global sem poder ser corrigido. A correção do vínculo exige retroceder um passo e refazer a etapa.

## What Changes

- Nova ação de retrocesso `OC_REGISTRADA → ENVIADO`, exclusiva de ADM, um passo, sem motivo, desvinculando a ordem de compra (`ordem_compra_id = null`) e liberando o centro de custo (`centro_custo = null`) na mesma transação. O registro da OC permanece no sistema, reaproveitável pelo modo "Vincular existente".
- A partir de `AUTORIZADO_FATURAMENTO` (inclusive) nenhum retrocesso é possível: `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` e `PAGO` não oferecem ação de retrocesso.
- A edição das informações de cada etapa continua pela reentrada na etapa após o retrocesso: voltou para `ENVIADO`, o ADM refaz o vínculo pelo diálogo "Ordem de compra" existente; voltou para `CADASTRADO`, valem as ações "Editar" e "Enviar" existentes. Nenhum formulário novo.
- A cláusula de imutabilidade do centro de custo muda: de "nenhuma operação do fluxo altera ou remove" para "imutável dentro do vínculo vigente; o retrocimento de OC desvincula e libera o centro para outros projetos".
- Ação "Cancelar envio" (`ENVIADO → CADASTRADO`, ADM+OPER, sem motivo) permanece inalterada.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: novo requisito de reversão de OC (`OC_REGISTRADA → ENVIADO`) com desvínculo de OC e liberação do centro de custo; ajuste do requisito "Vínculo de ordem de compra aplica o centro de custo do projeto" para permitir a liberação do centro pelo retrocesso.

## Impact

- **Banco (via MCP Supabase, `banco.sql` como referência declarativa)**: a RPC `alterar_status_projeto` ganha a transição `OC_REGISTRADA → ENVIADO` com desvínculo da OC e limpeza do centro de custo; recusas transacionais para demais origens e para não-ADM.
- **Interface**: `projeto-detalhe.tsx` ganha botão de retrocesso de OC (ADM, apenas em `OC_REGISTRADA`) com diálogo de confirmação; `fluxo.ts` ganha a função de chamada da RPC.
- **Dashboards**: nenhuma mudança estrutural — o projeto desvinculado volta a contar em "Enviados sem OC" pela invalidação existente.
- **Sem impacto**: criação, numeração, cancelamento, autorização, nota fiscal, recebimentos e lote seguem inalterados.
