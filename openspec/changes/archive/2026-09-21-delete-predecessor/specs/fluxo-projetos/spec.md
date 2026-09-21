## MODIFIED Requirements

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
