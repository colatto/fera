## MODIFIED Requirements

### Requirement: Ações financeiras exclusivas de ADM
Registrar ordem de compra (`registrar_ordem_compra`, `vincular_ordem_compra`), autorizar faturamento (`autorizar_faturamento`), registrar nota fiscal (`registrar_nota_fiscal`) e registrar recebimento (`registrar_recebimento`) MUST ser oferecidos somente na navegação do ADM; o sucesso de qualquer delas MUST refletir imediatamente em status, linha do tempo e dashboards — sem recarregar a página nem navegar entre telas —, e a falha MUST exibir a mensagem transacional do banco sem alterar o estado exibido. A vinculação de ordem de compra em qualquer um dos modos do diálogo (vincular existente; registrar nova e vincular em seguida) MUST refletir imediatamente o status `OC_REGISTRADA`, o evento correspondente na linha do tempo e a OC na listagem de ordens de compra do próprio diálogo. Quando o registro da nova OC succeeds e a vinculação subsequente falha, a interface MUST exibir o erro da vinculação, o projeto MUST permanecer inalterado e a OC registrada MUST permanecer disponível para vinculação posterior pelo modo "Vincular existente".

#### Scenario: ADM registra nota após autorização
- **WHEN** o ADM registra nota fiscal em projeto autorizado
- **THEN** o status passa a `NOTA_EMITIDA` e a nota aparece na linha do tempo com previsão de recebimento

#### Scenario: Ação fora de ordem
- **WHEN** o ADM tenta registrar nota sem autorização de faturamento
- **THEN** a RPC falha, a interface exibe o erro e nada é alterado no projeto

#### Scenario: Vinculação de OC existente reflete imediatamente
- **WHEN** o ADM vincula, pelo modo "Vincular existente", uma OC a um projeto em status `ENVIADO`
- **THEN** o detalhe passa a exibir `OC_REGISTRADA`, a linha do tempo mostra o evento da transição e os dashboards refletem a mudança, tudo sem recarregar a página nem navegar entre telas

#### Scenario: Registro e vinculação de nova OC refletem imediatamente
- **WHEN** o ADM registra uma nova OC pelo modo "Registrar nova" e ela é vinculada com sucesso
- **THEN** o detalhe passa a exibir `OC_REGISTRADA` com a OC vinculada, e a OC criada aparece na listagem de ordens de compra do diálogo, tudo sem recarregar a página

#### Scenario: Falha na vinculação após registro de nova OC
- **WHEN** o registro da nova OC succeeds e a vinculação subsequente é recusada pelo banco (por exemplo, projeto fora de `ENVIADO`)
- **THEN** a interface exibe o erro da vinculação, o projeto permanece com status e dados inalterados, e a OC registrada permanece disponível na listagem para vinculação posterior

### Requirement: Recebimentos em lote
A interface MUST oferecer ao ADM o lançamento de recebimentos em lote pela RPC `confirmar_recebimentos_lote`; se qualquer nota ou parcela do lote falhar, a interface MUST informar falha integral sem aplicar nenhum recebimento, e o sucesso aplica todos os itens. O sucesso do lote MUST refletir imediatamente em status, linha do tempo e dashboards — sem recarregar a página nem navegar entre telas —, incluindo a transição para `PAGO` quando o lote quita integralmente a nota.

#### Scenario: Lote válido
- **WHEN** o ADM confirma lote com notas e parcelas válidas
- **THEN** todos os recebimentos são aplicados e quitação parcial/total reflete no projeto

#### Scenario: Lote com item inválido
- **WHEN** o lote contém uma parcela que excederia a nota
- **THEN** a operação falha integralmente, a interface informa e nenhum recebimento é aplicado

#### Scenario: Lote que quita a nota reflete imediatamente
- **WHEN** o ADM confirma um lote cuja última parcela quita integralmente a nota de um projeto
- **THEN** o status do projeto passa a `PAGO` e o evento da transição aparece na linha do tempo, sem recarregar a página
