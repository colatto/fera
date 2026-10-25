# Design

## Context

A listagem de projetos (`src/routes/projetos/projetos-listar.tsx`) mantém filtros, ordenação e paginação em `useState` local. As rotas `/projetos` e `/projetos/:id` são irmãs no router (`src/router.tsx`), então abrir o detalhe desmonta a listagem e voltar a remonta com o estado zerado. Os dados consultados continuam no cache do React Query (a queryKey inclui os filtros aplicados), mas o estado da consulta se perde. Ver motivação em proposal.md.

## Goals / Non-Goals

**Goals:**

- Filtros, ordenação e página sobrevivem a qualquer navegação dentro da aplicação e morrem no recarregamento da página.
- Restauração sem flash de "Consultando…": o React Query já possui a entrada em cache para os filtros restaurados.

**Non-Goals:**

- Filtros na URL (links compartilháveis) — a decisão de produto é que recarregar zera a consulta; parâmetros de URL sobreviveriam ao F5.
- Persistir posição de rolagem.
- Estender o mecanismo a outras listagens (cadastros, usuários); o escopo é a consulta de projetos.
- Qualquer mudança no backend/Supabase ou em `src/queries/projetos.ts`.

## Decisions

### 1. Estado em contexto React montado acima das rotas

Um provider com `filtros`, `ordenacao` e `pagina` (apenas o índice; `pageSize` segue fixo em `TAMANHO_PAGINA`) definido em módulo próprio da consulta de projetos e montado em `src/router.tsx` envolvendo `<Shell/>`. O `ProjetosListar` consome o contexto no lugar dos três `useState` locais.

Alternativas consideradas:

- **Parâmetros de URL (`useSearchParams`)**: idiomático e gera links compartilháveis, mas mantém os filtros no F5 — contraria o requisito "recarregar zera". Rejeitado por decisão de produto.
- **sessionStorage**: também sobrevive ao F5 na mesma aba; exigiria limpeza explícita para reproduzir o requisito. Rejeitado.
- **Variável de módulo com hook de assinatura**: funcional (morre no F5), mas estado implícito fora da árvore React dificulta testes e raciocínio. O contexto entrega o mesmo ciclo de vida com o idiomático do projeto (React puro + React Query; não há lib de estado no `package.json`).

Propriedade decorosa de montar o provider na rota do shell: `/login` é rota irmã do shell no nível superior do router, então deslogar desmonta o provider e zera a consulta — a sessão seguinte nunca herda filtros da anterior.

### 2. Paginação controlada no `useReactTable`

Hoje só `initialState.pagination.pageSize` é fixado; o índice é interno e morre com o componente. A tabela passa a receber `state.pagination` completo (`pageIndex` do contexto + `pageSize` fixo) e `onPaginationChange` gravando o índice no contexto.

### 3. Página fora do intervalo: deriva em render, sem escrita

Se a lista encolheu enquanto o usuário estava fora (ex.: recebimentos em lote confirmados), o índice persistido pode exceder a última página. Em vez de `setState` corretivo (risco de loop), o índice efetivo é derivado em render: `min(pagina, pageCount - 1)`, usado na tabela e no rodapé. O valor persistido só é regravado quando o usuário pagina de novo.

### 4. Resets de página nos pontos de mudança de conjunto

- `mudarFiltro` grava também `pagina = 0` — trocar filtro com a consulta na página 3 não mantém o usuário numa página sem sentido.
- "Limpar filtros" grava `filtrosVazios` e `pagina = 0`, mantendo `ordenacao` (preferência de leitura, não filtro — a spec existente de "Filtros combináveis" segue válida sem alteração).

### 5. Debounce permanece local ao componente

`useDebounce(filtros, 300)` continua em `ProjetosListar`; o que o contexto guarda é o valor cru dos filtros. No remonte, o hook inicializa com o valor já hidratado, então a restauração dispara a query imediatamente (sem espera de 300ms) e a entrada em cache do React Query exibe os dados na hora, refetchando em segundo plano conforme configuração padrão.

## Risks / Trade-offs

- [Clamp derivado diverge do valor persistido] → Rodapé e tabela usam sempre o índice efetivo derivado; o persistido só volta a valer quando o usuário pagina. Divergência é invisível para o usuário.
- [Estado sobrevive entre perfis na mesma sessão de página] → Os campos de filtro são os mesmos para ADM e OPER, então a troca de perfil navegação-corrente não corrompe nada; e logout desmonta o provider (decisão 1), zerando a consulta.
- [Provider em `router.tsx` ordena o estado de projetos na árvore de todas as rotas] → Custo mínimo (um objeto em memória); se outras listagens precisarem do mesmo comportamento, o padrão se repete por domínio em vez de virar um estado global genérico.

## Migration Plan

Sem migração: mudança exclusivamente de frontend (build do SPA). Rollback é reverter o deploy; nenhum dado ou recurso do Supabase é afetado.
