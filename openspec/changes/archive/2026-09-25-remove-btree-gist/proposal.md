# Proposal

## Why

A extensão `btree_gist` foi criada no projeto remoto Supabase (schema `public`) e declarada em `banco.sql` desde o primeiro commit, mas nenhum objeto do banco depende dela: o schema usa somente índices btree, índices unique (incluindo um parcial) e constraints check, sem nenhuma constraint `EXCLUDE` ou índice GiST. A verificação no remoto confirmou 0 índices GiST, 0 constraints de exclusão e 0 objetos dependentes (as únicas dependências são a fiação interna de catálogo da própria extensão). Ela permanece instalada sem utilidade e o `banco.sql` declara um estado esperado que inclui algo sem função.

## What Changes

- Remove a extensão `btree_gist` do projeto remoto Supabase via MCP Supabase (`drop extension btree_gist;`, sem `CASCADE` — nada depende dela; se algo passasse a depender, o drop falha ruidosamente em vez de quebrar objetos).
- Remove a linha `create extension if not exists btree_gist;` de `banco.sql`, mantendo a referência declarativa coerente com o remoto.
- Não altera tabelas, funções, views, RLS, policies, dados ou qualquer comportamento observável; sem impacto no frontend.
- Estabelece o critério de governança: extensão só é declarada/instalada quando algum objeto exige.

## Capabilities

### New Capabilities

- `referencia-banco`: coerência entre a referência declarativa `banco.sql` e o estado do projeto remoto quanto a extensões PostgreSQL instaladas — quando declarar, quando derrubar e o critério de reintrodução.

### Modified Capabilities

- (nenhuma — nenhum capability existente tem requisito afetado)

## Impact

- **Remoto (Supabase)**: a extensão deixa de existir no schema `public`. Nenhum objeto a utiliza, portanto nenhum plano de query, constraint ou policy muda. Reversível em um `create extension btree_gist;` caso uma constraint de exclusão ou índice GiST sobre tipo escalar se torne necessária no futuro.
- **Arquivo**: `banco.sql` (remoção da linha 5).
- **Operação**: execução exclusivamente via MCP Supabase no projeto remoto correto, conforme convenção do projeto; `banco.sql` apenas reflete o novo estado esperado.
- **Frontend (`src/`)**: nenhum impacto.
