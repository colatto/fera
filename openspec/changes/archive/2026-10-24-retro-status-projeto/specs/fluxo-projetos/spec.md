# Spec Delta

## MODIFIED Requirements

### Requirement: Vínculo de ordem de compra aplica o centro de custo do projeto
`vincular_ordem_compra` MUST aceitar um centro de custo opcional e aplicar vínculo da OC e centro de custo do projeto numa única transação, somente para projeto em status `ENVIADO`: em caso de sucesso, o projeto passa a `OC_REGISTRADA` com a OC vinculada e o centro de custo gravado no projeto, com o evento correspondente na linha do tempo; em caso de falha de qualquer etapa, nada é aplicado. O centro de custo gravado no vínculo MUST ser imutável enquanto a OC permanecer vinculada: nenhuma operação do fluxo MUST alterá-lo ou removê-lo, e a única liberação é a reversão de OC para `ENVIADO` (requisito "Reversão de OC para enviado"), que desvincula a OC e limpa o centro de custo do projeto na mesma transação. Quando o registro da nova OC succeed e a vinculação subsequente falha (inclusive por centro de custo duplicado), a OC registrada MUST permanecer disponível para vinculação posterior pelo modo "Vincular existente".

#### Scenario: Vincular existente com centro de custo
- **WHEN** o ADM, no diálogo de ordem de compra de um projeto em `ENVIADO`, escolhe o modo "Vincular existente", seleciona uma OC, informa um centro de custo ainda não usado e confirma
- **THEN** a OC é vinculada e o centro de custo é gravado no projeto numa única transação, o detalhe passa a exibir `OC_REGISTRADA` com o evento na linha do tempo, e o CC informado aparece associado ao projeto

#### Scenario: Vincular existente sem centro de custo
- **WHEN** o ADM vincula uma OC existente sem informar centro de custo
- **THEN** o vínculo ocorre normalmente e o projeto permanece sem centro de custo

#### Scenario: Registrar nova com centro de custo no mesmo campo
- **WHEN** o ADM registra uma nova ordem de compra informando o centro de custo no campo único do diálogo
- **THEN** a OC é criada sem centro de custo e o vínculo subsequente grava o centro de custo no projeto — o comportamento é o mesmo do modo "Vincular existente"

#### Scenario: Vínculo falha por centro de custo duplicado
- **WHEN** o ADM vincula uma OC informando um centro de custo já pertencente a outro projeto
- **THEN** a operação falha transacionalmente: o projeto permanece em `ENVIADO` sem OC nem centro de custo, e a interface exibe mensagem amigável indicando a duplicidade

#### Scenario: Centro de custo imutável após o vínculo
- **WHEN** o projeto está em `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` ou `PAGO`
- **THEN** nenhuma ação do fluxo altera ou remove o centro de custo gravado no projeto; ele somente é liberado pela reversão de OC para `ENVIADO`, que desvincula a OC e limpa o centro na mesma transação

## ADDED Requirements

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
- **WHEN** o projeto está em status `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` ou `PAGO`
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
