# Spec Delta

## MODIFIED Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, valor e responsável, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. O seletor de tipo MUST exibir apenas o nome do tipo, sem próximo número nem faixa. O valor do projeto MUST ser informado, monetário e positivo; sua alteração posterior rege-se pelo requisito "Imutabilidade do valor do projeto". O valor MUST NOT constar no evento de criação da linha do tempo. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`. A RPC `criar_projeto` MUST NOT aceitar parâmetro de projeto predecessor, e a interface MUST NOT oferecer campo de predecessor na criação.

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
- **WHEN** a RPC rejeita a criação (por exemplo, tipo inexistente ou inativo, cliente inexistente ou inativo)
- **THEN** a interface exibe a mensagem de erro do banco e nenhum projeto é adicionado

#### Scenario: Formulário sem predecessor
- **WHEN** o ADM abre o formulário de novo projeto
- **THEN** nenhum campo de projeto predecessor é oferecido, e nenhum projeto cancelado é carregado para alimentá-lo

#### Scenario: Seletor de tipo sem dados de numeração
- **WHEN** o ADM abre o seletor de tipo de projeto no formulário de novo projeto
- **THEN** as opções exibem apenas o nome do tipo, sem próximo número nem faixa

### Requirement: Imutabilidade do valor do projeto
O valor do projeto MUST ser definido na criação e MUST poder ser alterado exclusivamente enquanto o projeto estiver em status `CADASTRADO`, somente por ADM pela ação de edição do detalhe (requisito "Edição de identificadores em CADASTRADO"). Fora dessa janela, o valor MUST NOT ser alterado por nenhuma operação do fluxo (envio, cancelamento, ordem de compra, autorização, nota fiscal, recebimentos ou compatibilização); cancelamento de projeto MUST NOT zerar, alterar nem remover o valor gravado.

#### Scenario: Projeto cancelado preserva o valor
- **WHEN** um projeto com valor gravado é cancelado
- **THEN** o valor permanece o vigente antes do cancelamento, sem zerar nem remover, para consulta do ADM

#### Scenario: Valor corrigido na janela CADASTRADO
- **WHEN** o ADM altera o valor de um projeto em status `CADASTRADO` pela ação "Editar" do detalhe
- **THEN** o novo valor passa a vigorar no projeto e a alteração fica registrada na linha do tempo

#### Scenario: Valor imutável fora de CADASTRADO
- **WHEN** qualquer operação do fluxo é executada em projeto fora de `CADASTRADO` (envio, ordem de compra, autorização, nota, recebimento, compatibilização ou cancelamento)
- **THEN** o valor do projeto permanece o vigente, sem alteração

### Requirement: Edição de identificadores em CADASTRADO
A interface MUST oferecer a ação "Editar" na tela de detalhe somente para projeto em status `CADASTRADO` e somente ao ADM, abrindo diálogo com os campos "Identificador do cliente" e "Identificador da operadora" pré-preenchidos com os valores atuais, o campo opcional "Pasta local" pré-preenchido com o caminho vigente, quando existir, e o campo "Valor (R$)" pré-preenchido com o valor vigente. A edição MUST abranger apenas o texto desses dois identificadores, a pasta local e o valor do projeto: cliente e operadora vinculadas e os demais dados do projeto MUST NOT ser alteráveis por essa ação. A interface MUST validar localmente que ambos os identificadores, após remoção de espaços das pontas, não estejam vazios, e que o valor submetido seja monetário e positivo, antes de chamar a RPC `editar_identificadores_projeto`. A pasta local, quando preenchida, MUST ser aparada nas pontas e MUST corresponder a um caminho Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida, sem caracteres de controle; caminho que não atenda a isso MUST ser bloqueado localmente. Deixar o campo da pasta vazio MEANS limpar a pasta local do projeto; a pasta é opcional e sua ausência MUST NOT impedir a confirmação do diálogo.

A RPC `editar_identificadores_projeto` MUST ser transacional, MUST exigir perfil ADM e status `CADASTRADO` e MUST atualizar os dois identificadores, a pasta local e o valor do projeto em uma única operação: parâmetro de pasta ausente preserva o valor vigente, vazio limpa, e caminho inválido informado é recusado; parâmetro de valor ausente preserva o valor vigente, e valor informado que não seja positivo é recusado. Com sucesso, o projeto MUST registrar na linha do tempo um evento `Alteração cadastral` quando identificadores ou pasta mudarem e um evento `Alteração do valor` quando o valor mudar, cada um com o registro de quem alterou e quando, sem detalhes dos valores; um envio que altere os dois aspectos grava um evento de cada natureza. Os dados atualizados MUST refletir imediatamente no detalhe, na listagem (identificadores e valor do ADM) e na linha do tempo. O evento `Alteração do valor` MUST constar na linha do tempo também para OPER, apenas como rótulo, sem qualquer montante. Quando os dois identificadores, a pasta e o valor submetidos forem todos idênticos aos vigentes, a RPC MUST NOT alterar o projeto nem gravar evento.

#### Scenario: Edição válida por ADM
- **WHEN** o ADM abre o detalhe de um projeto em status `CADASTRADO`, clica em "Editar", altera um dos identificadores e confirma
- **THEN** os dois identificadores são atualizados e o projeto registra um único evento "Alteração cadastral" na linha do tempo

#### Scenario: Edição define a pasta local
- **WHEN** o ADM confirma o diálogo preenchendo a Pasta local com um caminho Windows válido, com ou sem alteração nos identificadores
- **THEN** o caminho é gravado junto com os identificadores na mesma operação e passa a constar no detalhe, com um único evento "Alteração cadastral"

#### Scenario: Campo da pasta vazio limpa a pasta local
- **WHEN** o ADM confirma o diálogo deixando a Pasta local vazia em um projeto que a possui
- **THEN** a pasta local deixa de estar definida e o detalhe passa a indicar a ausência, com um único evento "Alteração cadastral"

#### Scenario: Pasta local com formato inválido
- **WHEN** o ADM informa um caminho que não inicia por letra de unidade com dois-pontos e barra invertida (por exemplo `Projetos/F-2026-0042`) ou contém caracteres de controle
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

#### Scenario: Valor corrigido pelo ADM
- **WHEN** o ADM altera o campo "Valor (R$)" do diálogo de um projeto em `CADASTRADO` e confirma
- **THEN** o valor do projeto é atualizado e reflete no detalhe e na listagem de ADM, e a linha do tempo registra um único evento "Alteração do valor", sem detalhes dos montantes

#### Scenario: Valor inválido bloqueado localmente
- **WHEN** o ADM submete o diálogo com o valor vazio, zero, negativo ou não numérico
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

#### Scenario: Mudança cadastral e de valor no mesmo envio
- **WHEN** o ADM altera um identificador e o valor no mesmo envio do diálogo
- **THEN** a RPC grava um evento "Alteração cadastral" e um evento "Alteração do valor", um por natureza da mudança

#### Scenario: OPER vê a alteração de valor na linha do tempo
- **WHEN** a OPER consulta a linha do tempo de um projeto que teve o valor alterado
- **THEN** o evento "Alteração do valor" aparece com autor e data, sem qualquer montante

#### Scenario: Reflexo imediato dos valores editados
- **WHEN** a edição é confirmada com sucesso
- **THEN** os novos identificadores e o novo valor aparecem no detalhe e na listagem de ADM, a pasta atualizada aparece no detalhe, e os eventos com autor e data aparecem na linha do tempo sem recarregar a página

#### Scenario: Campo de identificador vazio ou só de espaços
- **WHEN** o ADM submete o diálogo com algum identificador vazio ou composto apenas de espaços
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC, independentemente do conteúdo do campo da pasta

#### Scenario: Botão indisponível fora de CADASTRADO
- **WHEN** o ADM abre o detalhe de um projeto com status `ENVIADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO` ou `CANCELADO`
- **THEN** a interface não oferece a ação "Editar", mantendo as demais ações do status

#### Scenario: RPC recusa não ADM
- **WHEN** uma chamada à RPC `editar_identificadores_projeto` é feita por usuário sem perfil ADM
- **THEN** a RPC falha com erro transacional de permissão e nenhum dado é alterado

#### Scenario: RPC recusa fora de CADASTRADO
- **WHEN** uma chamada à RPC `editar_identificadores_projeto` solicita edição para projeto em status diferente de `CADASTRADO`
- **THEN** a RPC falha com erro transacional informando que a edição exige status `CADASTRADO`, e os dados e a linha do tempo permanecem inalterados

#### Scenario: Submissão sem alteração efetiva
- **WHEN** o ADM confirma o diálogo com os dois identificadores, a pasta e o valor idênticos aos vigentes
- **THEN** a RPC não altera o projeto e não grava evento, e a linha do tempo permanece como estava

#### Scenario: Cliente e operadora vinculadas preservadas
- **WHEN** o ADM edita os identificadores de um projeto
- **THEN** o cliente e a operadora vinculadas ao projeto permanecem os mesmos antes e depois da edição
