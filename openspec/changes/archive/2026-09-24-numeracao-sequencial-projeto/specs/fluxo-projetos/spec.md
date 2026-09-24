## MODIFIED Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, valor e responsável, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. O seletor de tipo MUST exibir apenas o nome do tipo, sem próximo número nem faixa. O valor do projeto MUST ser informado, monetário e positivo, e MUST ser imutável após a criação: nenhuma ação de edição do valor é oferecida em nenhuma tela. O valor MUST NOT constar no evento de criação da linha do tempo. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`. A RPC `criar_projeto` MUST NOT aceitar parâmetro de projeto predecessor, e a interface MUST NOT oferecer campo de predecessor na criação.

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

## ADDED Requirements

### Requirement: Numeração sequencial anual do projeto
O número do projeto MUST ser alocado de uma sequência global anual compartilhada por todos os tipos de projeto: o primeiro projeto criado em cada ano MUST receber número `0001` (código `F-AAAA-0001`) e cada projeto seguinte no mesmo ano MUST receber o número sequencial seguinte, sem reinício por tipo de projeto e sem lacunas causadas pelo tipo. O tipo de projeto selecionado MUST NOT influenciar o número nem o código gerado. A alocação MUST ocorrer na mesma transação da criação: criações concorrentes MUST NOT receber o mesmo número no mesmo ano, e uma criação que falhe MUST NOT consumir o número reservado. A unicidade do par ano e número MUST ser garantida pelo banco.

#### Scenario: Primeiro projeto do ano
- **WHEN** o ADM cria o primeiro projeto do ano corrente, com qualquer tipo de projeto
- **THEN** o projeto recebe o código `F-AAAA-0001`

#### Scenario: Sequência única entre tipos
- **WHEN** o ADM cria, no mesmo ano, projetos de tipos diferentes em sequência
- **THEN** os números seguem uma única sequência global (por exemplo, `0001`, `0002`, `0003`), sem reinício nem lacuna ao trocar o tipo

#### Scenario: Novo ano reinicia a sequência
- **WHEN** o primeiro projeto de um novo ano é criado
- **THEN** ele recebe o número `0001`, com o código iniciado pelo ano novo

#### Scenario: Criações concorrentes não duplicam número
- **WHEN** dois usuários ADM criam projetos simultaneamente no mesmo ano
- **THEN** cada projeto recebe um número distinto da sequência e nenhum número é duplicado

#### Scenario: Falha de criação não consome número
- **WHEN** a RPC falha após reservar o número (por exemplo, por violação de unicidade) ou é recusada antes da reserva
- **THEN** o número reservado não é consumido pela tentativa mal-sucedida, e o próximo projeto criado recebe o número seguinte da sequência vigente, sem lacuna
