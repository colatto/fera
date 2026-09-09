## Why

Vincular uma ordem de compra (ou registrá-la e vinculá-la em seguida) muda o status do projeto para `OC_REGISTRADA` no banco, mas a tela não reflete a mudança: o diálogo de OC chama as RPCs fora do padrão `useAcaoFluxo` e nunca invalida o cache do React Query. Com `staleTime` de 30s e `refetchOnWindowFocus` desativado, o detalhe do projeto continua exibindo `ENVIADO` até o usuário recarregar a página — violando a spec `fluxo-projetos` (sucesso MUST refletir imediatamente em status, linha do tempo e dashboards). O diálogo de recebimentos em lote tem o mesmo desvio: quando a última parcela quita a nota, a transição para `PAGO` também não aparece sem recarga.

## What Changes

- O diálogo de ordem de compra (`DialogOrdemCompra`) passa a executar a cadeia registrar/vincular dentro do padrão `useAcaoFluxo`, de modo que o sucesso (das duas RPCs, quando em modo "Registrar nova") invalide o cache e a interface reflita imediatamente o novo status, o evento na linha do tempo, os dashboards e a lista de OCs do próprio diálogo.
- O diálogo de recebimentos em lote (`DialogLote`) passa a confirmar o lote pelo mesmo padrão `useAcaoFluxo`, refletindo imediatamente quitação parcial/total — incluindo a transição para `PAGO` quando o lote fecha a nota.
- Nenhuma alteração de banco, RPCs, permissões ou rotas: o comportamento transacional e a UI de erro/sucesso permanecem como estão.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o requisito de ações financeiras exclusivas de ADM passa a explicitar, com cenários, o reflexo imediato da vinculação de OC em ambos os modos (existente e nova) — incluindo o caso de falha na vinculação após registro, em que a OC permanece registrada e disponível para vinculação posterior; o requisito de recebimentos em lote passa a explicitar o reflexo imediato da quitação, incluindo a transição para `PAGO`.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx` — diálogos `DialogOrdemCompra` e `DialogLote` ( rewiring para `useAcaoFluxo`; sem mudança visual ou de fluxo de tela).
- `src/queries/fluxo.ts` — nenhuma mudança esperada; `useAcaoFluxo` e `invalidarAposFluxo` já dão conta do comportamento.
- Banco/Supabase — nenhuma alteração; `banco.sql` permanece como referência, sem modificação.
