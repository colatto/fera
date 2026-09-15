## 1. Fundação

- [x] 1.1 Adicionar `formatarValorDecimal` em `src/lib/formato.ts` (Intl pt-BR, `useGrouping: false`, 2 casas — produz "6000,50" para o parsing `replace(",", ".")` existente)

## 2. DialogRecebimento (detalhe do projeto)

- [x] 2.1 Sincronizar `valor` com `formatarValorDecimal(saldo)` e `data` com `dataLocalHoje()` quando `aberto` transiciona para true (pre-fill na abertura, não na montagem — design D2)
- [x] 2.2 Adicionar validação de submit: parse `Number(valor.replace(",", "."))`; botão desabilitado e erro inline quando o valor não é positivo ("Informe um valor positivo") ou excede o saldo ("O valor excede o saldo de {formatarMoeda(saldo)}") — design D3
- [x] 2.3 Verificar os cenários da spec no diálogo: pre-fill com saldo corrente na reabertura após recebimento parcial, edição do valor prevalece, saldo defasado exibe o erro transacional do banco

## 3. DialogLote (listagem de projetos)

- [x] 3.1 Resetar `linhas` para vazio quando `aberto` transiciona para true (nenhuma linha persiste entre aberturas — design D2)
- [x] 3.2 Pre-fill do Valor da linha com `formatarValorDecimal(saldo)` da nota selecionada, sobrescrevendo o valor ao trocar de nota — designs D1 e D6
- [x] 3.3 Derivar o conjunto de notas em uso pelas outras linhas e renderizar esses `SelectItem` desabilitados com sufixo "— já em uso"; troca de nota ou remoção de linha libera a nota automaticamente — design D5
- [x] 3.4 Validação por linha no submit do lote: mesma regra de valor positivo e teto do saldo da linha, com erro inline na linha em erro e botão "Confirmar lote" desabilitado
- [x] 3.5 Verificar os cenários da spec no lote: pre-fill por linha, nota duplicada bloqueada nas demais linhas, remoção/troca libera a nota, reabertura sem linhas residuais, linha acima do saldo bloqueia o lote

## 4. Consistência final

- [x] 4.1 Confirmar que banco, RPCs e queries permanecem inalterados; `npm run build` (ou `tsc`) sem erros
