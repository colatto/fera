## MODIFIED Requirements

### Requirement: Filtros combináveis
A listagem MUST oferecer filtros combináveis por cliente, identificador do cliente, operadora, identificador da operadora, cidade, UF, tipo, status e compatibilização da fundação, aplicados em conjunto; limpar os filtros MUST restaurar a consulta sem filtros. O filtro de compatibilização, rotulado "Compatibilizados", MUST oferecer as opções Todos, Sim e Não e estar disponível para ADM e OPER.

#### Scenario: Combinação de filtros
- **WHEN** o usuário aplica cliente, UF e status simultaneamente
- **THEN** a listagem retorna somente os projetos que atendem a todos os filtros informados

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
