## Purpose

Define as operações do fluxo de projetos na interface — criação, envio, cancelamento, ordem de compra, autorização, nota fiscal, recebimentos e compatibilização — executadas exclusivamente pelas RPCs transacionais do banco, com feedback fiel do resultado.

## Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, valor e responsável, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. O valor do projeto MUST ser informado, monetário e positivo, e MUST ser imutável após a criação: nenhuma ação de edição do valor é oferecida em nenhuma tela. O valor MUST NOT constar no evento de criação da linha do tempo. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`. A RPC `criar_projeto` MUST NOT aceitar parâmetro de projeto predecessor, e a interface MUST NOT oferecer campo de predecessor na criação.

#### Scenario: Criação válida
- **WHEN** o ADM cria um projeto com dados válidos, incluindo valor positivo
- **THEN** a interface exibe o código `F-AAAA-NNNN` reservado e o projeto aparece com status `CADASTRADO`, evento inicial na linha do tempo e valor gravado

#### Scenario: Valor ausente ou inválido
- **WHEN** o ADM tenta criar um projeto sem valor informado ou com valor que não seja número positivo
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

#### Scenario: Valor ausente da linha do tempo
- **WHEN** o ADM consulta a linha do tempo de um projeto recém-criado
- **THEN** o evento de criação não exibe o valor do projeto em nenhuma forma

#### Scenario: Erro da reserva de número
- **WHEN** a RPC rejeita a criação (por exemplo, faixa do tipo esgotada)
- **THEN** a interface exibe a mensagem de erro do banco e nenhum projeto é adicionado

#### Scenario: Formulário sem predecessor
- **WHEN** o ADM abre o formulário de novo projeto
- **THEN** nenhum campo de projeto predecessor é oferecido, e nenhum projeto cancelado é carregado para alimentá-lo

### Requirement: Imutabilidade do valor do projeto
O valor do projeto MUST ser definido exclusivamente na criação e MUST NOT ser alterado posteriormente por nenhuma operação do fluxo (envio, cancelamento, ordem de compra, autorização, nota fiscal, recebimentos ou compatibilização); cancelamento de projeto MUST NOT zerar, alterar nem remover o valor gravado.

#### Scenario: Projeto cancelado preserva o valor
- **WHEN** um projeto com valor gravado é cancelado
- **THEN** o valor permanece o mesmo gravado na criação para consulta do ADM

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

### Requirement: Valor da nota fiscal derivado do projeto
O registro de nota fiscal MUST usar exclusivamente o valor do projeto: a RPC `registrar_nota_fiscal` MUST derivar o valor da nota de `projeto.valor` e MUST NOT aceitar valor informado pelo cliente (nenhuma assinatura da RPC recebe parâmetro de valor). A nota criada MUST ficar com valor igual ao valor gravado do projeto. O diálogo "Registrar nota fiscal" MUST exibir o valor do projeto como texto somente leitura, formatado em moeda, e MUST NOT oferecer campo editável de valor; a habilitação do registro MUST depender apenas de número e data de emissão preenchidos. As regras existentes do registro (exigir ADM, exigir status `AUTORIZADO_FATURAMENTO`, unicidade do número, transição para `NOTA_EMITIDA` com evento) permanecem inalteradas.

#### Scenario: Diálogo exibe o valor do projeto como somente leitura
- **WHEN** o ADM abre o diálogo "Registrar nota fiscal" em um projeto autorizado
- **THEN** o diálogo exibe o valor do projeto como texto formatado em moeda, não oferece campo editável de valor, e o botão de registro habilita com número e data de emissão preenchidos

#### Scenario: Nota registrada fica com o valor do projeto
- **WHEN** o ADM registra uma nota fiscal com número e data válidos
- **THEN** a nota é criada com valor igual ao valor gravado do projeto, o status passa a `NOTA_EMITIDA` e a linha do tempo exibe a nota com esse valor e a previsão de recebimento

#### Scenario: RPC não aceita valor do cliente
- **WHEN** uma chamada à RPC `registrar_nota_fiscal` tenta informar um argumento de valor
- **THEN** a chamada falha por ausência de assinatura compatível e nenhuma nota é criada, permanecendo o projeto em `AUTORIZADO_FATURAMENTO`

#### Scenario: Recebimentos limitados ao valor do projeto
- **WHEN** a nota derivada do projeto está emitida e o ADM lança recebimentos até a quitação
- **THEN** o total recebido não pode exceder o valor do projeto, e a parcela que o atinge integralmente transiciona o projeto para `PAGO`

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

### Requirement: Datas de negócio com default no fuso local
Os diálogos do fluxo que pré-preenchem uma data de negócio (ordem de compra, nota fiscal e recebimentos em lote) MUST usar como default a data corrente no fuso local do usuário e MUST NOT derivar esse default de uma representação UTC; o valor informado pelo usuário prevalece sobre o default.

#### Scenario: Registro de OC no fim da noite
- **WHEN** o ADM abre o modo "Registrar nova" do diálogo de ordem de compra entre 21h e meia-noite no fuso local
- **THEN** a data pré-preenchida é a data corrente local, e não a data de amanhã

#### Scenario: Defaults dos demais diálogos de data
- **WHEN** o ADM abre os diálogos de nota fiscal e de recebimentos em lote
- **THEN** as datas pré-preenchidas também correspondem à data corrente local

#### Scenario: Valor informado prevalece
- **WHEN** o ADM altera a data pré-preenchida antes de confirmar
- **THEN** a data alterada é a gravada, sem sobreposição pelo default
