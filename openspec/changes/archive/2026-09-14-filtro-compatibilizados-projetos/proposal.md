# Filtro Compatibilizados na listagem de projetos

## Why

A listagem de projetos não permite filtrar pela compatibilização da fundação. O dado já é projetado nas duas views de consulta e é exibido no detalhe do projeto ("Fundação compatibilizada"), mas o usuário precisa abrir projeto por projeto para separar compatibilizados de não compatibilizados.

## What Changes

- Incluir o filtro dropdown "Compatibilizados" (opções Todos, Sim, Não) no cartão de filtros da página Projetos, aplicável aos perfis ADM e OPER.
- O filtro é aplicado no servidor via `fundacao_compatibilizada` em `v_projetos_administrativo` e `v_projetos_operacional`, combinável com os filtros existentes.
- Sem coluna nova na tabela de listagem e sem alteração na exportação CSV.
- Remover o resquício do filtro de código (`codigo`) em `FiltrosProjetos`, que não possui controle na interface.

## Capabilities

### New Capabilities

### Modified Capabilities

- `consulta-projetos`: o requirement "Filtros combináveis" passa a incluir o filtro de compatibilização da fundação (Sim/Não/Todos) e deixa de citar filtro por código; novos cenários de filtragem por compatibilização.

## Impact

- `src/queries/projetos.ts`: `FiltrosProjetos` (novo campo `compatibilizado`, remoção de `codigo`), `filtrosVazios`, `filtrosAtivos`, `montarConsulta`.
- `src/routes/projetos/projetos-listar.tsx`: novo controle no cartão de filtros.
- Sem alteração de banco, views, RLS ou Edge Functions (Supabase remoto permanece intocado).
- Spec `openspec/specs/consulta-projetos/spec.md` atualizada no archive do change.
