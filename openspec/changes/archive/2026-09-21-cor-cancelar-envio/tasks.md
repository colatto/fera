## 1. Ajuste de variantes

- [x] 1.1 Em `src/routes/projetos/projeto-detalhe.tsx`, trocar a variante do gatilho "Cancelar envio" (linha ~788) de `secondary` para `destructive`
- [x] 1.2 Em `src/routes/projetos/projeto-detalhe.tsx`, adicionar `variant="destructive"` ao botão de confirmação do diálogo "Cancelar envio" (linha ~281)

## 2. Verificação

- [x] 2.1 Verificar build/lint do projeto (`npm run build` ou equivalente) sem erros
- [x] 2.2 Conferir visualmente na página do projeto que "Cancelar envio" (status `ENVIADO`) exibe o mesmo estilo de "Cancelar projeto", tanto no gatilho quanto no diálogo de confirmação
