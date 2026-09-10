## MODIFIED Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, valor, responsável e predecessor opcional, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. O valor do projeto MUST ser informado, monetário e positivo, e MUST ser imutável após a criação: nenhuma ação de edição do valor é oferecida em nenhuma tela. O valor MUST NOT constar no evento de criação da linha do tempo. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`.

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

## ADDED Requirements

### Requirement: Imutabilidade do valor do projeto
O valor do projeto MUST ser definido exclusivamente na criação e MUST NOT ser alterado posteriormente por nenhuma operação do fluxo (envio, cancelamento, ordem de compra, autorização, nota fiscal, recebimentos ou compatibilização); cancelamento de projeto MUST NOT zerar, alterar nem remover o valor gravado.

#### Scenario: Projeto cancelado preserva o valor
- **WHEN** um projeto com valor gravado é cancelado
- **THEN** o valor permanece o mesmo gravado na criação para consulta do ADM
