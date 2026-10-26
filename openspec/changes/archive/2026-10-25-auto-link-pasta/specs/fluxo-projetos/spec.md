# Spec Delta

## MODIFIED Requirements

### Requirement: Criação de projeto
A interface MUST oferecer ao ADM a criação de projeto com tipo, cliente e identificador, operadora e identificador, cidade, UF, valor e responsável, usando a RPC `criar_projeto`; somente cadastros ativos podem ser selecionados. O seletor de tipo MUST exibir apenas o nome do tipo, sem próximo número nem faixa. O valor do projeto MUST ser informado, monetário e positivo; sua alteração posterior rege-se pelo requisito "Imutabilidade do valor do projeto". O valor MUST NOT constar no evento de criação da linha do tempo. Em caso de sucesso, a interface MUST exibir o código `F-AAAA-NNNN` gerado e o projeto passa a constar na listagem com status inicial `CADASTRADO`. A RPC `criar_projeto` MUST NOT aceitar parâmetro de projeto predecessor, e a interface MUST NOT oferecer campo de predecessor na criação.

A criação MUST definir a pasta local do projeto como `P:\_OBRAS_<ano>\<código>`, em que `<código>` é o código `F-AAAA-NNNN` reservado e `<ano>` é o mesmo ano desse código, derivados na mesma transação da criação. A base `P:\_OBRAS_` é fixa no sistema e o ano acompanha automaticamente o ano de cada criação: a virada do ano MUST NOT exigir qualquer atualização manual de configuração. O preenchimento automático é o valor inicial da pasta — sua edição e limpeza posteriores seguem os requisitos "Edição de identificadores em CADASTRADO" e "Edição da pasta local em qualquer status ativo", sem restrição adicional. O sistema apenas registra o caminho: a existência da pasta física na unidade `P:` é responsabilidade externa e sua ausência MUST NOT constituir erro da criação.

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

#### Scenario: Pasta local definida na criação
- **WHEN** o ADM cria um projeto cujo código reservado é, por exemplo, `F-2026-0042`
- **THEN** o projeto nasce com a pasta local `P:\_OBRAS_2026\F-2026-0042`, exibida no detalhe com a ação "Abrir pasta" disponível desde a criação

#### Scenario: Ano da pasta acompanha o ano da criação
- **WHEN** o primeiro projeto de um novo ano é criado (por exemplo, código `F-2027-0001`)
- **THEN** sua pasta local nasce com o ano novo (`P:\_OBRAS_2027\F-2027-0001`), sem qualquer atualização manual de configuração no sistema

#### Scenario: Pasta automática permanece editável
- **WHEN** o ADM edita ou limpa a pasta local de um projeto cujo caminho foi definido automaticamente na criação
- **THEN** a operação segue as regras vigentes de edição da pasta local, sem restrição adicional ao caminho automático

#### Scenario: Pasta física ausente não é erro da criação
- **WHEN** um projeto é criado e a pasta física correspondente ainda não existe na unidade `P:`
- **THEN** a criação é concluída normalmente com o caminho registrado, sem erro da aplicação
