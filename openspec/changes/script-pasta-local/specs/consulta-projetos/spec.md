## ADDED Requirements

### Requirement: Pasta local no detalhe do projeto
O detalhe do projeto MUST exibir a pasta local nos dados do projeto, para ADM e OPER, quando ela estiver definida — a localização física dos arquivos técnicos não é dado financeiro e não segue as restrições do resumo financeiro. Quando não definida, o detalhe MUST indicar a ausência de forma neutra (valor em branco), sem oferecer cópia nem abertura. Para um projeto com pasta definida, a interface MUST oferecer a cópia do caminho para a área de transferência a qualquer perfil com acesso ao detalhe, inclusive em projeto cancelado. A pasta local MUST NÃO constar na listagem de projetos, nos filtros e na exportação CSV da consulta corrente, nem na linha do tempo como campo exibido em evento.

#### Scenario: Pasta definida visível para ADM
- **WHEN** o ADM consulta o detalhe de um projeto com pasta local definida
- **THEN** o caminho aparece nos dados do projeto junto das demais informações

#### Scenario: Pasta definida visível para OPER
- **WHEN** um usuário OPER consulta o detalhe de um projeto com pasta local definida
- **THEN** o caminho aparece nos dados do projeto, com cópia disponível, mesmo sem acesso ao resumo financeiro

#### Scenario: Pasta não definida
- **WHEN** o detalhe de um projeto é consultado sem pasta local definida
- **THEN** o campo indica ausência de forma neutra e nenhum botão de copiar ou abrir é oferecido

#### Scenario: Cópia do caminho
- **WHEN** o usuário clica em copiar no detalhe de um projeto com pasta definida
- **THEN** o caminho exato vai para a área de transferência, independentemente do perfil

#### Scenario: Pasta de projeto cancelado permanece visível
- **WHEN** o detalhe de um projeto cancelado com pasta definida é consultado
- **THEN** o caminho continua sendo exibido e a cópia continua disponível

#### Scenario: Pasta fora da listagem e da exportação
- **WHEN** o usuário consulta a listagem de projetos ou exporta a consulta corrente em CSV
- **THEN** nenhuma coluna de pasta local aparece em nenhum perfil
