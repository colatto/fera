## MODIFIED Requirements

### Requirement: Centro de custo na projeção administrativa
A projeção administrativa MUST refletir o centro de custo do projeto: a descrição do documento "Ordem de compra" na linha do tempo do ADM, quando o projeto tiver centro de custo, MUST exibir o centro de custo do projeto, e a exportação CSV da consulta de projetos de ADM MUST manter a coluna "Centro de custo" com o centro de custo do projeto. O card "Financeiro" do detalhe do projeto para ADM MUST exibir, quando o projeto tiver centro de custo, uma linha própria "Centro de custo" posicionada imediatamente abaixo da linha "Ordem de compra", com o valor do centro de custo do projeto; quando o projeto não tiver centro de custo, essa linha MUST estar ausente e as demais linhas do card MUST permanecer inalteradas. Projetos que compartilham a mesma ordem de compra MAY exibir centros de custo distintos ou vazio. A projeção operacional MUST NOT conter centro de custo.

#### Scenario: ADM vê o centro de custo do projeto na linha do tempo
- **WHEN** o ADM abre o detalhe de um projeto com OC vinculada e centro de custo próprio
- **THEN** o documento "Ordem de compra" exibe na descrição o centro de custo do projeto, não o de outra ordem de compra compartilhada

#### Scenario: ADM vê o centro de custo no resumo financeiro
- **WHEN** o ADM abre o detalhe de um projeto com centro de custo informado
- **THEN** o card "Financeiro" exibe a linha "Centro de custo" imediatamente abaixo da linha "Ordem de compra", com o valor do centro de custo do projeto

#### Scenario: Detalhe sem centro de custo
- **WHEN** o ADM abre o detalhe de um projeto sem centro de custo informado
- **THEN** o card "Financeiro" não exibe a linha "Centro de custo" e mantém as demais linhas inalteradas

#### Scenario: Projetos da mesma OC com centros de custo distintos
- **WHEN** dois projetos vinculados à mesma ordem de compra têm centros de custo diferentes — ou um deles não tem centro de custo
- **THEN** a listagem e o CSV de ADM exibem o centro de custo de cada projeto independentemente

#### Scenario: CSV de operacional sem centro de custo
- **WHEN** o OPER exporta a consulta de projetos
- **THEN** o CSV não contém a coluna "Centro de custo"
