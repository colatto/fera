## 1. Camada de queries

- [x] 1.1 Em `src/queries/projetos.ts`, adicionar `compatibilizado: boolean | ""` a `FiltrosProjetos` e a `filtrosVazios` (valor inicial `""`)
- [x] 1.2 Remover o resquício `codigo` de `FiltrosProjetos`, `filtrosVazios` e do `ilike` em `montarConsulta`
- [x] 1.3 Em `montarConsulta`, aplicar `q.eq("fundacao_compatibilizada", filtros.compatibilizado)` quando `filtros.compatibilizado !== ""`

## 2. Interface da listagem

- [x] 2.1 Em `src/routes/projetos/projetos-listar.tsx`, adicionar o select "Compatibilizados" no cartão de filtros (após UF, fechando o 9º slot da grade), com opções Todos (`TODOS`), Sim (`true`) e Não (`false`), seguindo o padrão do select de Status
- [x] 2.2 Verificar que "Limpar filtros" restaura o select para "Todos" (via `filtrosVazios`) e que filtrar por "Não" aciona o estado de filtros ativos

## 3. Validação

- [x] 3.1 Rodar o lint/build (`npm run build`) e corrigir qualquer quebra de tipagem decorrente da remoção de `codigo`
- [x] 3.2 Validar o change (`openspec validate filtro-compatibilizados-projetos`)
