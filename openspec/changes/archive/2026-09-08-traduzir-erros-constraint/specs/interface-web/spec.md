## ADDED Requirements

### Requirement: Erros de escrita exibidos em linguagem compreensível
Toda mensagem de erro exibida ao usuário após uma operação de escrita (criar, alterar, processar) MUST estar em português e ser compreensível sem conhecimento técnico de banco de dados. Quando a escrita for rejeitada por uma restrição de unicidade, exclusão ou verificação do banco, a interface MUST exibir uma mensagem que descreva a causa em termos do domínio (ex.: nome já existente, CNPJ já cadastrado, faixa de números sobreposta) — nunca o texto cru do erro do banco (nomes de constraint, códigos SQL ou mensagens em inglês do SGBD). Mensagens de erro já redigidas em português pelas funções do banco (ex.: "Faixa esgotada") MUST ser exibidas como estão, sem retradução. Erros sem tradução conhecida MUST ser exibidos com a mensagem original, mantendo o comportamento atual como fallback.

#### Scenario: Nome duplicado exibido de forma amigável
- **WHEN** o ADM salva um cadastro cujo nome já existe (ex.: operadora "Vivo" quando "Vivo" já está cadastrada)
- **THEN** a interface exibe mensagem em português informando que já existe um registro com aquele nome, citando o valor informado, sem exibir nomes de constraint nem texto do SGBD

#### Scenario: CNPJ duplicado exibido de forma amigável
- **WHEN** o ADM salva um cliente com CNPJ já cadastrado
- **THEN** a interface exibe mensagem em português informando que o CNPJ já está cadastrado, sem texto cru do banco

#### Scenario: Faixa sobreposta exibida de forma amigável
- **WHEN** o ADM salva um tipo de projeto cuja faixa de números sobrepõe a de outro tipo
- **THEN** a interface exibe mensagem em português sobre a sobreposição de faixas, sem exibir a restrição de exclusão do banco em formato cru

#### Scenario: Mensagem de negócio do banco preservada
- **WHEN** uma função do banco rejeita a operação com mensagem já redigida em português (ex.: "Faixa esgotada", "Tipo inexistente ou inativo")
- **THEN** a interface exibe exatamente essa mensagem, sem alteração

#### Scenario: Erro desconhecido mantém fallback
- **WHEN** a escrita falha com um erro sem tradução conhecida (ex.: falha de rede, erro interno não mapeado)
- **THEN** a interface exibe a mensagem de erro disponível hoje, sem quebrar nem exibir "[object Object]"
