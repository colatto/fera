## Purpose

Define a manutenção dos cadastros básicos — clientes, operadoras e tipos de projeto — na interface, exclusiva do ADM, com inativação no lugar de exclusão física e regras de formulário coerentes com as restrições do banco; define também a seleção de cadastros para novos projetos.

## ADDED Requirements

### Requirement: Manutenção exclusiva de ADM com históricos
A manutenção de clientes, operadoras e tipos de projeto MUST ser oferecida somente na navegação do ADM. As listas de manutenção MUST exibir cadastros ativos e inativos, e a saída de um cadastro MUST ser a inativação; a interface MUST NOT oferecer exclusão física.

#### Scenario: ADM inativa cadastro
- **WHEN** o ADM inativa uma operadora sem projetos vinculados impeditivos
- **THEN** a operadora permanece listada como inativa e deixa de ser selecionável para novos projetos

#### Scenario: Sem exclusão física
- **WHEN** o ADM consulta as ações disponíveis de um cadastro
- **THEN** não existe ação de excluir; somente inativação/reativação e edição

### Requirement: Regras de formulário dos cadastros
Os formulários MUST validar localmente o formato dos campos — CNPJ opcional somente com dígitos, nomes obrigatórios e, em tipo de projeto, faixa inclusiva, próximo número, limite de parcelas e indicador PPI — e MUST exibir as mensagens de restrição do banco (unicidade de CNPJ/nome, sobreposição de faixa, `Torre` com limite de parcelas diferente de 3) sem aplicar alteração parcial.

#### Scenario: CNPJ com pontuação
- **WHEN** o ADM informa CNPJ com máscara ou pontuação
- **THEN** a interface bloqueia o envio localmente, exigindo somente dígitos

#### Scenario: Nome duplicado
- **WHEN** o ADM salva operadora com nome já existente
- **THEN** a interface exibe a mensagem de unicidade do banco e o cadastro não é criado

#### Scenario: Faixa sobreposta
- **WHEN** o ADM salva tipo de projeto com faixa que sobrepõe outra existente
- **THEN** a interface exibe a restrição do banco e nada é gravado

### Requirement: Seleção restrita a cadastros ativos
Os seletores de cliente, operadora e tipo em novos projetos MUST oferecer somente cadastros ativos.

#### Scenario: Cadastro inativo fora da seleção
- **WHEN** o ADM monta um novo projeto
- **THEN** clientes, operadoras e tipos inativos não aparecem como opção
