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

### Requirement: Unicidade do número da ordem de compra
Cada ordem de compra MUST ter `numero` único no sistema, e o registro de uma nova ordem de compra (`registrar_ordem_compra`) com número já existente MUST falhar transacionalmente sem criar a ordem nem alterar o projeto. O número MUST ser armazenado sem espaços nas pontas; tentativa de registrar número com espaços nas pontas MUST falhar transacionalmente. A falha MUST ser exibida na interface como mensagem amigável que identifique o número duplicado, sem alterar o estado exibido. Vincular uma ordem de compra já existente a outro projeto (`vincular_ordem_compra`) MUST continuar permitido, pois o reuso de uma mesma OC por vários projetos ocorre pela vinculação, não pelo registro de nova OC.

#### Scenario: Registro de OC com número inédito
- **WHEN** o ADM registra uma nova OC com número que não existe no sistema
- **THEN** a OC é criada e vinculada ao projeto conforme o fluxo atual

#### Scenario: Registro de OC com número duplicado
- **WHEN** o ADM registra uma nova OC com número igual ao de uma OC já existente
- **THEN** a operação falha transacionalmente, nenhuma OC é criada, e a interface exibe mensagem amigável indicando que já existe ordem de compra com aquele número

#### Scenario: Número com espaços nas pontas
- **WHEN** uma chamada à RPC `registrar_ordem_compra` recebe número com espaços no início ou no fim
- **THEN** a operação falha transacionalmente e nenhuma OC é criada

#### Scenario: Reuso de OC existente por outro projeto
- **WHEN** o ADM vincula, pelo modo "Vincular existente", uma OC já registrada a outro projeto
- **THEN** a vinculação ocorre normalmente, sem exigir registro de nova OC

### Requirement: Unicidade do número da nota fiscal
Cada nota fiscal MUST ter `numero` único no sistema, e o registro de nota fiscal (`registrar_nota_fiscal`) com número já existente — inclusive em projeto diferente — MUST falhar transacionalmente sem criar a nota nem alterar o projeto. O número MUST ser armazenado sem espaços nas pontas; tentativa de registrar número com espaços nas pontas MUST falhar transacionalmente. A falha MUST ser exibida na interface como mensagem amigável que identifique o número duplicado, sem alterar o estado exibido do projeto.

#### Scenario: Registro de nota com número inédito
- **WHEN** o ADM registra uma nota fiscal com número que não existe no sistema
- **THEN** a nota é criada e o fluxo segue como hoje: status passa a `NOTA_EMITIDA` com evento na linha do tempo

#### Scenario: Registro de nota com número duplicado em outro projeto
- **WHEN** o ADM registra uma nota fiscal com número igual ao de uma nota já existente em outro projeto
- **THEN** a operação falha transacionalmente, nenhuma nota é criada, o projeto permanece em `AUTORIZADO_FATURAMENTO`, e a interface exibe mensagem amigável indicando que já existe nota fiscal com aquele número

#### Scenario: Número com espaços nas pontas
- **WHEN** uma chamada à RPC `registrar_nota_fiscal` recebe número com espaços no início ou no fim
- **THEN** a operação falha transacionalmente e nenhuma nota é criada

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
