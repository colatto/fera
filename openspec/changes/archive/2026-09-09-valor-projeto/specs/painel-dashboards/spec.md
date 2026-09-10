## MODIFIED Requirements

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
