## Why

Os diálogos de recebimento ("Registrar recebimento" no detalhe do projeto e "Lote de recebimentos" na listagem) abrem com o campo de valor vazio: o ADM precisa digitar o valor manualmente, o que torna o caso típico (recebimento que quita a nota) mais lento e expõe a erros de digitação que só aparecem como erro transacional do banco, após o submit.

## What Changes

- "Registrar recebimento" (detalhe do projeto): o campo Valor é preenchido automaticamente com o saldo a receber da nota no momento da abertura do diálogo; o valor permanece editável.
- Validação no submit: o botão Registrar/Confirmar fica desabilitado com erro inline quando o valor informado é ≤ 0 ou excede o saldo a receber da nota. O banco continua sendo a fonte da verdade.
- "Lote de recebimentos": ao selecionar a nota em uma linha, o Valor da linha é preenchido automaticamente com o saldo da nota; mesmas regras de edição e validação por linha.
- "Lote de recebimentos": uma nota já selecionada em outra linha do lote fica desabilitada no select das demais linhas (visível, marcada como em uso, não selecionável); trocar a nota ou remover a linha libera a nota novamente. A mesma nota não pode ser lançada em mais de uma linha.
- Ambos os diálogos resetam seu estado a cada abertura, de modo que o pre-fill reflita sempre o saldo corrente (o diálogo do detalhe permanece montado entre aberturas; as linhas do lote não persistem de uma abertura para outra).
- Nenhuma mudança de banco: `registrar_recebimento` e `confirmar_recebimentos_lote` permanecem como estão.

## Capabilities

### New Capabilities

<!-- nenhuma -->

### Modified Capabilities

- `fluxo-projetos`: os diálogos de recebimento passam a preencher automaticamente o Valor com o saldo a receber da nota (no detalhe, na abertura; no lote, ao selecionar a nota), com validação local no submit limitando o valor ao saldo, e o lote passa a proibir a mesma nota em mais de uma linha.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx` — `DialogRecebimento`: pre-fill do valor na abertura, erro inline e botão desabilitado fora do intervalo (0, saldo].
- `src/routes/projetos/dialog-lote.tsx` — pre-fill do valor ao selecionar a nota, notas duplicadas desabilitadas nos selects, erro inline por linha, reset das linhas a cada abertura.
- Sem alterações em banco, RPCs, RLS ou queries.
