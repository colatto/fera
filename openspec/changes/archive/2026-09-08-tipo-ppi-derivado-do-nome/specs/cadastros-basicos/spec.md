## MODIFIED Requirements

### Requirement: Regras de formulário dos cadastros
Os formulários MUST validar localmente o formato dos campos — CNPJ opcional somente com dígitos, nomes obrigatórios e, em tipo de projeto, faixa inclusiva e limite de parcelas — e MUST exibir as restrições do banco (unicidade de CNPJ/nome, sobreposição de faixa, faixa inconsistente com o nome do tipo, faixa final abaixo do próximo número corrente, `Torre` com limite de parcelas fora de 1 a 3) como mensagens traduzidas, em português e compreensíveis para o usuário, sem aplicar alteração parcial e sem exibir texto cru de erro do banco. No formulário de tipo de projeto, quando o nome informado for `Torre`, o campo limite de parcelas MUST oferecer somente as opções 1, 2 e 3; para os demais nomes, o campo permanece livre com valor mínimo 1.

O indicador PPI de um tipo de projeto MUST ser derivado exclusivamente do nome: após remoção de espaços nas bordas, comparação exata com `ppi` ignorando caixa (mesmo tratamento de `Torre`). O formulário de tipo de projeto MUST NOT oferecer controle manual de indicador PPI. Quando o nome digitado passa a ser PPI, o formulário MUST aplicar automaticamente a regra correspondente — faixa inicial validada a partir de 1001, faixa final opcional — e MUST auto-preencher a faixa inicial com 1001 e limpar a faixa final; a transição inversa MUST NOT alterar valores automaticamente, cabendo à validação local bloquear faixas inconsistentes com o novo nome. A listagem de tipos MUST NOT exibir coluna dedicada ao indicador PPI.

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
- **WHEN** o ADM salva tipo de projeto que viola uma regra verificada pelo banco (faixa inconsistente com o nome do tipo — PPI ou não —, faixa final encolhida abaixo do próximo número corrente, `Torre` com limite de parcelas fora de 1 a 3)
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

#### Scenario: Nome PPI aplica a regra automaticamente
- **WHEN** o ADM digita o nome `PPI` no formulário de tipo de projeto, em qualquer combinação de caixa (por exemplo `ppi` ou `PpI`)
- **THEN** as regras de PPI passam a valer sem qualquer ação adicional: a faixa inicial é validada a partir de 1001 e a faixa final torna-se opcional, e não existe controle manual de indicador PPI no formulário

#### Scenario: Auto-preenchimento ao digitar PPI
- **WHEN** o nome digitado passa a ser PPI (transição de nome não PPI para PPI)
- **THEN** o formulário auto-preenche a faixa inicial com 1001 e limpa a faixa final, sem exigir digitação desses valores

#### Scenario: Nome PPI com final informado permanece válido
- **WHEN** o ADM digita o nome `PPI` e informa uma faixa final maior ou igual à inicial
- **THEN** o salvamento é aceito, mantendo a faixa final informada

#### Scenario: Renomeação de PPI para outro nome não restaura valores
- **WHEN** o ADM edita um tipo cujo nome era PPI alterando o nome para outro valor
- **THEN** os campos de faixa não são alterados automaticamente e o salvamento é bloqueado pela validação local, que passa a exigir faixa 0–1000 com faixa final obrigatória

#### Scenario: Listagem sem coluna de PPI
- **WHEN** o ADM consulta a listagem de tipos de projeto
- **THEN** não existe coluna dedicada ao indicador PPI; o nome e a faixa exibida comunicam o regime de numeração do tipo
