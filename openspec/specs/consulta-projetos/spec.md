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

### Requirement: Detalhes de eventos em linguagem natural na linha do tempo
A linha do tempo do detalhe do projeto MUST apresentar a descrição originada dos detalhes do evento em linguagem natural, derivada do tipo do evento, e MUST NOT exibir serialização JSON crua nem identificadores internos do banco (como o identificador do projeto anterior em eventos de substituição). Quando o tipo do evento não tiver humanização definida — hoje criação, substituição e alterações de status/cadastro — a descrição originada de detalhes MUST ser omitida, mantendo título, data e responsável. O motivo de cancelamento, quando presente, MUST ter precedência sobre a descrição de detalhes.

#### Scenario: Compatibilização de fundação marcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como verdadeira
- **THEN** a linha do tempo exibe o evento com descrição em linguagem natural indicando que a fundação foi marcada como compatibilizada, sem JSON cru

#### Scenario: Compatibilização de fundação desmarcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como falsa
- **THEN** a linha do tempo exibe o evento com descrição distinta indicando a desmarcação, sem JSON cru

#### Scenario: Evento sem humanização definida
- **WHEN** a linha do tempo renderiza evento de criação, substituição ou tipo sem humanização definida
- **THEN** o evento é exibido sem descrição originada de detalhes, apenas com título, data e, quando presente, o responsável

#### Scenario: Nenhum JSON cru em nenhum perfil
- **WHEN** qualquer evento com detalhes é renderizado na linha do tempo, em qualquer perfil
- **THEN** a interface não exibe serialização JSON de detalhes nem identificadores internos do banco

### Requirement: Exportação da consulta corrente
A interface MUST exportar em CSV a consulta de projetos exibida, respeitando os filtros ativos e a projeção do perfil; a exportação de OPER MUST NOT conter colunas financeiras.

#### Scenario: Exportação com filtros
- **WHEN** o usuário exporta com filtros aplicados
- **THEN** o arquivo CSV contém exatamente o subconjunto exibido na listagem

#### Scenario: Exportação de OPER
- **WHEN** o OPER exporta a consulta
- **THEN** o CSV contém somente as colunas da projeção operacional

### Requirement: Valor do projeto na projeção administrativa
O valor do projeto MUST constar exclusivamente na projeção administrativa: a listagem de ADM MUST exibir coluna "Valor" formatada como moeda pt-BR, o detalhe de ADM MUST exibir linha "Valor" no card "Dados do projeto", e o CSV exportado por ADM MUST conter a coluna de valor do projeto. A projeção operacional MUST NOT expor o valor do projeto em nenhuma superfície (listagem, detalhe ou CSV de OPER).

#### Scenario: ADM visualiza valor na listagem
- **WHEN** o ADM abre a listagem de projetos
- **THEN** a coluna "Valor" exibe o valor de cada projeto formatado como moeda pt-BR

#### Scenario: ADM visualiza valor no detalhe
- **WHEN** o ADM abre o detalhe de um projeto
- **THEN** o card "Dados do projeto" exibe a linha "Valor" com o valor formatado como moeda pt-BR

#### Scenario: CSV de ADM inclui valor
- **WHEN** o ADM exporta a consulta corrente
- **THEN** o CSV contém a coluna de valor do projeto junto às colunas da projeção administrativa

#### Scenario: OPER não vê o valor em nenhuma superfície
- **WHEN** o OPER usa a listagem, o detalhe ou a exportação CSV
- **THEN** nenhuma coluna, linha ou campo de valor do projeto é exibido
