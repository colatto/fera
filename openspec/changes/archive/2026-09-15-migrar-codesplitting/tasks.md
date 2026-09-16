# Tasks — migrar-codesplitting

## 1. Baseline

- [x] 1.1 Rodar `vite build` no estado atual e salvar a listagem de `dist/assets` (nomes + bytes) como referência de comparação; confirmar saída sem avisos

## 2. Migração do config

- [x] 2.1 Em `vite.config.ts`, substituir `output.manualChunks` (função) por `output.codeSplitting.groups` conforme design D1/D2: `vendor-supabase`, `vendor-react` (`react-dom|scheduler|react`), `vendor-router`; remover o filtro de `node_modules` do corpo da função
- [x] 2.2 Reescrever o comentário do bloco: descrever o agrupamento e o porquê (cache estável entre deploys; react + react-dom juntos evitam ciclo de chunks), sem a restrição da API antiga
- [x] 2.3 Conferir que não sobrou nenhuma ocorrência de `manualChunks` em `vite.config.ts`

## 3. Verificação

- [x] 3.1 Rodar `npm run build` completo (tsc -b + vite build): exit 0, sem avisos de deprecação nem de chunk grande
- [x] 3.2 Comparar `dist/assets` com o baseline da 1.1: chunks `vendor-supabase`, `vendor-react` e `vendor-router` presentes com tamanhos equivalentes (hashes podem variar); `index` na mesma magnitude; investigar qualquer chunk sumido ou tamanho trocado
- [x] 3.3 Rodar `npm run preview` e carregar a aplicação (login e uma rota interna com dashboard): carregamento lazy por rota funcionando, sem erro de chunk
