# Design — human-timeline

## Context

A linha do tempo de ADM é montada em `montarItensAdm` (`src/routes/projetos/projeto-detalhe.tsx`), que consome eventos de `listarEventos` (`src/queries/projetos.ts`, view `v_eventos_operacionais`). Hoje a descrição de cada evento é `motivo_cancelamento ?? (detalhes ? JSON.stringify(detalhes) : undefined)` — a origem do vazamento. Três tipos de evento gravam `detalhes` no banco (RPCs em `banco.sql`): `CRIACAO` (`{"origem":"cadastro"}`), `SUBSTITUICAO` (`{"projeto_anterior_id":...}`) e `COMPATIBILIZACAO_FUNDACAO` (`{"marcada":true|false}`). A timeline de OPER (`montarItensOperacional`) nunca renderizou `detalhes`. Ver motivation em `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Descrições de evento em linguagem natural, derivadas do tipo do evento, na timeline de ADM.
- Garantia estrutural de que JSON cru ou identificador interno nunca apareça, inclusive para formas de `detalhes` não previstas (default é omitir).

**Non-Goals:**

- Resolver `projeto_anterior_id` para número/ano do projeto anterior (decisão de produto: omitir).
- Renderizar `detalhes` na timeline de OPER (continua sem descrição de detalhes).
- Alterar schema, RPCs ou a view `v_eventos_operacionais` no núcleo da correção (o item opcional B cuida da view, se ativado).

## Decisions

**D1 — Humanização no frontend, por tipo de evento (Opção A).**
Um formatador puro `descricaoDetalhesEvento(evento): string | undefined` com mapa por `tipo`, aplicado em `montarItensAdm` no lugar do `JSON.stringify`. Alternativas: humanizar na view (Opção C) — empurraria apresentação para SQL, longe de onde já vivem os rótulos (`ROTULOS_EVENTO` em `src/lib/constantes.ts`); ou colunas dedicadas no banco — invasivo para ganho nulo, `detalhes` é bom dado de auditoria. A precedência existente é preservada: `motivo_cancelamento ?? descricaoDetalhesEvento(evento)`.

**D2 — Mapa de humanização e default de omissão.**
- `COMPATIBILIZACAO_FUNDACAO` com `detalhes.marcada === true` → "Fundação marcada como compatibilizada".
- `COMPATIBILIZACAO_FUNDACAO` com `detalhes.marcada === false` → "Compatibilização desmarcada".
- Qualquer outro tipo (`CRIACAO`, `SUBSTITUICAO`, `ALTERACAO_STATUS`, `ALTERACAO_CADASTRAL`, tipos futuros) → `undefined` (omissão), incluindo `detalhes` com forma inesperada.
O default é omitir, nunca serializar: tipos novos sem humanização degradam para "sem descrição", nunca para JSON cru — isso dá garantia estrutural (o spec proíbe JSON cru em qualquer perfil).

**D3 — Guarda de tipo estrita sobre `detalhes`.**
`detalhes` é `jsonb` sem schema; o formatador valida `typeof detalhes?.marcada === "boolean"` antes de usar. Valor em forma inesperada (ex.: string `"true"`) → omissão, consistente com D2.

**D4 — Formatador colocalizado com o único consumidor.**
O helper vive em `src/routes/projetos/projeto-detalhe.tsx`, junto de `montarItensAdm`. Alternativa considerada: `src/lib/constantes.ts`, mas o arquivo é de constantes puras (`ROTULOS_*`) e o helper é função com regra de negócio de apresentação com um único consumidor — mover só se surgir segundo consumidor.

**D5 — Item opcional B (mascarar `detalhes` para não-ADM na view), desativado por padrão.**
Se ativado, `v_eventos_operacionais` passa a expor `case when public.usuario_adm() then e.detalhes end as detalhes`, aplicado exclusivamente via MCP Supabase no projeto remoto e espelhado em `banco.sql` (referência declarativa). OPER passa a receber `null`; ADM não muda. Não é barreira de segurança (RLS/RPCs governam acesso; o check `evento_detalhes_sem_financeiro` já bloqueia chaves financeiras) — é higiene de payload, pois OPER nunca renderiza o campo.

## Risks / Trade-offs

- [Tipo de evento futuro grava `detalhes` sem humanização definida] → Degrada para omissão (D2), que é comportamento spec-compliant; a decisão D1 mantém o mapa por tipo num ponto único, fácil de estender.
- [Valor de `marcada` fora do esperado em produção] → Omissão silenciosa perde a distinção marcou/desmarcou; mitigado pela verificação em Implementação (ver Questão Aberta) e pela guarda explícita de D3.
- [Item B exige MCP Supabase disponível] → Se indisponível, o item fica bloqueado sem alternativa local (restrição do projeto); o núcleo (A) não depende disso.

## Migration Plan

Núcleo (A) é alteração só de frontend: deploy normal do bundle; rollback = revert do commit. Item opcional (B), se ativado: aplicar a nova definição da view via MCP Supabase, validar payload de ADM inalterado e de OPER com `detalhes` nulo, e versionar em `banco.sql`; rollback = recriar a view com a coluna crua.

## Open Questions

- Confirmar no projeto remoto se `detalhes.marcada` está gravado como booleano (o esperado pela RPC) ou se há ocorrências com string `"true"` (como sugere o relato original). Não muda a abordagem — apenas estenderia a guarda de D3 se houver strings.
