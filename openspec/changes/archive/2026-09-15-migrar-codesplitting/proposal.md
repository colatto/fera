# Migrar-codesplitting

## Why

O Vite 8 marca a forma de função de `output.manualChunks` como **deprecated** (guia oficial de migração v7→8 e tipos do rolldown 1.2.4 embutido no vite 8.2.2); o substituto nativo é `output.codeSplitting`. O `vite.config.ts` ainda usa a forma de função — legado do change `chunk-grande` (2026-09-15), que escolheu-a por ser o único formato aceito na ocasião. Hoje o build funciona sem avisos, mas a opção está no caminho de remoção: é o mesmo status que `build.rollupOptions` tinha antes de este projeto já tê-lo migrado para `rolldownOptions`.

## What Changes

- Substituir `rolldownOptions.output.manualChunks` (função) por `rolldownOptions.output.codeSplitting.groups` (API nativa do rolldown) em `vite.config.ts`, preservando os mesmos três grupos de vendor: `vendor-supabase`, `vendor-react` (react + react-dom + scheduler, evitando ciclo de chunks), `vendor-router`.
- Reescrever o comentário do bloco no `vite.config.ts`: a restrição documentada ("a forma de objeto não é aceita pelo Rolldown") deixa de se aplicar ao novo formato.
- Re-medir o build de produção após a troca: mesmos chunks emitidos, aviso de chunk grande do Vite permanece sob controle.
- Nada mais muda: refatoração de config de build, sem alteração de comportamento da aplicação, do deploy ou dos requisitos.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

(nenhuma) — os requisitos da spec `carregamento-progressivo` (código de rota sob demanda, múltiplos chunks, aviso de chunk grande como termômetro, payload inicial ≤ 250 kB gzip) permanecem exatamente os mesmos; a migração troca apenas o mecanismo interno de configuração do chunking. Refatoração pura de tooling, portanto `skip_specs: true`.

## Impact

- **Código**: único arquivo alterado é `vite.config.ts`.
- **Build**: verificação por build local (`vite build`); `dist/` é gitignored. Cenário de erro conhecido a evitar: `codeSplitting` e `manualChunks` coexistindo — o rolldown ignora o `manualChunks` silenciosamente (a troca é substituição direta, não adição).
- **Deploy**: sem impacto — Vercel roda o mesmo `vite build`; `vercel.json` intocado.
- **Supabase**: sem qualquer interação.
- **Risco baixo**: migração mecânica documentada pelo próprio rolldown (a função vira um `group` com `name`); validação é comparar a lista e os tamanhos dos chunks antes/depois.
