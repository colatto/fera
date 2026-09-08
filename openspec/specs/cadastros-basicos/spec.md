## Purpose

Define a manutenção dos cadastros básicos — clientes, operadoras e tipos de projeto — na interface, exclusiva do ADM, com inativação no lugar de exclusão física e regras de formulário coerentes com as restrições do banco; define também a seleção de cadastros para novos projetos.

## Requirements

### Requirement: Manutenção exclusiva de ADM com históricos
A manutenção de clientes, operadoras e tipos de projeto MUST ser oferecida somente na navegação do ADM. As listas de manutenção MUST exibir cadastros ativos e inativos, e a saída de um cadastro MUST ser a inativação; a interface MUST NOT oferecer exclusão física.

#### Scenario: ADM inativa cadastro
- **WHEN** o ADM inativa uma operadora sem projetos vinculados impeditivos
- **THEN** a operadora permanece listada como inativa e deixa de ser selecionável para novos projetos

#### Scenario: Sem exclusão física
- **WHEN** o ADM consulta as ações disponíveis de um cadastro
- **THEN** não existe ação de excluir; somente inativação/reativação e edição

### Requirement: Regras de formulário dos cadastros
Os formulários MUST validar localmente o formato dos campos — CNPJ opcional somente com dígitos, nomes obrigatórios e, em tipo de projeto, faixa inclusiva, limite de parcelas e indicador PPI — e MUST exibir as restrições do banco (unicidade de CNPJ/nome, sobreposição de faixa, faixa final abaixo do próximo número corrente, `Torre` com limite de parcelas fora de 1 a 3) como mensagens traduzidas, em português e compreensíveis para o usuário, sem aplicar alteração parcial e sem exibir texto cru de erro do banco. No formulário de tipo de projeto, quando o nome informado for `Torre`, o campo limite de parcelas MUST oferecer somente as opções 1, 2 e 3; para os demais nomes, o campo permanece livre com valor mínimo 1.

#### Scenario: CNPJ com pontuação
- **WHEN** o ADM informa CNPJ com máscara ou pontuação
- **THEN** a interface bloqueia o envio localmente, exigindo somente dígitos

#### Scenario: Nome duplicado
- **WHEN** o ADM salva operadora com nome já existente
- **THEN** a interface exibe mensagem em português informando que o nome já está em uso (citando o valor informado, quando disponível), o cadastro não é criado e nenhum texto de constraint do banco é exibido

#### Scenario: Faixa sobreposta
- **WHEN** o ADM salva tipo de projeto com faixa que sobrepõe outra existente
- **THEN** a interface exibe mensagem em português sobre a sobreposição de faixas, nada é gravado e nenhum texto de constraint do banco é exibido

#### Scenario: Regra de negócio violada
- **WHEN** o ADM salva tipo de projeto que viola uma regra verificada pelo banco (faixa inconsistente com o indicador PPI, faixa final encolhida abaixo do próximo número corrente, `Torre` com limite de parcelas fora de 1 a 3)
- **THEN** a interface exibe mensagem em português descrevendo a regra violada, nada é gravado e nenhum texto de constraint do banco é exibido

#### Scenario: Torre apresenta opções de 1 a 3
- **WHEN** o ADM informa o nome `Torre` no formulário de tipo de projeto
- **THEN** o campo limite de parcelas apresenta somente as opções 1, 2 e 3

#### Scenario: Torre salva com parcela dentro da faixa
- **WHEN** o ADM salva um tipo `Torre` com limite de parcelas 1, 2 ou 3
- **THEN** o tipo é gravado normalmente pelo banco

#### Scenario: Renomeação para Torre com valor fora de 1 a 3
- **WHEN** o ADM informa o nome `Torre` em um formulário cujo limite de parcelas está fora de 1 a 3
- **THEN** o valor informado não é alterado automaticamente e o salvamento é bloqueado pela validação local, que exige limite entre 1 e 3

#### Scenario: Demais tipos mantêm campo livre
- **WHEN** o ADM informa um nome diferente de `Torre` no formulário de tipo de projeto
- **THEN** o campo limite de parcelas permanece livre, aceitando qualquer valor inteiro a partir de 1

### Requirement: Próximo número automático do tipo de projeto
O próximo número de numeração de um tipo de projeto MUST ser estado mantido exclusivamente pelo sistema: ao criar um tipo, MUST nascer igual à faixa inicial; MUST ser incrementado somente pela criação de projetos; e, quando a faixa inicial de um tipo existente é elevada acima do contador corrente, o contador MUST ser ajustado automaticamente para cima até a nova faixa inicial, sem reutilizar números já emitidos. A interface de manutenção de tipos MUST NOT oferecer edição do próximo número e MUST exibi-lo somente como informação.

#### Scenario: Criação de tipo inicializa o contador
- **WHEN** o ADM cria um tipo de projeto com faixa inicial 1001 (PPI) e final opcional
- **THEN** o tipo é salvo com próximo número igual a 1001, sem qualquer entrada do usuário para esse valor

#### Scenario: Faixa inicial elevada acima do contador
- **WHEN** o ADM edita um tipo cujo próximo número está em 300, elevando a faixa inicial para 500
- **THEN** o próximo número passa a valer 500 automaticamente, sem reutilização dos números 300 a 499

#### Scenario: Valor enviado pelo cliente é ignorado
- **WHEN** uma requisição de criação de tipo envia um próximo número diferente da faixa inicial
- **THEN** o banco grava o próximo número igual à faixa inicial

#### Scenario: Próximo número somente leitura na interface
- **WHEN** o ADM abre o formulário de criar ou editar tipo de projeto
- **THEN** não existe campo editável de próximo número, e a listagem de tipos exibe o valor corrente como informação

### Requirement: Seleção restrita a cadastros ativos
Os seletores de cliente, operadora e tipo em novos projetos MUST oferecer somente cadastros ativos.

#### Scenario: Cadastro inativo fora da seleção
- **WHEN** o ADM monta um novo projeto
- **THEN** clientes, operadoras e tipos inativos não aparecem como opção
