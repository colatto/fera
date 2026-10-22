# Spec Delta

## ADDED Requirements

### Requirement: Responsável interno visível na consulta
O nome do responsável interno do projeto MUST constar na projeção de ambos os perfis e MUST ser exibido para ADM e OPER na listagem (coluna "Responsável"), no detalhe (card "Dados do projeto") e no CSV exportado de cada perfil. O responsável interno é definido na criação do projeto e a consulta MUST NOT oferecer sua edição.

#### Scenario: OPER lista projetos com responsável
- **WHEN** o OPER abre a listagem de projetos
- **THEN** a tabela exibe a coluna "Responsável" com o nome do responsável interno de cada projeto, após a coluna "Operadora", sem colunas financeiras ou de documentos

#### Scenario: ADM lista projetos com responsável
- **WHEN** o ADM abre a listagem de projetos
- **THEN** a tabela exibe a coluna "Responsável" com o nome do responsável interno de cada projeto, após a coluna "Operadora", mantendo as demais colunas administrativas

#### Scenario: Detalhe exibe responsável interno
- **WHEN** um usuário (ADM ou OPER) abre o detalhe de um projeto
- **THEN** o card "Dados do projeto" exibe o campo "Responsável interno" com o nome do responsável definido na criação

#### Scenario: Exportação inclui responsável
- **WHEN** qualquer perfil exporta a consulta corrente em CSV
- **THEN** o arquivo contém a coluna "Responsável" com o nome do responsável interno de cada linha exportada, mantendo as colunas já existentes do perfil

#### Scenario: Sem edição do responsável pela consulta
- **WHEN** o usuário (ADM ou OPER) acessa a listagem ou o detalhe do projeto
- **THEN** nenhuma superfície da consulta permite alterar o responsável interno
