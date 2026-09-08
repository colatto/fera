## Purpose

Define as operações do fluxo de projetos na interface — criação, envio, cancelamento, ordem de compra, autorização, nota fiscal, recebimentos e compatibilização — executadas exclusivamente pelas RPCs transacionais do banco, com feedback fiel do resultado.

## Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, responsável e predecessor opcional, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`.

#### Scenario: Criação válida
- **WHEN** o ADM cria um projeto com dados válidos
- **THEN** a interface exibe o código `F-AAAA-NNNN` reservado e o projeto aparece com status `CADASTRADO` e evento inicial na linha do tempo

#### Scenario: Erro da reserva de número
- **WHEN** a RPC rejeita a criação (por exemplo, faixa do tipo esgotada)
- **THEN** a interface exibe a mensagem de erro do banco e nenhum projeto é adicionado

### Requirement: Envio de projeto
A interface MUST oferecer envio a ADM e OPER somente para projeto em status `CADASTRADO` e ativo, usando a RPC `alterar_status_projeto` com gravação da data de envio.

#### Scenario: OPER envia projeto
- **WHEN** o OPER envia um projeto cadastrado
- **THEN** o status passa a `ENVIADO` com `data_envio` preenchida e evento registrado na linha do tempo

#### Scenario: Envio em status indevido
- **WHEN** a ação de envio é tentada em projeto fora de `CADASTRADO`
- **THEN** a RPC falha e a interface exibe o erro sem alterar o status

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

### Requirement: Ações financeiras exclusivas de ADM
Registrar ordem de compra (`registrar_ordem_compra`, `vincular_ordem_compra`), autorizar faturamento (`autorizar_faturamento`), registrar nota fiscal (`registrar_nota_fiscal`) e registrar recebimento (`registrar_recebimento`) MUST ser oferecidos somente na navegação do ADM; o sucesso de qualquer delas MUST refletir imediatamente em status, linha do tempo e dashboards, e a falha MUST exibir a mensagem transacional do banco sem alterar o estado exibido.

#### Scenario: ADM registra nota após autorização
- **WHEN** o ADM registra nota fiscal em projeto autorizado
- **THEN** o status passa a `NOTA_EMITIDA` e a nota aparece na linha do tempo com previsão de recebimento

#### Scenario: Ação fora de ordem
- **WHEN** o ADM tenta registrar nota sem autorização de faturamento
- **THEN** a RPC falha, a interface exibe o erro e nada é alterado no projeto

### Requirement: Recebimentos em lote
A interface MUST oferecer ao ADM o lançamento de recebimentos em lote pela RPC `confirmar_recebimentos_lote`; se qualquer nota ou parcela do lote falhar, a interface MUST informar falha integral sem aplicar nenhum recebimento, e o sucesso aplica todos os itens.

#### Scenario: Lote válido
- **WHEN** o ADM confirma lote com notas e parcelas válidas
- **THEN** todos os recebimentos são aplicados e quitação parcial/total reflete no projeto

#### Scenario: Lote com item inválido
- **WHEN** o lote contém uma parcela que excederia a nota
- **THEN** a operação falha integralmente, a interface informa e nenhum recebimento é aplicado

### Requirement: Compatibilização de fundação
A interface MUST oferecer ao ADM a marcação e desmarcação de compatibilização de fundação pela RPC `definir_compatibilizacao_fundacao`, com alteração auditada refletida no detalhe do projeto.

#### Scenario: Marcação auditada
- **WHEN** o ADM marca a compatibilização de um projeto
- **THEN** o detalhe passa a exibir a marcação com a alteração registrada em auditoria

### Requirement: Feedback transacional sem aplicação otimista
Toda ação do fluxo MUST exibir o resultado real da RPC: sucesso confirmado ou a mensagem de erro do banco; a interface MUST NOT aplicar mudança local de status, documento ou evento antes da confirmação da RPC.

#### Scenario: Falha de chamada
- **WHEN** uma ação do fluxo falha por erro de rede ou negação do banco
- **THEN** a interface exibe o erro e preserva integralmente o estado anterior
