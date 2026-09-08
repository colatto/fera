## Context

Hoje `tipo_projeto.proximo_numero` é coluna NOT NULL sem default, preenchida pelo formulário de tipos e incrementada transacionalmente pela RPC `criar_projeto` (lock `FOR UPDATE` + `proximo_numero = v_numero + 1`). O diálogo do frontend envia o campo explicitamente no insert e no update. Ver `banco.sql:26-36` (tabela e constraints), `banco.sql:119-141` (RPC) e `src/routes/cadastros/cadastros-tipos.tsx` (formulário). Toda alteração de banco ocorre exclusivamente pelo MCP Supabase; `banco.sql` é referência declarativa.

## Goals / Non-Goals

**Goals:**
- Tornar o próximo número estado exclusivamente do sistema: nasce = `faixa_inicial`, só cresce.
- Enforcement no banco (trigger), válido para qualquer cliente, não apenas para a UI atual.
- Preservar intactos a RPC `criar_projeto`, a constraint `tipo_proximo_valido` e o fluxo transacional de numeração.

**Non-Goals:**
- Redesenhar a numeração para valor derivado (`max(numero)+1`) — mantido o contador armazenado.
- Oferecer fluxo de correção de contador pela UI (tradeoff aceito no proposal).
- Alterar semântica de faixa, PPI, Torre ou qualquer outra regra de tipo de projeto.

## Decisions

### D1: Contador armazenado mantido (alternativa: derivar de `max(numero)+1`)
O contador + lock de linha já garante serialização transacional e está em produção. Derivar do histórico adicionaria acoplamento entre cadastro de tipo e dados de projeto, com ganho zero. Decisão veio da exploração (Opção A).

### D2: Trigger `before insert or update` como ponto de enforcement (alternativa: frontend calcula)
- **INSERT**: `new.proximo_numero := new.faixa_inicial`, ignorando qualquer valor enviado (cobre também insert sem a coluna — o NOT NULL é checado após triggers).
- **UPDATE**: clamp para cima — se `new.faixa_inicial > new.proximo_numero`, então `new.proximo_numero := new.faixa_inicial`.
- Coexiste com o trigger `tipo_atualizado` (`fn_atualizar_timestamp`): colunas disjuntas (`atualizado_em` vs `proximo_numero`), ordem alfabética entre before-triggers é irrelevante aqui.
- A UI para de enviar o campo por completo; cálculo no frontend seria contornável por qualquer cliente HTTP.

### D3: Clamp somente para cima; encolhimento de faixa continua barrado pela constraint
Clamp para baixo (ex.: ajustar contador a uma `faixa_final` reduzida) reutilizaria números emitidos. Se o ADM encolhe a faixa final abaixo do contador corrente, a constraint `tipo_proximo_valido` existente falha e a tradução em `formato.ts` ("O próximo número deve estar dentro da faixa definida.") já cobre a mensagem — rede de segurança preservada.

### D4: Guarda monotônica no UPDATE
Update que tente reduzir explicitamente `proximo_numero` (ex.: cliente desatualizado ainda enviando o campo com valor antigo) levanta exceção com mensagem em português (`raise exception 'O próximo número não pode ser reduzido manualmente'`). Código P0001 não está no mapa de constraints do wrapper, então a mensagem passa direto pelo `mensagemDeErro` (mesmo caminho das RPCs). Isso materializa o "mantido exclusivamente pelo sistema" do lado do banco.

### D5: Frontend remove o campo por completo
`ValoresTipoProjeto` perde `proximo_numero`; insert e update deixam de enviar a coluna; `validarTipo` perde o bloco de próximo número; o input sai do diálogo. A coluna "Próximo nº" da tabela e a exibição no seletor de `projeto-novo.tsx` permanecem (informação somente-leitura).

## Risks / Trade-offs

- [Contador desalinhado (pós-importação de dados) sem correção pela UI] → Aceito no proposal. Correção via MCP exige desabilitar temporariamente o trigger (`alter table ... disable trigger`), aplicar o UPDATE e reabilitar — atrito consciente e coerente com "exclusivamente pelo sistema".
- [Cliente com cache antigo ainda envia o campo] → INSERT: trigger sobrescreve. UPDATE: guarda monotônica (D4) bloqueia regressão com mensagem clara.
- [Trigger interage com `criar_projeto`] → O update da RPC (`proximo_numero = old + 1`, faixa inalterada) satisfaz a guarda (novo > antigo) e o clamp (já ≥ `faixa_inicial`); comportamento inalterado.

## Migration Plan

1. MCP Supabase `apply_migration`: criar `fn_proximo_automatico()` e o trigger `tipo_proximo_automatico before insert or update on public.tipo_projeto`.
2. MCP `execute_sql` — verificação: não existem linhas com `proximo_numero < faixa_inicial` (a constraint já o impede); nenhum ajuste de dados é necessário.
3. Frontend: remover campo/validação/envio (D5).
4. Atualizar `banco.sql` como referência declarativa (função + trigger junto aos demais).
5. Validação funcional: criar tipo PPI (faixa 1001+) e conferir contador = faixa inicial; editar faixa inicial para cima e conferir clamp; reduzir contador via SQL e conferir o erro em português.

**Rollback**: `drop trigger tipo_proximo_automatico on public.tipo_projeto; drop function public.fn_proximo_automatico();` e reverter o frontend (campo volta a ser enviado; nenhuma mudança de dado ocorreu).

## Open Questions

(nenhuma)
