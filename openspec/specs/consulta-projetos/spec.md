## Purpose

Define a consulta de projetos na interface: listagem com filtros combináveis, projeção distinta por perfil (ADM completo, OPER operacional), detalhe com linha do tempo de eventos e documentos e exportação da consulta corrente.

## Requirements

### Requirement: Listagem por perfil
A listagem de projetos MUST usar a projeção do perfil: ADM consulta `v_projetos_administrativo` com a projeção completa, e OPER consulta `v_projetos_operacional` sem colunas de documentos ou valores financeiros. As colunas exibidas MUST seguir a projeção correspondente.

#### Scenario: ADM lista projetos
- **WHEN** o ADM abre a listagem de projetos
- **THEN** retornam os projetos com a projeção completa, incluindo informações financeiras e de documentos

#### Scenario: OPER lista projetos
- **WHEN** o OPER abre a listagem de projetos
- **THEN** retornam os projetos com dados operacionais e nenhuma coluna financeira ou de documentos é exibida

### Requirement: Filtros combináveis
A listagem MUST oferecer filtros combináveis por código, cliente, identificador do cliente, operadora, identificador da operadora, cidade, UF, tipo e status, aplicados em conjunto; limpar os filtros MUST restaurar a consulta sem filtros.

#### Scenario: Combinação de filtros
- **WHEN** o usuário aplica cliente, UF e status simultaneamente
- **THEN** a listagem retorna somente os projetos que atendem a todos os filtros informados

#### Scenario: Filtro sem resultado
- **WHEN** a combinação de filtros não retorna projetos
- **THEN** a interface exibe estado vazio explícito, não erro

### Requirement: Detalhe do projeto com linha do tempo
O detalhe MUST exibir os dados do projeto conforme a projeção do perfil e a linha do tempo em ordem cronológica com os eventos do projeto; para ADM, a linha do tempo também apresenta os documentos (ordem de compra, autorização de faturamento, nota fiscal e recebimentos) lidos das próprias tabelas, sem evento financeiro duplicado, e a previsão de recebimento calculada como emissão da nota mais 30 dias. Para OPER, a linha do tempo usa `v_eventos_operacionais` e não apresenta documentos nem valores.

#### Scenario: ADM consulta detalhe
- **WHEN** o ADM abre o detalhe de um projeto com fluxo avançado
- **THEN** a linha do tempo exibe eventos e documentos financeiros com a previsão de recebimento calculada

#### Scenario: OPER consulta detalhe
- **WHEN** o OPER abre o detalhe do mesmo projeto
- **THEN** a linha do tempo exibe somente eventos operacionais, sem documentos ou valores

### Requirement: Número da nota no resumo financeiro
O detalhe do projeto para ADM MUST exibir, no card "Financeiro", uma linha própria com o número da nota fiscal registrada acompanhado da data de emissão, enquanto o projeto tiver nota; o resumo financeiro MUST continuar exibindo o valor da nota, recebido, saldo a receber, previsão de recebimento e ordem de compra como já definido.

#### Scenario: ADM visualiza detalhe com nota registrada
- **WHEN** o ADM abre o detalhe de um projeto com nota fiscal registrada
- **THEN** o card "Financeiro" exibe a linha "Número da nota" com o número da nota e a data de emissão formatada em pt-BR, além do valor da nota

#### Scenario: Detalhe sem nota registrada
- **WHEN** o ADM abre o detalhe de um projeto sem nota fiscal registrada
- **THEN** o card "Financeiro" não exibe a linha "Número da nota" e mantém as demais linhas inalteradas

### Requirement: Exportação da consulta corrente
A interface MUST exportar em CSV a consulta de projetos exibida, respeitando os filtros ativos e a projeção do perfil; a exportação de OPER MUST NOT conter colunas financeiras.

#### Scenario: Exportação com filtros
- **WHEN** o usuário exporta com filtros aplicados
- **THEN** o arquivo CSV contém exatamente o subconjunto exibido na listagem

#### Scenario: Exportação de OPER
- **WHEN** o OPER exporta a consulta
- **THEN** o CSV contém somente as colunas da projeção operacional
