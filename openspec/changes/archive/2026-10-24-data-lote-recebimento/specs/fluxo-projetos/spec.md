# Spec Delta

## MODIFIED Requirements

### Requirement: Recebimentos em lote
A interface MUST oferecer ao ADM o lançamento de recebimentos em lote pela RPC `confirmar_recebimentos_lote`, por meio do botão "Lote de recebimentos" posicionado exclusivamente no cabeçalho da página de listagem de projetos, sem vínculo a projeto específico. O botão MUST ser exibido apenas para o perfil ADM e MUST estar sempre presente nessa página, sem condicionamento a status de projeto; o detalhe do projeto MUST NOT oferecer a entrada do lote. Quando não houver notas com saldo em aberto, o clique no botão MUST exibir o aviso "Nenhuma nota pendente de recebimento" sem abrir o diálogo de lote. No diálogo, enquanto nenhuma data de emissão tiver sido escolhida, o clique em "Adicionar item" MUST exigir primeiro a seleção de uma data de emissão em um calendário (campo de data nativo); datas de emissão sem notas com saldo em aberto MUST NOT permitir a criação de linhas — ao serem escolhidas, a interface MUST informar a ausência de pendências e o "Adicionar item" MUST NOT criar linha enquanto a data escolhida não possuir notas com saldo em aberto. Após a escolha, o seletor de nota de cada linha MUST exibir somente as notas com saldo em aberto cuja data de emissão seja a data escolhida: o lote MUST restringir-se a notas de uma mesma data de emissão e notas de outras datas MUST NOT ser selecionáveis. A data de emissão escolhida é somente critério de filtro e MUST NOT ser gravada: a data de recebimento de cada linha permanece um campo próprio, editável, com default na data corrente do fuso local. Se qualquer nota ou parcela do lote falhar, a interface MUST informar falha integral sem aplicar nenhum recebimento, e o sucesso aplica todos os itens. O sucesso do lote MUST refletir imediatamente em status, linha do tempo e dashboards — sem recarregar a página nem navegar entre telas —, incluindo a transição para `PAGO` quando o lote quita integralmente a nota.

#### Scenario: Entrada exclusiva na listagem de projetos
- **WHEN** o ADM acessa a página de listagem de projetos
- **THEN** o botão "Lote de recebimentos" está presente no cabeçalho, independentemente do status dos projetos listados, e o detalhe de um projeto não oferece o botão

#### Scenario: Botão restrito ao ADM
- **WHEN** um usuário de perfil operacional acessa a listagem de projetos
- **THEN** o botão "Lote de recebimentos" não é exibido

#### Scenario: Clique sem notas pendentes
- **WHEN** o ADM clica em "Lote de recebimentos" e não há notas com saldo em aberto
- **THEN** a interface exibe o aviso "Nenhuma nota pendente de recebimento" e o diálogo de lote não abre

#### Scenario: Data de emissão exigida antes da lista
- **WHEN** o ADM clica em "Adicionar item" no diálogo de lote e nenhuma data de emissão foi escolhida
- **THEN** o diálogo exige a seleção de uma data de emissão antes de apresentar o seletor de notas, e nenhuma linha com seleção de nota é criada sem data escolhida

#### Scenario: Calendário para escolher a data de emissão
- **WHEN** o ADM clica em "Adicionar item" no diálogo de lote e nenhuma data de emissão foi escolhida
- **THEN** o diálogo apresenta um calendário (campo de data nativo) para a escolha da data de emissão

#### Scenario: Data sem pendentes não permite linhas
- **WHEN** o ADM escolhe no calendário uma data de emissão sem notas com saldo em aberto
- **THEN** a interface informa a ausência de notas pendentes na data e o clique em "Adicionar item" não cria linha até que uma data com pendentes seja escolhida

#### Scenario: Lista de notas filtrada pela data escolhida
- **WHEN** o ADM escolhe uma data de emissão e abre o seletor de nota de uma linha
- **THEN** apenas as notas com saldo em aberto cuja data de emissão é a data escolhida aparecem, e notas de outras datas não são exibidas nem selecionáveis

#### Scenario: Lote válido
- **WHEN** o ADM confirma lote com notas e parcelas válidas
- **THEN** todos os recebimentos são aplicados e quitação parcial/total reflete no projeto

#### Scenario: Lote com item inválido
- **WHEN** o lote contém uma parcela que excederia a nota
- **THEN** a operação falha integralmente, a interface informa e nenhum recebimento é aplicado

#### Scenario: Lote que quita a nota reflete imediatamente
- **WHEN** o ADM confirma um lote cuja última parcela quita integralmente a nota de um projeto
- **THEN** o status do projeto passa a `PAGO` e o evento da transição aparece na linha do tempo, sem recarregar a página

### Requirement: Nota única por linha do lote
No diálogo de lote, uma nota fiscal já selecionada em uma linha MUST NOT ser selecionável nas demais linhas: MUST permanecer visível no select das outras linhas, porém desabilitada e marcada como já em uso. Trocar a nota de uma linha ou remover a linha MUST tornar a nota liberada selecionável novamente nas demais linhas. A data de emissão escolhida MUST permanecer travada enquanto houver linhas no lote; o clique em "Adicionar item" com linhas existentes MUST adicionar a nova linha na mesma data, sem exigir nova seleção, e a remoção da última linha MUST liberar nova escolha de data. As linhas e a data escolhida do diálogo de lote MUST ser reiniciadas a cada abertura: nenhuma linha, valor ou data persiste de uma abertura para a seguinte.

#### Scenario: Nota selecionada fica desabilitada nas demais linhas
- **WHEN** o ADM seleciona uma nota na primeira linha e abre o select de outra linha
- **THEN** a nota já selecionada aparece na lista desabilitada e marcada como em uso, não permitindo nova seleção

#### Scenario: Troca de nota libera a anterior
- **WHEN** o ADM troca a nota de uma linha que já tinha seleção
- **THEN** a nota anterior volta a ser selecionável nas demais linhas e o valor da linha é preenchido com o saldo da nova nota

#### Scenario: Remoção de linha libera a nota
- **WHEN** o ADM remove uma linha que tinha nota selecionada
- **THEN** a nota dessa linha volta a ser selecionável nas demais linhas

#### Scenario: Data travada com linhas existentes
- **WHEN** o lote possui linhas e o ADM clica em "Adicionar item"
- **THEN** a nova linha é criada já restrita à mesma data de emissão escolhida, sem pergunta de data e sem permitir trocar a data do lote

#### Scenario: Remoção da última linha libera a data
- **WHEN** o ADM remove a última linha do lote e clica em "Adicionar item"
- **THEN** o diálogo volta a exigir a seleção de uma data de emissão, liberando escolha de data diferente da anterior

#### Scenario: Reabertura do lote sem linhas residuais
- **WHEN** o ADM fecha o diálogo de lote com linhas preenchidas e o reabre
- **THEN** o diálogo abre sem linhas, valores ou data escolhida da abertura anterior
