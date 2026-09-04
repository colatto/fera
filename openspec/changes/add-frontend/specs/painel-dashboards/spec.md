## Purpose

Define os painéis da interface: o dashboard operacional por período, disponível a ADM e OPER, e o dashboard financeiro, exclusivo do ADM, ambos alimentados pelas fontes de projeção do banco.

## ADDED Requirements

### Requirement: Dashboard operacional por período
A interface MUST oferecer dashboard operacional a ADM e OPER com seleção de período (data inicial e data final), exibindo a distribuição de projetos por status, os projetos enviados no período e os enviados sem ordem de compra, conforme `dashboard_operacional(data_inicial, data_final)` e `v_dashboard_operacional`.

#### Scenario: Período com dados
- **WHEN** o usuário consulta o dashboard operacional em período com atividade
- **THEN** são exibidos os totais por status, enviados no período e enviados sem OC para o período informado

#### Scenario: Período sem dados
- **WHEN** o período consultado não possui atividade
- **THEN** o dashboard exibe valores zerados, sem erro

### Requirement: Dashboard financeiro exclusivo de ADM
A interface MUST oferecer ao ADM o dashboard financeiro com faturado, recebido e saldo conforme `v_dashboard_financeiro`; a entrada MUST NOT ser oferecida na navegação de OPER, cuja leitura permanece bloqueada pelo banco.

#### Scenario: ADM consulta financeiro
- **WHEN** o ADM abre o dashboard financeiro
- **THEN** são exibidos faturado, recebido e saldo conforme a view administrativa

#### Scenario: OPER sem acesso
- **WHEN** o OPER utiliza a navegação
- **THEN** não existe entrada para o dashboard financeiro e nenhum valor financeiro é exibido em nenhuma tela operacional
