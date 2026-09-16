## Purpose

Define os painéis da interface: o dashboard operacional por período, disponível a ADM e OPER, e o dashboard financeiro, exclusivo do ADM, ambos alimentados pelas fontes de projeção do banco.

## Requirements

### Requirement: Dashboard operacional por período
A interface MUST oferecer dashboard operacional a ADM e OPER com seleção de período (data inicial e data final), exibindo a distribuição de projetos por status, os projetos enviados no período e os enviados sem ordem de compra, conforme `dashboard_operacional(data_inicial, data_final)` e `v_dashboard_operacional`. Os defaults do seletor de período MUST ser derivados da data corrente no fuso local do usuário e MUST NOT ser derivados de representação UTC.

#### Scenario: Período com dados
- **WHEN** o usuário consulta o dashboard operacional em período com atividade
- **THEN** são exibidos os totais por status, enviados no período e enviados sem OC para o período informado

#### Scenario: Período sem dados
- **WHEN** o período consultado não possui atividade
- **THEN** o dashboard exibe valores zerados, sem erro

#### Scenario: Default de período no fuso local
- **WHEN** o usuário abre o dashboard operacional entre 21h e meia-noite no fuso local
- **THEN** o período default usa a data corrente local, sem deslocamento de um dia

### Requirement: Legenda do tooltip na cor do status
No dashboard operacional, a legenda exibida no tooltip dos gráficos de distribuição por status (barras e pizza) MUST ser apresentada na cor associada ao status do elemento sob o cursor, conforme o mapa de cores por status usado pelos próprios gráficos, de forma consistente entre os dois gráficos. O rótulo e o valor exibidos MUST permanecer inalterados ("quantidade : N" no gráfico de barras e o rótulo do status na pizza).

#### Scenario: Hover em barra do gráfico de distribuição
- **WHEN** o usuário posiciona o cursor sobre a barra de um status no gráfico "Distribuição por status"
- **THEN** a linha "quantidade : N" do tooltip é exibida na cor associada a esse status, a mesma cor da barra sob o cursor

#### Scenario: Hover em fatia do gráfico de proporção
- **WHEN** o usuário posiciona o cursor sobre a fatia de um status no gráfico "Proporção por status"
- **THEN** a linha do tooltip é exibida na cor associada a esse status, a mesma cor da fatia sob o cursor

#### Scenario: Consistência entre os gráficos
- **WHEN** o mesmo status é hoverado no gráfico de barras e no gráfico de pizza
- **THEN** a cor da legenda do tooltip é a mesma nos dois gráficos

### Requirement: Dashboard financeiro exclusivo de ADM
A interface MUST oferecer ao ADM o dashboard financeiro com faturado, recebido, saldo e a métrica "Projetos" — soma do valor dos projetos com status diferente de `CANCELADO` — conforme `v_dashboard_financeiro`; a entrada MUST NOT ser oferecida na navegação de OPER, cuja leitura permanece bloqueada pelo banco.

#### Scenario: ADM consulta financeiro
- **WHEN** o ADM abre o dashboard financeiro
- **THEN** são exibidos faturado, recebido, saldo e a métrica "Projetos" (soma do valor dos projetos não cancelados) conforme a view administrativa

#### Scenario: Métrica Projetos exclui cancelados
- **WHEN** o ADM abre o dashboard financeiro e existem projetos cancelados com valor gravado
- **THEN** a métrica "Projetos" soma somente o valor dos projetos não cancelados

#### Scenario: OPER sem acesso
- **WHEN** o OPER utiliza a navegação
- **THEN** não existe entrada para o dashboard financeiro e nenhum valor financeiro é exibido em nenhuma tela operacional
