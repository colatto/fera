# Spec Delta

## MODIFIED Requirements

### Requirement: Filtros combináveis
A listagem MUST oferecer filtros combináveis por código da pasta, cliente, operadora, identificador de cliente ou de operadora, cidade, UF, tipo, status e compatibilização da fundação, aplicados em conjunto; limpar os filtros MUST restaurar a consulta sem filtros. O filtro de código, rotulado "Código", MUST ser o primeiro filtro do painel, casar o termo informado com o código da pasta do projeto por substring e sem diferenciar maiúsculas, e estar disponível para ADM e OPER. O filtro de identificador, rotulado "ID cliente/oper.", MUST ser um campo único que casa o termo informado com o identificador do cliente ou o da operadora, por substring e sem diferenciar maiúsculas. O filtro de compatibilização, rotulado "Compatibilizados", MUST oferecer as opções Todos, Sim e Não e estar disponível para ADM e OPER.

#### Scenario: Código como primeiro filtro
- **WHEN** a listagem de projetos renderiza o painel de filtros
- **THEN** o campo "Código" aparece como primeiro filtro, antes de "Status", nos perfis ADM e OPER

#### Scenario: Busca pelo código da pasta
- **WHEN** o usuário informa no campo "Código" um termo contido no código da pasta de projetos
- **THEN** a listagem retorna esses projetos, nos perfis ADM e OPER

#### Scenario: Código combinado com outros filtros
- **WHEN** o usuário informa um termo no campo "Código" e seleciona também cliente e status
- **THEN** a listagem retorna somente os projetos cujo código da pasta contém o termo e que atendem aos demais filtros

#### Scenario: Combinação de filtros
- **WHEN** o usuário aplica cliente, UF e status simultaneamente
- **THEN** a listagem retorna somente os projetos que atendem a todos os filtros informados

#### Scenario: Busca pelo identificador do cliente
- **WHEN** o usuário informa no campo "ID cliente/oper." um termo contido no identificador do cliente de projetos
- **THEN** a listagem retorna esses projetos, nos perfis ADM e OPER

#### Scenario: Busca pelo identificador da operadora
- **WHEN** o usuário informa no campo "ID cliente/oper." um termo contido no identificador da operadora de projetos
- **THEN** a listagem retorna esses projetos, nos perfis ADM e OPER

#### Scenario: Identificador combinado com outros filtros
- **WHEN** o usuário informa um termo no campo "ID cliente/oper." e seleciona também cliente e status
- **THEN** a listagem retorna somente os projetos que casam o termo com um dos identificadores e atendem aos demais filtros

#### Scenario: Compatibilizados com Sim
- **WHEN** o usuário seleciona "Sim" no filtro Compatibilizados
- **THEN** a listagem retorna somente os projetos com fundação compatibilizada, nos perfis ADM e OPER

#### Scenario: Compatibilizados com Não
- **WHEN** o usuário seleciona "Não" no filtro Compatibilizados
- **THEN** a listagem retorna somente os projetos com fundação não compatibilizada, nos perfis ADM e OPER

#### Scenario: Compatibilizados com Todos
- **WHEN** o usuário seleciona "Todos" no filtro Compatibilizados
- **THEN** a listagem não aplica restrição de compatibilização

#### Scenario: Filtro sem resultado
- **WHEN** a combinação de filtros não retorna projetos
- **THEN** a interface exibe estado vazio explícito, não erro
