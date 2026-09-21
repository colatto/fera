## ADDED Requirements

### Requirement: Centro de custo na projeção administrativa
A projeção administrativa MUST refletir o centro de custo do projeto: a descrição do documento "Ordem de compra" na linha do tempo do ADM, quando o projeto tiver centro de custo, MUST exibir o centro de custo do projeto, e a exportação CSV da consulta de projetos de ADM MUST manter a coluna "Centro de custo" com o centro de custo do projeto. Projetos que compartilham a mesma ordem de compra MAY exibir centros de custo distintos ou vazio. A projeção operacional MUST NOT conter centro de custo.

#### Scenario: ADM vê o centro de custo do projeto na linha do tempo
- **WHEN** o ADM abre o detalhe de um projeto com OC vinculada e centro de custo próprio
- **THEN** o documento "Ordem de compra" exibe na descrição o centro de custo do projeto, não o de outra ordem de compra compartilhada

#### Scenario: Projetos da mesma OC com centros de custo distintos
- **WHEN** dois projetos vinculados à mesma ordem de compra têm centros de custo diferentes — ou um deles não tem centro de custo
- **THEN** a listagem e o CSV de ADM exibem o centro de custo de cada projeto independentemente

#### Scenario: CSV de operacional sem centro de custo
- **WHEN** o OPER exporta a consulta de projetos
- **THEN** o CSV não contém a coluna "Centro de custo"
