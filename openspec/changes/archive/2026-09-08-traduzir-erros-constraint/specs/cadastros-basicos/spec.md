## MODIFIED Requirements

### Requirement: Regras de formulário dos cadastros
Os formulários MUST validar localmente o formato dos campos — CNPJ opcional somente com dígitos, nomes obrigatórios e, em tipo de projeto, faixa inclusiva, próximo número, limite de parcelas e indicador PPI — e MUST exibir as restrições do banco (unicidade de CNPJ/nome, sobreposição de faixa, `Torre` com limite de parcelas diferente de 3) como mensagens traduzidas, em português e compreensíveis para o usuário, sem aplicar alteração parcial e sem exibir texto cru de erro do banco.

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
- **WHEN** o ADM salva tipo de projeto que viola uma regra verificada pelo banco (faixa inconsistente com o indicador PPI, próximo número fora da faixa, `Torre` com limite de parcelas diferente de 3)
- **THEN** a interface exibe mensagem em português descrevendo a regra violada, nada é gravado e nenhum texto de constraint do banco é exibido
