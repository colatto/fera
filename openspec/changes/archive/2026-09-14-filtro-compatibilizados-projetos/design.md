## Context

A listagem de projetos consulta as views `v_projetos_administrativo` (ADM) e `v_projetos_operacional` (OPER); ambas já projetam `fundacao_compatibilizada` (boolean NOT NULL, default false na tabela `projeto`). Os filtros são montados no cliente e aplicados no servidor via PostgREST (`montarConsulta`), com estado em `FiltrosProjetos` (string vazia = sem filtro) e chave de cache que inclui o objeto de filtros. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**
- Filtrar a listagem por compatibilização da fundação nos dois perfis, sem alterar o Supabase remoto.
- Manter o padrão existente de filtros (sentinela de string vazia, select inline com "Todos").

**Non-Goals:**
- Coluna "Compatibilizada" na tabela de listagem ou no CSV (decisão do usuário).
- Generalizar `FiltroSelect` para opções tipadas `{valor, rotulo}`.
- Mudanças de schema, views, RLS ou Edge Functions.

## Decisions

1. **`compatibilizado: boolean | ""` em `FiltrosProjetos`** — mantém a convenção do domínio (string vazia = sem filtro) e funciona com `filtrosAtivos`, pois `false !== ""` é `true` (filtrar "Não" conta como filtro ativo). Alternativa descartada: `boolean | null`, que exigiria mudar `filtrosAtivos` para `!= null` e quebraria a uniformidade do objeto.
2. **Select inline no padrão do filtro de Status** — valores `"sim"`/`"nao"` mapeados para `true`/`false` no `onValueChange`, sentinela `TODOS` para "Todos". Alternativa descartada: estender `FiltroSelect` para aceitar pares valor/rótulo — escopo maior sem necessidade imediata; se surgirem mais filtros tipados, generaliza-se depois.
3. **Filtro aplicado no servidor**: em `montarConsulta`, `if (filtros.compatibilizado !== "") q = q.eq("fundacao_compatibilizada", filtros.compatibilizado)`. As views já expõem a coluna; a coluna é NOT NULL na tabela, então `eq` cobre todos os casos (sem cenário null em prática).
4. **Posição na grade**: o cartão de filtros usa `lg:grid-cols-9` com 8 filtros hoje; o novo filtro ocupa o 9º slot, fechando a grade em `lg`. Ordem: após "UF".
5. **Remoção do resquício `codigo`** — `FiltrosProjetos.codigo`, `filtrosVazios.codigo` e o `ilike` em `montarConsulta` saem, pois não existe controle de Código na interface (limpeza acordada com o usuário).

## Risks / Trade-offs

- [Tipagem das views declara `boolean | null`] → Coluna é NOT NULL default false na tabela `projeto`; nenhuma linha pode ser null. Sem mitigação necessária.
- [Filtro "Não" precisar contar como ativo] → Coberto pela decisão 1; `filtrosAtivos` permanece inalterado.
- [Sem coluna visível, linhas filtradas não evidenciam o campo] → Aceito pelo usuário; o detalhe mostra "Fundação compatibilizada".

## Migration Plan

Nenhuma migração de banco: o Supabase remoto permanece intocado. Entrega é o deploy do front (build Vite); rollback é reverter o commit. A spec principal `consulta-projetos` é atualizada no archive do change.

## Open Questions

Nenhuma.
