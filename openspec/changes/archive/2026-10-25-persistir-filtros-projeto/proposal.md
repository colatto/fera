# Proposal

## Why

Na listagem de projetos, o estado da consulta (filtros, ordenação e página) vive no estado local do componente da rota `/projetos`. Como `/projetos` e `/projetos/:id` são rotas irmãs no router, abrir o detalhe desmonta a listagem e voltar a remonta com tudo zerado. O usuário que filtra, abre um projeto e volta perde a consulta e precisa redigitá-la — a dor principal relatada é a perda dos filtros.

## What Changes

- O estado da consulta de projetos (filtros, ordenação e página da paginação) passa a sobreviver à navegação: sair para o detalhe (ou qualquer outra rota) e voltar para a listagem restaura os filtros aplicados, a ordenação e a página em que o usuário estava.
- O estado é mantido em memória, acima das rotas; recarregar a página (F5) zera a consulta — os filtros permanecem até que o usuário os remova ou recarregue a página.
- Alterar qualquer filtro retorna a consulta para a primeira página (persistir página serve ao ciclo abrir-detalhe-e-voltar, não a mudanças de conjunto de dados).
- "Limpar filtros" passa a restaurar filtros e página; a ordenação é mantida, por ser preferência de leitura e não filtro.
- Quando a lista retornada tem menos páginas do que a página persistida (ex.: dados alterados durante a estadia no detalhe), a consulta exibe a última página válida em vez de estado vazio.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: novo requisito "Estado da consulta preservado na navegação" definindo a persistência de filtros, ordenação e página na sessão da página, o reset ao recarregar e os comportamentos de "Limpar filtros" e de página fora do intervalo válido. O requisito existente "Filtros combináveis" não muda.

## Impact

- `src/components/shell.tsx`: hospeda o estado da consulta acima das rotas (contexto React).
- `src/routes/projetos/projetos-listar.tsx`: passa a ler e escrever filtros, ordenação e página no contexto; paginação do `useReactTable` passa a ser controlada; tratamento de página fora do intervalo válido.
- `src/queries/projetos.ts`: sem mudança — `FiltrosProjetos`, `filtrosVazios` e as chaves de cache permanecem como estão.
- Mudança exclusivamente de interface web; não toca em Supabase (schema, views, RLS ou dados).
