## ADDED Requirements

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
