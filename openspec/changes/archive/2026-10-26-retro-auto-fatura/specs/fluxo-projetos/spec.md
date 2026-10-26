# Spec Delta

## MODIFIED Requirements

### Requirement: Reversão de OC para enviado
A interface MUST oferecer a ação "Cancelar vínculo de OC" somente ao ADM e somente para projeto em status `OC_REGISTRADA`, com diálogo de confirmação antes da execução. A reversão MUST usar a RPC `alterar_status_projeto` com destino `ENVIADO`, sem motivo, e MUST desvincular a ordem de compra, limpar o centro de custo e mudar o status numa única transação, preservando `data_envio`.

#### Scenario: Reversão válida por ADM
- **WHEN** o ADM confirma o diálogo "Cancelar vínculo de OC" de um projeto em status `OC_REGISTRADA`
- **THEN** o status volta a `ENVIADO`, a OC é desvinculada, o centro de custo do projeto é limpo, `data_envio` permanece preenchida e a linha do tempo registra o evento `OC_REGISTRADA → ENVIADO` com autor e data, sem motivo

#### Scenario: Confirmação obrigatória
- **WHEN** o ADM clica em "Cancelar vínculo de OC"
- **THEN** um diálogo de confirmação abre e nenhuma chamada à RPC ocorre antes da confirmação

#### Scenario: Ações de ENVIADO voltam a ser oferecidas
- **WHEN** a reversão é confirmada com sucesso
- **THEN** o detalhe passa a oferecer "Cancelar envio" e "Ordem de compra" (ADM), e deixa de oferecer "Cancelar vínculo de OC" e "Autorizar faturamento"

#### Scenario: OC desvinculada permanece reaproveitável
- **WHEN** a reversão é confirmada e o ADM abre o diálogo "Ordem de compra" em qualquer projeto
- **THEN** a OC desvinculada permanece registrada no sistema e selecionável no modo "Vincular existente"

#### Scenario: Centro de custo liberado para outros projetos
- **WHEN** a reversão limpa o centro de custo de um projeto
- **THEN** o mesmo centro de custo pode ser gravado em vinculação de outro projeto

#### Scenario: Re-vinculação após reversão
- **WHEN** o ADM vincula uma OC — a mesma ou outra, com centro de custo novo — ao projeto revertido
- **THEN** o status volta a `OC_REGISTRADA` com a OC e o centro da nova vinculação, e a linha do tempo acumula os eventos das duas transições

#### Scenario: Ação exclusiva de ADM
- **WHEN** um usuário OPER consulta o detalhe de um projeto em status `OC_REGISTRADA`
- **THEN** a ação "Cancelar vínculo de OC" não é oferecida, mantendo as demais ações do status

#### Scenario: Ação indisponível fora de OC_REGISTRADA
- **WHEN** o ADM abre o detalhe de um projeto com status `CADASTRADO`, `ENVIADO`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO` ou `CANCELADO`
- **THEN** a interface não oferece a ação "Cancelar vínculo de OC", mantendo as demais ações do status

#### Scenario: Nenhum retrocesso a partir da autorização
- **WHEN** o projeto está em status `NOTA_EMITIDA` ou `PAGO`
- **THEN** nenhuma ação de retrocesso de status é oferecida ao usuário

#### Scenario: Dashboards e listagem refletem a reversão
- **WHEN** um projeto com `data_envio` dentro do período é revertido de `OC_REGISTRADA` para `ENVIADO`
- **THEN** ele volta a contar em "Enviados no período" e em "Enviados sem OC", e a OC e o centro de custo deixam de ser exibidos no detalhe e na listagem

#### Scenario: RPC recusa reversão fora de OC_REGISTRADA
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita `ENVIADO` para projeto em status diferente de `OC_REGISTRADA` e `CADASTRADO`
- **THEN** a RPC falha com erro transacional informando que a reversão exige status `OC_REGISTRADA`, e o status, a OC vinculada, o centro de custo, a linha do tempo e os dados do projeto permanecem inalterados

#### Scenario: RPC recusa não ADM
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita a reversão de OC por usuário sem perfil ADM
- **THEN** a RPC falha com erro transacional de permissão e nenhum dado é alterado

## ADDED Requirements

### Requirement: Reversão da autorização de faturamento
A interface MUST oferecer a ação "Cancelar autorização de faturamento" somente ao ADM e somente para projeto em status `AUTORIZADO_FATURAMENTO`, com diálogo de confirmação antes da execução. A reversão MUST usar a RPC `alterar_status_projeto` com destino `OC_REGISTRADA`, sem motivo, e MUST apagar o registro da autorização em `autorizacao_faturamento` e mudar o status numa única transação.

#### Scenario: Reversão válida por ADM
- **WHEN** o ADM confirma o diálogo "Cancelar autorização de faturamento" de um projeto em status `AUTORIZADO_FATURAMENTO`
- **THEN** o status volta a `OC_REGISTRADA`, o registro da autorização é apagado de `autorizacao_faturamento`, a OC vinculada, o centro de custo, `data_envio` e o valor do projeto permanecem intactos, e a linha do tempo registra o evento `AUTORIZADO_FATURAMENTO → OC_REGISTRADA` com autor e data, sem motivo

#### Scenario: Confirmação obrigatória
- **WHEN** o ADM clica em "Cancelar autorização de faturamento"
- **THEN** um diálogo de confirmação abre e nenhuma chamada à RPC ocorre antes da confirmação

#### Scenario: Ações de OC_REGISTRADA voltam a ser oferecidas
- **WHEN** a reversão é confirmada com sucesso
- **THEN** o detalhe passa a oferecer "Cancelar vínculo de OC" e "Autorizar faturamento", e deixa de oferecer "Cancelar autorização de faturamento" e "Registrar nota fiscal"

#### Scenario: Autorização apagada sai da exibição
- **WHEN** a reversão é confirmada com sucesso
- **THEN** o detalhe e a listagem deixam de exibir quem autorizou e quando, e o item "Autorização de faturamento" sai da linha do tempo de documentos

#### Scenario: Re-autorização após reversão
- **WHEN** o ADM autoriza o faturamento novamente em um projeto revertido
- **THEN** o status volta a `AUTORIZADO_FATURAMENTO` com novo registro de autorização — novo autor e nova data —, a linha do tempo acumula as transições e a autorização volta a constar na linha do tempo de documentos

#### Scenario: Ação exclusiva de ADM
- **WHEN** um usuário OPER consulta o detalhe de um projeto em status `AUTORIZADO_FATURAMENTO`
- **THEN** a ação "Cancelar autorização de faturamento" não é oferecida, mantendo as demais ações do status

#### Scenario: Ação indisponível fora de AUTORIZADO_FATURAMENTO
- **WHEN** o ADM abre o detalhe de um projeto com status `CADASTRADO`, `ENVIADO`, `OC_REGISTRADA`, `NOTA_EMITIDA`, `PAGO` ou `CANCELADO`
- **THEN** a interface não oferece a ação "Cancelar autorização de faturamento", mantendo as demais ações do status

#### Scenario: Dashboards refletem a reversão
- **WHEN** um projeto em `AUTORIZADO_FATURAMENTO` é revertido para `OC_REGISTRADA`
- **THEN** o dashboard operacional passa a contá-lo pela nova transição na linha do tempo e o dashboard financeiro permanece inalterado, pois nenhum valor faturado é tocado

#### Scenario: RPC recusa reversão fora de AUTORIZADO_FATURAMENTO
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita `OC_REGISTRADA` para projeto em status diferente de `AUTORIZADO_FATURAMENTO`
- **THEN** a RPC falha com erro transacional informando que a reversão exige status `AUTORIZADO_FATURAMENTO`, e o status, o registro de autorização, a linha do tempo e os dados do projeto permanecem inalterados

#### Scenario: RPC recusa não ADM
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita a reversão da autorização por usuário sem perfil ADM
- **THEN** a RPC falha com erro transacional de permissão e nenhum dado é alterado
