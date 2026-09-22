## 1. Exibição no resumo financeiro

- [x] 1.1 Em `src/routes/projetos/projeto-detalhe.tsx`, no card "Financeiro", incluir após a linha "Ordem de compra" uma `LinhaFinanceira` com rótulo "Centro de custo" e valor `adm.centro_custo`, renderizada somente quando `adm.centro_custo` estiver informado
- [x] 1.2 Rodar `npm run build` e confirmar que a compilação passa sem erros

## 2. Validação

- [x] 2.1 Verificar no detalhe de um projeto ADM com centro de custo que a linha aparece imediatamente abaixo de "Ordem de compra", e que em projeto sem centro de custo a linha está ausente e as demais permanecem inalteradas
- [x] 2.2 Rodar `openspec validate --change visu-centro-custo` e confirmar que a change é válida
