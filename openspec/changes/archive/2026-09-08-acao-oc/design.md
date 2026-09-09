## Context

O detalhe do projeto executa as ações de fluxo por RPCs transacionais do banco; o padrão consolidado é o hook `useAcaoFluxo` (`src/queries/fluxo.ts`), que invalida o cache do React Query (`invalidarAposFluxo`) somente após o sucesso da RPC — sem aplicação otimista. Dois diálogos em `src/routes/projetos/projeto-detalhe.tsx` fogem do padrão e chamam as funções cruas direto no `submeter()`, com estado local `processando`:

- `DialogOrdemCompra` — modo "Vincular existente" chama `vincularOrdemCompra`; modo "Registrar nova" encadeia `registrarOrdemCompra` → `vincularOrdemCompra`.
- `DialogLote` — chama `confirmarRecebimentosLote`.

Em ambos o cache nunca é invalidado: com `staleTime` de 30s e `refetchOnWindowFocus: false` (`main.tsx`), o status exibido só se atualiza ao recarregar ou reabrir a tela. Ver proposal.md para a motivação e specs/fluxo-projetos para os requisitos.

## Goals / Non-Goals

**Goals:**

- Trazer os dois diálogos de volta ao padrão `useAcaoFluxo`, fazendo o reflexo imediato (status, linha do tempo, dashboards, listas) valer por construção.
- Cobrir a semântica da cadeia de duas RPCs do modo "Registrar nova": sucesso parcial (registro ok, vinculação falha) deixa a OC visível na listagem para nova tentativa.
- Uniformizar o controle de pendência com `mutacao.isPending`, eliminando o estado local `processando`.

**Non-Goals:**

- Não alterar `useAcaoFluxo`/`invalidarAposFluxo` (inclusive sem invalidação global em erro para as demais ações).
- Não alterar RPCs, RLS, views, triggers nem qualquer recurso do Supabase — `banco.sql` permanece intocado.
- Não mexer no layout, textos ou fluxo de navegação dos diálogos.

## Decisions

**D1 — Reusar `useAcaoFluxo` em vez de invalidar manualmente.** A alternativa seria chamar `invalidarAposFluxo` direto no `submeter()` após o sucesso. Rejeitada: duplicaria o contrato que o hook já centraliza (sucesso → invalidação) e criaria dois caminhos para manter. Com o hook, a spec de reflexo imediato vale para qualquer ação futura que o reutilize.

**D2 — Cadeia "registrar → vincular" inteira dentro de um único `mutationFn`.** O `mutationFn` do `DialogOrdemCompra` recebe `{ modo, ocId, numero, data, centro }` e, em modo "nova", executa as duas RPCs em sequência, retornando após a vinculação. A invalidação (via `onSuccess` do hook) dispara uma única vez, só quando ambas sucedem — a tela não reflete estado intermediário. Alternativa considerada: dois `useAcaoFluxo` encadeados; rejeitada porque a invalidação da primeira etapa mostraria o projeto como se a vinculação tivesse ocorrido.

**D3 — Falha da vinculação após registro: invalidar só a chave de OCs no `catch`.** Quando a etapa 2 falha, o `onSuccess` não roda; a OC recém-registrada ficaria invisível no dropdown (cache de `["ordens-compra"]` válido por 30s), contrariando o cenário de spec. No `catch` do `submeter`, quando o registro já havia sucedido, invalidar apenas `["ordens-compra"]` — a listagem se atualiza com a verdade do banco e o erro da vinculação é exibido normalmente. Alternativa: invalidar em erro sempre (para todas as chaves); rejeitada como padrão geral porque a invalidação em erro é mentira inofensiva, porém mais requisições sem necessidade — o caso específico da OC é o único em que o sucesso parcial deixa resíduo visível.

**D4 — Controle de pendência por `mutacao.isPending`.** Remove o `useState` de `processando` dos dois diálogos, alinhando com `DialogCancelar`, `DialogNotaFiscal` e `DialogRecebimento`. Efeito colateral positivo: o botão desabilita durante a RPC, impedindo duplo envio do lote ou dupla vinculação.

## Risks / Trade-offs

- [Registro succeed + vinculação falha deixa OC registrada sem evento de status] → comportamento já previsto pela RPC de vinculação e coberto por cenário de spec; a D3 garante que a OC fica imediatamente re-vinculável pela UI.
- [`mutateAsync` dentro de `try/catch` com invalidação no `catch` pode invalidar em erro de rede também] → aceitável: a refetch é verdadeira e barata; sem mudança de estado exibido.
- [Lote confirma várias notas de projetos distintos; a invalidação é global por família de chaves] → já é o comportamento das demais ações (`invalidarAposFluxo` invalida famílias inteiras); sem regresseço adicional.

## Migration Plan

Mudança exclusivamente de frontend (`projeto-detalhe.tsx`), sem alteração de banco nem de contrato de RPCs. Deploy pelo build usual (Vercel). Rollback = reverter o commit; nenhuma migração de dados envolvida.

## Open Questions

(nenhuma)
