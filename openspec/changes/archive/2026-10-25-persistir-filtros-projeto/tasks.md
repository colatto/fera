# Tasks

## 1. Contexto de estado da consulta

- [x] 1.1 Criar módulo do contexto de consulta de projetos (`filtros: FiltrosProjetos`, `ordenacao: SortingState`, `pagina: number`) com provider e hook de consumo, e montá-lo em `src/router.tsx` envolvendo `<Shell/>`; verificar com `npm run build` que o projeto compila sem erros de tipo

## 2. Listagem consumindo o contexto

- [x] 2.1 Trocar os `useState` de `filtros` e `ordenacao` de `ProjetosListar` pelo contexto criado (`loteAberto` permanece local), mantendo `useDebounce` local sobre os filtros hidratados; verificar com `npm run dev` que aplicar um filtro continua consultando com o mesmo comportamento atual
- [x] 2.2 Tornar a paginação do `useReactTable` controlada (`state.pagination` com `pageIndex` do contexto e `pageSize` fixo `TAMANHO_PAGINA`), com índice efetivo derivado `min(pagina, pageCount - 1)` usado na tabela e no rodapé; verificar navegando até a última página e conferindo o rodapé "página X de Y"
- [x] 2.3 Zerar a página em `mudarFiltro` e em "Limpar filtros" (mantendo `ordenacao` no segundo caso); verificar alterando um filtro na página 3 e clicando "Limpar filtros" — ambos retornam à página 1

## 3. Verificação dos cenários da spec

- [x] 3.1 Percorrer os seis cenários do requisito "Estado da consulta preservado na navegação" no navegador com `npm run dev` (voltar do detalhe; navegar para outra seção e voltar; F5 zera; limpar filtros; mudar filtro volta à página 1; página fora do intervalo exibe a última válida) e conferir cada resultado contra o delta em `specs/consulta-projetos/spec.md`
- [x] 3.2 Rodar `npm run build` e confirmar que typecheck e build passam sem erros
