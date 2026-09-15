## Why

O build de produção emite o aviso "Some chunks are larger than 500 kB after minification" desde o primeiro commit: a aplicação inteira vira um único chunk JS de 1.209 kB (349 kB gzip), 2,4× o limite do Vite. A medição por sourcemap mostrou que 92% do chunk é dependência — e que 38% do total (recharts 244 kB + react-table 46 kB) serve a apenas duas rotas. Todo acesso à aplicação baixa código de gráficos e tabelas que a maioria das navegações não usa.

## What Changes

- Converter as rotas do `src/router.tsx` de imports estáticos para carregamento sob demanda (`lazy`), mantendo guarda de sessão, redirecionamentos e a degradação para perfil OPER exatamente como hoje.
- Exibir indicação de carregamento enquanto o código de uma rota ainda não baixou (fallback de Suspense), sem tela em branco nem quebra de recarregamento direto por URL.
- Corrigir o aviso de `__dirname` no `vite.config.ts` (usar `import.meta.dirname`), eliminando o segundo aviso pré-existente do build.
- Ajustar o limite do aviso de tamanho de chunk no Vite para um valor compatível com o novo formato (vendor separado), para que o aviso volte a sinalizar regressões reais em vez de disparar sempre.

## Capabilities

### New Capabilities

- `carregamento-progressivo`: comportamento de carregamento do aplicativo web — código de rota baixado sob demanda, indicação de carregamento de rota, integridade de guarda de sessão e recarregamento direto com chunks separados, e limite de payload inicial.

### Modified Capabilities

<!-- Nenhuma: os requisitos de sessão, guarda de rota e navegação da spec interface-web não mudam; o carregamento progressivo é um comportamento novo e complementar. -->

## Impact

- `src/router.tsx`: todas as 13 rotas passam a componentes lazy.
- `src/main.tsx`: boundary de Suspense em volta do `RouterProvider` (ou por rota).
- `vite.config.ts`: `chunkSizeWarningLimit` (e opcionalmente separação de vendor), troca de `__dirname` por `import.meta.dirname`.
- Build passa a emitir múltiplos chunks JS com hash; sem alteração no `vercel.json` (rewrites só se aplicam na ausência de arquivo estático, então os assets continuam sendo servidos).
- Sem impacto no Supabase, no banco, em queries ou em RLS.
