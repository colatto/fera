## MODIFIED Requirements

### Requirement: Cancelamento com motivo
A interface MUST exigir motivo para cancelar projeto, ADM e OPER, e MUST oferecer a ação de cancelamento somente para projeto em status `CADASTRADO`, usando a RPC `alterar_status_projeto`; a RPC MUST recusar a transição para `CANCELADO` a partir de qualquer outro status (`ENVIADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO`) com erro transacional, sem alterar o projeto. Cancelado com sucesso, o projeto é finalizado como `CANCELADO` e a interface MUST NOT oferecer novas ações de fluxo ou de documentos para ele.

#### Scenario: Cancelamento válido
- **WHEN** o usuário cancela um projeto em status `CADASTRADO` informando motivo
- **THEN** o status passa a `CANCELADO` com evento registrado e as ações de fluxo deixam de ser oferecidas

#### Scenario: Motivo ausente
- **WHEN** a tentativa de cancelamento não informa motivo
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

#### Scenario: Ação indisponível fora de CADASTRADO
- **WHEN** o usuário abre o detalhe de um projeto com status `ENVIADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` ou `PAGO`
- **THEN** a interface não oferece a ação de cancelamento, mantendo as demais ações do status

#### Scenario: RPC recusa cancelamento fora de CADASTRADO
- **WHEN** uma chamada à RPC `alterar_status_projeto` solicita `CANCELADO` para projeto em status diferente de `CADASTRADO`
- **THEN** a RPC falha com erro transacional informando que o cancelamento exige status `CADASTRADO`, e o status, a linha do tempo e os dados do projeto permanecem inalterados
