# Spec Delta

## MODIFIED Requirements

### Requirement: Pasta local no detalhe do projeto
O detalhe do projeto MUST exibir a pasta local nos dados do projeto, para ADM e OPER, quando ela estiver definida — a localização física dos arquivos técnicos não é dado financeiro e não segue as restrições do resumo financeiro. Quando não definida, o detalhe MUST indicar a ausência de forma neutra (placeholder "—", padrão dos demais campos do card), sem oferecer abertura. A interface MUST NÃO oferecer a cópia do caminho para a área de transferência em nenhuma superfície da consulta de projetos, em nenhum perfil. A edição da pasta local é regida pelo requisito de edição da pasta local do fluxo de projetos e não por este requisito. A pasta local MUST NÃO constar na listagem de projetos, nos filtros e na exportação CSV da consulta corrente, nem na linha do tempo como campo exibido em evento.

#### Scenario: Pasta definida visível para ADM
- **WHEN** o ADM consulta o detalhe de um projeto com pasta local definida
- **THEN** o caminho aparece nos dados do projeto junto das demais informações

#### Scenario: Pasta definida visível para OPER
- **WHEN** um usuário OPER consulta o detalhe de um projeto com pasta local definida
- **THEN** o caminho aparece nos dados do projeto, mesmo sem acesso ao resumo financeiro

#### Scenario: Pasta não definida
- **WHEN** o detalhe de um projeto é consultado sem pasta local definida
- **THEN** o campo indica ausência de forma neutra e nenhum botão de abertura é oferecido

#### Scenario: Cópia do caminho
- **WHEN** qualquer perfil consulta o detalhe de um projeto com pasta definida
- **THEN** nenhum botão ou ação de copiar o caminho para a área de transferência é oferecido

#### Scenario: Pasta de projeto cancelado permanece visível
- **WHEN** o detalhe de um projeto cancelado com pasta definida é consultado
- **THEN** o caminho continua sendo exibido, sem ação de edição e sem cópia

#### Scenario: Pasta fora da listagem e da exportação
- **WHEN** o usuário consulta a listagem de projetos ou exporta a consulta corrente em CSV
- **THEN** nenhuma coluna de pasta local aparece em nenhum perfil
