## Context

O build de produção gera um único chunk (`index-*.js`, 1.209 kB / 349 kB gzip) porque o `src/router.tsx` importa todas as rotas estaticamente e não há nenhum `import()` dinâmico. Medição por sourcemap (ver proposal): recharts 244 kB, react-dom 174 kB, stack Supabase ~197 kB, react-router 90 kB, table-core 46 kB; código próprio, 96 kB. Recharts só é usado em `dashboard-operacional.tsx`; table-core só em `projetos-listar.tsx`. O `vercel.json` usa rewrite SPA que só se aplica quando não há arquivo estático correspondente, então chunks com hash continuam sendo servidos sem alteração de infraestrutura.

Vite 8 usa Rolldown: `manualChunks` em forma de objeto lança `TypeError: manualChunks is not a function` — só a forma de função é aceita. O build também emite aviso de `__dirname` (`vite.config.ts:25`) por o `configLoader: 'native'` não suportá-lo.

## Goals / Non-Goals

- **Goal**: divisão de código por rota com carregamento sob demanda, sem regressão de sessão, guarda, navegação ou recarregamento direto.
- **Goal**: build sem aviso de chunk grande e sem aviso de `__dirname`.
- **Non-Goal**: reduzir o peso das dependências em si (ex.: substituir recharts, extrair realtime do supabase-js — 55 kB de realtime/phoenix ficam, pois o pacote importa estaticamente).
- **Non-Goal**: prefetch de chunks em hover/predictive; micro-otimização de tempo de build.

## Decisions

### D1 — Lazy por rota com `React.lazy`, não `route.lazy` do react-router
As rotas são declaradas como `element:` simples, sem módulos de rota (loader/action por arquivo). `lazy(() => import("@/routes/..."))` por componente é o mecanismo mínimo e idiomático para esse formato; a propriedade `lazy` de rota do react-router v8 é desenhada para módulos de rota completos e traria reestruturação sem benefício adicional. Alternativa descartada: manter imports estáticos e só separar vendor (não adia download, não resolve o aviso sozinho — medido: principal cai a 776 kB e ainda avisa).

### D2 — Um Suspense por rota, fallback reutilizando `Carregando`
Cada rota interna é envolta em um wrapper (`Suspense` com fallback `<Carregando />` de `@/components/estados`) em vez de um único Suspense em volta do `RouterProvider`: assim o shell (menu, contexto de sessão) permanece montado durante o download do chunk e só a área de conteúdo mostra carregamento. O login, fora do shell, recebe fallback centralizado próprio para não deixar a página em branco. A guarda (`loader: exigirSessao`) continua rodando no shell, antes do conteúdo lazy — sem interação com o Suspense.

### D3 — Divisão de vendor só se o chunk compartilhado continuar acima do limite
Após o lazy por rota, o chunk compartilhado inicial fica em torno de 776 kB min (≈ 212 kB gzip até o login, ≈ 225 kB até /projetos). Se medido acima de 500 kB, separar grupos de vendor via `build.rolldownOptions.output.manualChunks` **na forma de função** (restrição Rolldown, D0 acima) — candidatos: `supabase` (~197 kB), `react-dom` (174 kB), `react-router` (90 kB). Isso não muda bytes baixados, melhora cache entre deploys e traz o maior chunk para baixo do limite, mantendo o aviso significativo (cenário "Aviso de build sob controle" da spec). Sempre medir no build real antes de fixar grupos.

### D4 — ErrorBoundary mínimo para falha de chunk
Com chunks por rota, um deploy novo pode remover o hash que uma aba aberta ainda vai pedir (navegação a rota não visitada → 404 do chunk → o lazy lança). Um boundary de erro mínimo em volta da área de rota, oferecendo recarregar a aplicação, evita tela quebrada sem sistema de retry. Reaproveita o padrão visual de `@/components/estados`.

### D5 — `import.meta.dirname` no vite.config.ts
Troca direta de `__dirname` por `import.meta.dirname` (Node ≥ 20.11), eliminando o segundo aviso do build sem mudar comportamento.

## Risks / Trade-offs

- [Flash de fallback na primeira visita a cada rota] → Fallback pequeno e já padronizado (`Carregando`); em rede interna o download de ~10–30 kB por rota é imperceptível na maioria dos casos.
- [Dobra de indicadores: fallback de chunk + estado de carregamento de query] → Janela curta e sequencial (chunk baixa antes da query disparar); aceitável para ferramenta interna.
- [Grupos de vendor fixados às cegas podem desequilibrar chunks] → D3 manda medir antes; a troca de grupos é só no `vite.config.ts`.
- [Aba aberta atravessando deploy quebra navegação futura] → D4 cobre com boundary + recarregar; hash longo no Vercel mantém chunks antigos enquanto não houver limpeza, reduzindo a janela.

## Migration Plan

Sem migração de dados ou de API. Deploy normal (`vite build` no Vercel). Rollback: reverter o commit — o formato de um chunk único volta a valer, e nenhuma dependência externa muda. Nenhuma alteração no Supabase (regra do config.yaml não se aplica: nada toca o banco).

## Open Questions

Nenhuma.
