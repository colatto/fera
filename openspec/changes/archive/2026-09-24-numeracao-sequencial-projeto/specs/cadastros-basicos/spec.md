## MODIFIED Requirements

### Requirement: Regras de formulário dos cadastros
Os formulários MUST validar localmente o formato dos campos — CNPJ opcional somente com dígitos, nomes obrigatórios e, em tipo de projeto, limite de parcelas mínimo 1 — e MUST exibir as restrições do banco (unicidade de CNPJ/nome, `Torre` com limite de parcelas fora de 1 a 3) como mensagens traduzidas, em português e compreensíveis para o usuário, sem aplicar alteração parcial e sem exibir texto cru de erro do banco. No formulário de tipo de projeto, quando o nome informado for `Torre`, o campo limite de parcelas MUST oferecer somente as opções 1, 2 e 3; para os demais nomes, o campo permanece livre com valor mínimo 1. O formulário de tipo de projeto MUST conter apenas os campos Nome e Limite de parcelas, e o nome do tipo MUST NOT derivar nenhum comportamento de formulário (nenhuma regra de faixa nem de indicador PPI).

#### Scenario: CNPJ com pontuação
- **WHEN** o ADM informa CNPJ com máscara ou pontuação
- **THEN** a interface bloqueia o envio localmente, exigindo somente dígitos

#### Scenario: Nome duplicado
- **WHEN** o ADM salva operadora com nome já existente
- **THEN** a interface exibe mensagem em português informando que o nome já está em uso (citando o valor informado, quando disponível), o cadastro não é criado e nenhum texto de constraint do banco é exibido

#### Scenario: Regra de negócio violada
- **WHEN** o ADM salva tipo de projeto que viola uma regra verificada pelo banco (`Torre` com limite de parcelas fora de 1 a 3)
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

#### Scenario: Formulário de tipo apenas com nome e parcelas
- **WHEN** o ADM abre o formulário de criar ou editar tipo de projeto
- **THEN** os campos são apenas Nome e Limite de parcelas; não existem campos de faixa inicial, faixa final nem próximo número, e digitar um nome qualquer (inclusive `PPI`) não altera campos nem regras de validação

#### Scenario: Listagem de tipos sem dados de numeração
- **WHEN** o ADM consulta a listagem de tipos de projeto
- **THEN** as colunas exibem nome, limite de parcelas e situação, sem colunas de faixa nem de próximo número

## REMOVED Requirements

### Requirement: Próximo número automático do tipo de projeto
**Reason**: A numeração de projetos deixa de ser por faixa de tipo de projeto; não existe mais faixa nem contador por tipo. O controle da numeração migra para a sequência anual global, especificada na capability `fluxo-projetos`. O conceito de indicador PPI, que só governava faixas, deixa de existir.
**Migration**: As colunas de faixa e de próximo número (e o indicador PPI derivado) são removidas de `tipo_projeto` no banco; a listagem de tipos deixa de exibir as colunas Faixa e Próximo nº, e o formulário de tipos deixa de auto-preencher valores a partir do nome. Nenhuma ação do usuário é necessária.
