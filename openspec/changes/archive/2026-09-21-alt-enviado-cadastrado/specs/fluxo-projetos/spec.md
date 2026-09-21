## ADDED Requirements

### Requirement: Reversão de envio para cadastrado
A interface MUST oferecer a ação "Cancelar envio" a ADM e OPER somente para projeto em status `ENVIADO`, posicionada à esquerda do botão "Ordem de compra" no detalhe do projeto, com diálogo de confirmação antes da execução. A reversão MUST usar a RPC `alterar_status_projeto` com destino `CADASTRADO`, sem motivo, e MUST limpar `data_envio` junto com a mudança de status numa única transação. A RPC MUST recusar a transição para `CADASTRADO` a partir de qualquer status diferente de `ENVIADO` com erro transacional, sem alterar o projeto. A reversão MUST registrar o evento `Alteração de status` (`ENVIADO → CADASTRADO`) na linha do tempo, sem motivo. Com sucesso, o status, a data de envio, a linha do tempo, a listagem e os dashboards MUST refletir imediatamente o resultado — sem recarregar a página nem navegar entre telas —, e as ações exclusivas de `CADASTRADO` (enviar, editar, cancelar) voltam a ser oferecidas. O re-envio posterior MUST gravar nova data de envio, sem reaproveitar a data anterior.

#### Scenario: Reversão válida por ADM ou OPER
- **WHEN** o usuário confirma o diálogo "Cancelar envio" de um projeto em status `ENVIADO`
- **THEN** o status volta a `CADASTRADO`, `data_envio` fica vazia e a linha do tempo registra o evento `ENVIADO → CADASTRADO` com autor e data, sem motivo

#### Scenario: Ações de CADASTRADO voltam a ser oferecidas
- **WHEN** a reversão é confirmada com sucesso
- **THEN** o detalhe passa a oferecer "Enviar projeto", "Editar" (ADM) e "Cancelar projeto", e deixa de oferecer "Cancelar envio" e "Ordem de compra"

#### Scenario: Confirmação obrigatória
- **WHEN** o usuário clica em "Cancelar envio"
- **THEN** um diálogo de confirmação abre e nenhuma chamada à RPC ocorre antes da confirmação

#### Scenario: Dashboards e listagem refletem a reversão
- **WHEN** um projeto com `data_envio` dentro do período é revertido para `CADASTRADO`
- **THEN** ele deixa de contar em "Enviados no período" e em "Enviados sem OC", e a coluna "Envio" da listagem e o campo "Data de envio" do detalhe passam a exibir vazio

#### Scenario: Re-envio após reversão grava nova data
- **WHEN** um projeto revertido para `CADASTRADO` é enviado novamente
- **THEN** o status passa a `ENVIADO` com a data de envio da nova operação, e a linha do tempo acumula os dois eventos de status

#### Scenario: Ação indisponível fora de ENVIADO
- **WHEN** o usuário abre o detalhe de um projeto com status `CADASTRADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO` ou `CANCELADO`
- **THEN** a interface não oferece a ação "Cancelar envio", mantendo as demais ações do status

#### Scenario: RPC recusa reversão fora de ENVIADO
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita `CADASTRADO` para projeto em status diferente de `ENVIADO`
- **THEN** a RPC falha com erro transacional informando que a reversão exige status `ENVIADO`, e o status, a `data_envio`, a linha do tempo e os dados do projeto permanecem inalterados
