# Spec Delta

## ADDED Requirements

### Requirement: Estado da consulta preservado na navegação
O estado da consulta da listagem — filtros aplicados, ordenação e página da paginação — MUST ser preservado enquanto a página permanece aberta: navegar para o detalhe de um projeto ou para qualquer outra rota e voltar à listagem MUST restaurar esse estado. O estado MUST voltar ao inicial apenas quando a página é recarregada ou quando o usuário limpa os filtros.

#### Scenario: Voltar do detalhe mantém a consulta
- **WHEN** o usuário aplica filtros, define uma ordenação, avança para uma página da paginação, abre o detalhe de um projeto e volta à listagem
- **THEN** os filtros permanecem aplicados e a ordenação e a página são restauradas como estavam antes de abrir o detalhe

#### Scenario: Filtros mantidos ao navegar para outra seção
- **WHEN** o usuário com filtros aplicados navega para outra seção da aplicação e retorna à listagem de projetos
- **THEN** os filtros permanecem aplicados com a ordenação e a página anteriores

#### Scenario: Recarregar a página zera a consulta
- **WHEN** a página é recarregada com filtros, ordenação e página definidos
- **THEN** a listagem é exibida sem filtros, na ordenação padrão e na primeira página

#### Scenario: Limpar filtros restaura a primeira página
- **WHEN** o usuário clica em "Limpar filtros" com a consulta em qualquer página
- **THEN** os filtros são removidos, a consulta retorna à primeira página e a ordenação é mantida

#### Scenario: Alterar filtro retorna à primeira página
- **WHEN** o usuário altera qualquer filtro com a consulta em página posterior à primeira
- **THEN** a listagem retorna à primeira página com o conjunto de dados do novo filtro

#### Scenario: Página persistida fora do intervalo válido
- **WHEN** o usuário volta à listagem e o número de páginas diminuiu em relação à página persistida
- **THEN** a listagem exibe a última página válida, sem estado vazio
