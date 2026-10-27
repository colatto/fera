# Proposal

## Why

A listagem de projetos exibe a coluna "Responsável", mas não permite filtrar por
responsável interno: para localizar os projetos sob a responsabilidade de uma
pessoa, é preciso varrer a tabela ou usar filtros indiretos. Além disso, as
contas internas da R3 ("Fernanda/R3" e "Operacional/R3") não devem poluir as
opções de um eventual filtro.

## What Changes

- Novo filtro select "Responsável" na listagem de projetos, casando com
  exatidão sobre `responsavel_interno`, disponível para ADM e OPER
  (a coluna já consta nas duas projeções e não é dado financeiro).
- O filtro "Responsável" é posicionado após "Operadora", espelhando a ordem
  das colunas da tabela.
- Opções do select: os valores em uso de `responsavel_interno` na projeção do
  próprio perfil (distintos e ordenados) — sem listar usuários que não
  respondem por nenhum projeto e sem exigir acesso à tabela `usuario`, que a
  RLS restringe a OPER.
- Constante no frontend oculta das opções as contas internas "Fernanda/R3" e
  "Operacional/R3". Os projetos sob essas contas continuam visíveis na
  listagem ("Todos" e demais filtros), com a coluna "Responsável" exibida
  normalmente; apenas não podem ser selecionados como filtro.
- Para acomodar o décimo filtro, o painel passa a usar larguras explícitas por
  filtro em telas grandes (linha única): "Código", "Operadora", "UF" e
  "Compatibilizados" encolhem; em telas menores o grid atual
  (`grid-cols-2` / `md:grid-cols-5`) é mantido.
- Integra com a mecânica existente sem alterações: combina com os demais
  filtros (AND), "Limpar filtros" o restaura, alterá-lo volta à primeira
  página e o estado sobrevive à navegação.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Filtros combináveis" passa a incluir o
  filtro "Responsável" (select de valor único sobre `responsavel_interno`,
  após "Operadora", ADM e OPER), com opções derivadas dos valores em uso,
  ausência das contas internas das opções e cenários de filtro, exclusão e
  combinação.

## Impact

- `src/queries/projetos.ts`: campo `responsavel` em `FiltrosProjetos` e em
  `filtrosVazios`; `.eq("responsavel_interno", ...)` em `montarConsulta`.
- `src/routes/projetos/projetos-listar.tsx`: `FiltroSelect "Responsável"`
  após "Operadora", consulta de valores distintos na view do perfil, constante
  de contas internas ocultas, e larguras por filtro (componentes de filtro
  passam a aceitar classe de largura).
- Sem mudanças no banco, views, RLS ou tipos: `responsavel_interno` já é
  exposto em `v_projetos_administrativo` e `v_projetos_operacional`, e a
  exportação CSV usa as linhas já filtradas (a coluna "Responsável" já existe
  nos dois perfis).
