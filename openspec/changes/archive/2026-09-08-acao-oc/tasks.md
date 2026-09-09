## 1. Diálogo de ordem de compra

- [x] 1.1 Em `DialogOrdemCompra` (`src/routes/projetos/projeto-detalhe.tsx`), substituir a chamada direta no `submeter()` por `useAcaoFluxo` com `mutationFn` único que, em modo "nova", encadeia `registrarOrdemCompra` → `vincularOrdemCompra` e, em modo "vincular", chama apenas `vincularOrdemCompra` (design D2)
- [x] 1.2 No `catch` da submissão, quando o registro da nova OC já tiver sucedido, invalidar a chave `["ordens-compra"]` para a OC aparecer na listagem e permanecer vinculável (design D3); manter a exibição do erro via `mensagemDeErro`
- [x] 1.3 Substituir o estado local `processando` por `mutacao.isPending` no botão de confirmação (design D4), mantendo os textos e o fechamento do diálogo em caso de sucesso

## 2. Diálogo de recebimentos em lote

- [x] 2.1 Em `DialogLote`, envolver `confirmarRecebimentosLote` com `useAcaoFluxo`, substituindo a chamada direta e o estado local `processando` por `mutacao.isPending` (design D1/D4); manter a mensagem de falha integral "Lote não aplicado: ..."

## 3. Verificação

- [x] 3.1 Validar lint e build (`npm run lint`, `npm run build`) sem erros
- [x] 3.2 Confirmar cenários da spec delta no ambiente: vincular OC existente em projeto `ENVIADO` reflete `OC_REGISTRADA` na hora; registrar nova + vincular reflete na hora e a OC aparece na listagem; falha na vinculação após registro mantém a OC listada e o projeto inalterado; lote que quita a nota reflete `PAGO` na hora — tudo sem recarregar a página
