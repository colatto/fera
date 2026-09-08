## MODIFIED Requirements

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
