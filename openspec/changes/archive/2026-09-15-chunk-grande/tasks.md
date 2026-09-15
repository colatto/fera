## 1. Carregamento sob demanda das rotas

- [x] 1.1 Criar wrapper de rota em `src/components/estados.tsx` ou arquivo próprio: componente que envolve o elemento lazy em `Suspense` com fallback `<Carregando />` e um `ErrorBoundary` mínimo que oferece recarregar a aplicação (design D2 e D4)
- [x] 1.2 Converter as rotas do `src/router.tsx` para `lazy(() => import(...))` envoltas no wrapper, mantendo paths, loaders, `ExigirAdm`, redirecionamento do index e `NaoEncontrado` exatamente como estão
- [x] 1.3 Garantir fallback de carregamento centralizado para a rota `/login` (fora do shell), sem tela em branco

## 2. Build sem avisos

- [x] 2.1 Trocar `__dirname` por `import.meta.dirname` em `vite.config.ts` e confirmar que o aviso de `configLoader: 'native'` desaparece
- [x] 2.2 Medir o build de produção (`npm run build`): registrar tamanho min e gzip de cada chunk emitido
- [x] 2.3 Se o chunk compartilhado inicial exceder 500 kB, adicionar `build.rolldownOptions.output.manualChunks` na forma de função separando grupos de vendor (supabase, react-dom, react-router) e re-medir; caso contrário, ajustar apenas `build.chunkSizeWarningLimit` ao novo formato, de modo que nenhum aviso de chunk grande seja emitido (design D3)

## 3. Validação da spec carregamento-progressivo

- [x] 3.1 Verificar no build que a saída tem múltiplos chunks e que recharts/table-core não estão no chunk compartilhado inicial
- [x] 3.2 Conferir payload até a primeira tela pós-autenticação: soma dos chunks gzip baixados até /projetos interativo ≤ 250 kB
- [x] 3.3 Testar manualmente: login → /projetos; primeiro acesso a cada rota mostra `Carregando` antes do conteúdo; guarda de sessão (anônimo em rota interna → login → retorno à rota); OPER forçando `/dashboard-financeiro` degrada para sem dados; refresh direto em rota interna serve a aplicação
- [x] 3.4 Rodar `npm run build` e confirmar que nenhum aviso (chunk grande ou `__dirname`) é emitido
