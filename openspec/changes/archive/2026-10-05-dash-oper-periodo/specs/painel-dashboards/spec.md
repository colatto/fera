# Spec Delta

## MODIFIED Requirements

### Requirement: Dashboard operacional por período
A interface MUST oferecer dashboard operacional a ADM e OPER com seleção de período (data inicial e data final), exibindo a movimentação por status do período, os projetos enviados no período e os enviados sem ordem de compra no período, conforme `dashboard_operacional(data_inicial, data_final)`. A movimentação por status MUST ser a contagem de entradas em cada status ocorridas no período a partir do histórico de `evento_projeto`: cada mudança de status conta pelo status novo na data de realização do evento, e a criação de projeto conta como entrada em `CADASTRADO` na data de criação. Um projeto que muda de status mais de uma vez no período conta em cada status por onde passou. Entradas em `CANCELADO` MUST NOT ser exibidas na distribuição. As métricas de envio MUST ser escopadas por `data_envio` dentro do período. Os defaults do seletor de período MUST ser derivados da data corrente no fuso local do usuário e MUST NOT ser derivados de representação UTC.

#### Scenario: Período com dados
- **WHEN** o usuário consulta o dashboard operacional em período com atividade
- **THEN** são exibidos a movimentação por status, os enviados no período e os enviados sem OC para o período informado

#### Scenario: Movimentação por status no período
- **WHEN** um projeto muda de status mais de uma vez dentro do período consultado
- **THEN** a distribuição conta uma entrada em cada status pelo qual o projeto passou no período

#### Scenario: Criação conta como entrada em CADASTRADO
- **WHEN** um projeto é criado dentro do período consultado e não registra mudança de status
- **THEN** a distribuição exibe uma entrada em CADASTRADO para esse projeto

#### Scenario: Cancelamentos fora da distribuição
- **WHEN** existem cancelamentos de projeto dentro do período consultado
- **THEN** as entradas em CANCELADO não aparecem na distribuição nem nos gráficos

#### Scenario: Enviados sem OC do período
- **WHEN** o usuário consulta o dashboard operacional com um período informado
- **THEN** "enviados sem OC" conta apenas projetos com data de envio dentro do período, sem ordem de compra vinculada e não cancelados

#### Scenario: Período sem dados
- **WHEN** o período consultado não possui atividade
- **THEN** o dashboard exibe valores zerados, sem erro

#### Scenario: Default de período no fuso local
- **WHEN** o usuário abre o dashboard operacional entre 21h e meia-noite no fuso local
- **THEN** o período default usa a data corrente local, sem deslocamento de um dia
