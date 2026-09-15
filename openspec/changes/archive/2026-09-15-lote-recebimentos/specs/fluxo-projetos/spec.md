## MODIFIED Requirements

### Requirement: Recebimentos em lote
A interface MUST oferecer ao ADM o lançamento de recebimentos em lote pela RPC `confirmar_recebimentos_lote`, por meio do botão "Lote de recebimentos" posicionado exclusivamente no cabeçalho da página de listagem de projetos, sem vínculo a projeto específico. O botão MUST ser exibido apenas para o perfil ADM e MUST estar sempre presente nessa página, sem condicionamento a status de projeto; o detalhe do projeto MUST NOT oferecer a entrada do lote. Quando não houver notas com saldo em aberto, o clique no botão MUST exibir o aviso "Nenhuma nota pendente de recebimento" sem abrir o diálogo de lote. Se qualquer nota ou parcela do lote falhar, a interface MUST informar falha integral sem aplicar nenhum recebimento, e o sucesso aplica todos os itens. O sucesso do lote MUST refletir imediatamente em status, linha do tempo e dashboards — sem recarregar a página nem navegar entre telas —, incluindo a transição para `PAGO` quando o lote quita integralmente a nota.

#### Scenario: Entrada exclusiva na listagem de projetos
- **WHEN** o ADM acessa a página de listagem de projetos
- **THEN** o botão "Lote de recebimentos" está presente no cabeçalho, independentemente do status dos projetos listados, e o detalhe de um projeto não oferece o botão

#### Scenario: Botão restrito ao ADM
- **WHEN** um usuário de perfil operacional acessa a listagem de projetos
- **THEN** o botão "Lote de recebimentos" não é exibido

#### Scenario: Clique sem notas pendentes
- **WHEN** o ADM clica em "Lote de recebimentos" e não há notas com saldo em aberto
- **THEN** a interface exibe o aviso "Nenhuma nota pendente de recebimento" e o diálogo de lote não abre

#### Scenario: Lote válido
- **WHEN** o ADM confirma lote com notas e parcelas válidas
- **THEN** todos os recebimentos são aplicados e quitação parcial/total reflete no projeto

#### Scenario: Lote com item inválido
- **WHEN** o lote contém uma parcela que excederia a nota
- **THEN** a operação falha integralmente, a interface informa e nenhum recebimento é aplicado

#### Scenario: Lote que quita a nota reflete imediatamente
- **WHEN** o ADM confirma um lote cuja última parcela quita integralmente a nota de um projeto
- **THEN** o status do projeto passa a `PAGO` e o evento da transição aparece na linha do tempo, sem recarregar a página
