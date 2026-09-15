## ADDED Requirements

### Requirement: Valor do recebimento pré-preenchido com o saldo e limitado a ele
O diálogo "Registrar recebimento" do detalhe do projeto MUST preencher automaticamente o campo Valor com o saldo a receber da nota no momento de cada abertura do diálogo — não apenas na primeira montagem —, de modo que uma reabertura após recebimento parcial apresente o saldo corrente. No diálogo de lote, ao selecionar uma nota em uma linha, o campo Valor dessa linha MUST ser preenchido automaticamente com o saldo corrente da nota selecionada. Em ambos os diálogos o valor pré-preenchido MUST permanecer editável e o valor digitado pelo usuário prevalece sobre o preenchimento automático. O envio MUST ser bloqueado localmente, com erro inline identificando o saldo, quando o valor informado for menor ou igual a zero ou exceder o saldo a receber da nota correspondente; a habilitação do botão de confirmação MUST refletir essa validação. O banco permanece a fonte da verdade: se o saldo exibido estiver defasado, a falha transacional MUST ser exibida sem alterar o estado, como hoje.

#### Scenario: Pre-fill no detalhe
- **WHEN** o ADM abre "Registrar recebimento" em um projeto com nota emitida e saldo em aberto
- **THEN** o campo Valor vem preenchido com o saldo a receber da nota, permanece editável, e o botão Registrar está habilitado

#### Scenario: Reabertura reflete o saldo corrente
- **WHEN** o ADM registra um recebimento parcial, reabre o diálogo "Registrar recebimento" do mesmo projeto
- **THEN** o campo Valor vem preenchido com o saldo atualizado após o recebimento anterior, e não com o valor de uma abertura anterior

#### Scenario: Valor editado prevalece
- **WHEN** o ADM altera o valor pré-preenchido para um valor positivo dentro do saldo antes de confirmar
- **THEN** o recebimento é registrado com o valor informado, preservando o recebimento parcial

#### Scenario: Valor acima do saldo bloqueia o submit
- **WHEN** o ADM informa, em qualquer um dos diálogos de recebimento, um valor maior que o saldo a receber da nota
- **THEN** o botão de confirmação fica desabilitado e um erro inline indica o saldo disponível, sem chamada à RPC

#### Scenario: Valor menor ou igual a zero bloqueia o submit
- **WHEN** o ADM informa ou mantém um valor que não seja número positivo
- **THEN** o botão de confirmação fica desabilitado e o erro inline é exibido, sem chamada à RPC

#### Scenario: Pre-fill por linha no lote
- **WHEN** o ADM seleciona uma nota em uma linha do lote
- **THEN** o campo Valor da linha vem preenchido com o saldo corrente dessa nota e permanece editável

#### Scenario: Linha do lote acima do saldo bloqueia o lote
- **WHEN** alguma linha do lote fica com valor maior que o saldo da nota correspondente
- **THEN** o botão "Confirmar lote" fica desabilitado e a linha em erro exibe o erro inline, sem chamada à RPC

#### Scenario: Saldo defasado segue sendo recusado pelo banco
- **WHEN** o submit passa na validação local, mas o saldo real mudou desde a abertura e a RPC recusa o valor
- **THEN** a interface exibe a mensagem transacional do banco e nenhum recebimento é aplicado

### Requirement: Nota única por linha do lote
No diálogo de lote, uma nota fiscal já selecionada em uma linha MUST NOT ser selecionável nas demais linhas: MUST permanecer visível no select das outras linhas, porém desabilitada e marcada como já em uso. Trocar a nota de uma linha ou remover a linha MUST tornar a nota liberada selecionável novamente nas demais linhas. As linhas do diálogo de lote MUST ser reiniciadas a cada abertura: nenhuma linha ou valor informado persiste de uma abertura para a seguinte.

#### Scenario: Nota selecionada fica desabilitada nas demais linhas
- **WHEN** o ADM seleciona uma nota na primeira linha e abre o select de outra linha
- **THEN** a nota já selecionada aparece na lista desabilitada e marcada como em uso, não permitindo nova seleção

#### Scenario: Troca de nota libera a anterior
- **WHEN** o ADM troca a nota de uma linha que já tinha seleção
- **THEN** a nota anterior volta a ser selecionável nas demais linhas e o valor da linha é preenchido com o saldo da nova nota

#### Scenario: Remoção de linha libera a nota
- **WHEN** o ADM remove uma linha que tinha nota selecionada
- **THEN** a nota dessa linha volta a ser selecionável nas demais linhas

#### Scenario: Reabertura do lote sem linhas residuais
- **WHEN** o ADM fecha o diálogo de lote com linhas preenchidas e o reabre
- **THEN** o diálogo abre sem linhas ou valores da abertura anterior
