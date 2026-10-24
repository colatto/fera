# Proposal

## Why

A listagem de projetos não permite localizar um projeto pelo seu código de pasta
(`codigo_pasta`), que é o identificador pelo qual a equipe referencia os projetos no
dia a dia. Hoje é preciso varrer a tabela visualmente ou usar filtros indiretos
(cliente, status) para chegar ao projeto certo.

## What Changes

- Novo filtro texto "Código" na listagem de projetos, buscando por substring
  case-insensitive sobre `codigo_pasta` (ex.: `F-2024` traz o ano, `0001` traz a
  sequência).
- O filtro "Código" passa a ser o **primeiro** filtro do painel, antes de "Status".
- Disponível para ADM e OPER: `codigo_pasta` consta nas duas projeções e não é
  dado financeiro.
- Grid de filtros passa de `lg:grid-cols-8` para `lg:grid-cols-9`, mantendo os
  nove filtros em uma linha em telas grandes.
- Combina com os demais filtros (AND), integra-se ao "Limpar filtros" e é herdado
  pela exportação CSV da consulta corrente, sem alterações adicionais.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Filtros combináveis" passa a incluir o filtro
  "Código" (substring sobre `codigo_pasta`, primeiro filtro, ADM e OPER), com
  cenários de busca por termo contido no código e de combinação com os demais
  filtros.

## Impact

- `src/queries/projetos.ts`: campo `codigo` em `FiltrosProjetos` e em
  `filtrosVazios`; `.ilike("codigo_pasta", "%termo%")` em `montarConsulta`.
- `src/routes/projetos/projetos-listar.tsx`: `FiltroTexto` "Código" como primeiro
  item do grid; classe do grid `lg:grid-cols-8` → `lg:grid-cols-9`.
- Sem mudanças no banco, views, RLS, exportação CSV ou detalhe do projeto:
  `codigo_pasta` já está exposto em `v_projetos_administrativo` e
  `v_projetos_operacional`, e a exportação usa as linhas já filtradas.
