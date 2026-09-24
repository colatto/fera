## Purpose

Define a consulta de projetos na interface: listagem com filtros combináveis, projeção distinta por perfil (ADM completo, OPER operacional), detalhe com linha do tempo de eventos e documentos e exportação da consulta corrente.

## Requirements

### Requirement: Listagem por perfil
A listagem de projetos MUST usar a projeção do perfil: ADM consulta `v_projetos_administrativo` com a projeção completa, e OPER consulta `v_projetos_operacional` sem colunas de documentos ou valores financeiros. As colunas exibidas MUST seguir a projeção correspondente.

#### Scenario: ADM lista projetos
- **WHEN** o ADM abre a listagem de projetos
- **THEN** retornam os projetos com a projeção completa, incluindo informações financeiras e de documentos

#### Scenario: OPER lista projetos
- **WHEN** o OPER abre a listagem de projetos
- **THEN** retornam os projetos com dados operacionais e nenhuma coluna financeira ou de documentos é exibida

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

### Requirement: Detalhe do projeto com linha do tempo
O detalhe MUST exibir os dados do projeto conforme a projeção do perfil e a linha do tempo em ordem cronológica com os eventos do projeto; para ADM, a linha do tempo também apresenta os documentos (ordem de compra, autorização de faturamento, nota fiscal e recebimentos) lidos das próprias tabelas, sem evento financeiro duplicado, e a previsão de recebimento calculada como emissão da nota mais 30 dias. Para OPER, a linha do tempo usa `v_eventos_operacionais` e não apresenta documentos nem valores.

Cada documento MUST ser posicionado na linha do tempo pelo instante real da ação que o trouxe ao projeto, exibido com data e hora: a ordem de compra pelo momento do vínculo ao projeto (instante do evento da transição para `OC_REGISTRADA`), a nota fiscal pelo instante de registro da nota, cada recebimento pelo instante de confirmação do recebimento e a autorização de faturamento pelo instante da autorização. A data de negócio do documento (data da OC, data de emissão da nota, data do recebimento) MUST constar apenas na descrição do item, formatada em pt-BR, e nenhum item de documento MUST exibir horário fabricado. A previsão de recebimento permanece como projeção, ancorada à data calculada (emissão + 30 dias) e exibida apenas com data.

#### Scenario: ADM consulta detalhe
- **WHEN** o ADM abre o detalhe de um projeto com fluxo avançado
- **THEN** a linha do tempo exibe eventos e documentos financeiros com a previsão de recebimento calculada

#### Scenario: OPER consulta detalhe
- **WHEN** o OPER abre o detalhe do mesmo projeto
- **THEN** a linha do tempo exibe somente eventos operacionais, sem documentos ou valores

#### Scenario: OC com data de emissão retroativa
- **WHEN** o ADM vincula a um projeto uma ordem de compra cuja data de emissão é anterior à data do vínculo
- **THEN** o documento "Ordem de compra" aparece na posição do momento do vínculo, com data e hora reais, e a data de emissão consta na descrição do item

#### Scenario: Documento na posição correta do fluxo
- **WHEN** a linha do tempo de um projeto enviado exibe a ordem de compra e o evento da transição para `OC_REGISTRADA`
- **THEN** ambos aparecem na mesma posição temporal (o instante do vínculo), sem o documento entre eventos anteriores

#### Scenario: Recebimentos posicionados pela confirmação
- **WHEN** o ADM consulta o detalhe de um projeto com recebimentos lançados
- **THEN** cada recebimento é posicionado pelo instante de confirmação, com a data de recebimento informada constante na descrição

#### Scenario: Nenhum horário fabricado
- **WHEN** a linha do tempo renderiza qualquer documento (ordem de compra, autorização, nota ou recebimento)
- **THEN** o item exibe o instante real da ação correspondente e nunca um horário fixo artificial

### Requirement: Número da nota no resumo financeiro
O detalhe do projeto para ADM MUST exibir, no card "Financeiro", uma linha própria com o número da nota fiscal registrada acompanhado da data de emissão, enquanto o projeto tiver nota; o resumo financeiro MUST continuar exibindo o valor da nota, recebido, saldo a receber, previsão de recebimento e ordem de compra como já definido.

#### Scenario: ADM visualiza detalhe com nota registrada
- **WHEN** o ADM abre o detalhe de um projeto com nota fiscal registrada
- **THEN** o card "Financeiro" exibe a linha "Número da nota" com o número da nota e a data de emissão formatada em pt-BR, além do valor da nota

#### Scenario: Detalhe sem nota registrada
- **WHEN** o ADM abre o detalhe de um projeto sem nota fiscal registrada
- **THEN** o card "Financeiro" não exibe a linha "Número da nota" e mantém as demais linhas inalteradas

### Requirement: Detalhes de eventos em linguagem natural na linha do tempo
A linha do tempo do detalhe do projeto MUST apresentar a descrição originada dos detalhes do evento em linguagem natural, derivada do tipo do evento, e MUST NOT exibir serialização JSON crua nem identificadores internos do banco. Quando o tipo do evento não tiver humanização definida — hoje criação e alterações de status/cadastro — a descrição originada de detalhes MUST ser omitida, mantendo título, data e responsável. O motivo de cancelamento, quando presente, MUST ter precedência sobre a descrição de detalhes.

#### Scenario: Compatibilização de fundação marcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como verdadeira
- **THEN** a linha do tempo exibe o evento com descrição em linguagem natural indicando que a fundação foi marcada como compatibilizada, sem JSON cru

#### Scenario: Compatibilização de fundação desmarcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como falsa
- **THEN** a linha do tempo exibe o evento com descrição distinta indicando a desmarcação, sem JSON cru

#### Scenario: Evento sem humanização definida
- **WHEN** a linha do tempo renderiza evento de criação ou tipo sem humanização definida
- **THEN** o evento é exibido sem descrição originada de detalhes, apenas com título, data e, quando presente, o responsável

#### Scenario: Nenhum JSON cru em nenhum perfil
- **WHEN** qualquer evento com detalhes é renderizado na linha do tempo, em qualquer perfil
- **THEN** a interface não exibe serialização JSON de detalhes nem identificadores internos do banco

### Requirement: Exportação da consulta corrente
A interface MUST exportar em CSV a consulta de projetos exibida, respeitando os filtros ativos e a projeção do perfil; a exportação de OPER MUST NOT conter colunas financeiras.

#### Scenario: Exportação com filtros
- **WHEN** o usuário exporta com filtros aplicados
- **THEN** o arquivo CSV contém exatamente o subconjunto exibido na listagem

#### Scenario: Exportação de OPER
- **WHEN** o OPER exporta a consulta
- **THEN** o CSV contém somente as colunas da projeção operacional

### Requirement: Valor do projeto na projeção administrativa
O valor do projeto MUST constar exclusivamente na projeção administrativa: a listagem de ADM MUST exibir coluna "Valor" formatada como moeda pt-BR, o detalhe de ADM MUST exibir linha "Valor" no card "Dados do projeto", e o CSV exportado por ADM MUST conter a coluna de valor do projeto. A projeção operacional MUST NOT expor o valor do projeto em nenhuma superfície (listagem, detalhe ou CSV de OPER).

#### Scenario: ADM visualiza valor na listagem
- **WHEN** o ADM abre a listagem de projetos
- **THEN** a coluna "Valor" exibe o valor de cada projeto formatado como moeda pt-BR

#### Scenario: ADM visualiza valor no detalhe
- **WHEN** o ADM abre o detalhe de um projeto
- **THEN** o card "Dados do projeto" exibe a linha "Valor" com o valor formatado como moeda pt-BR

#### Scenario: CSV de ADM inclui valor
- **WHEN** o ADM exporta a consulta corrente
- **THEN** o CSV contém a coluna de valor do projeto junto às colunas da projeção administrativa

#### Scenario: OPER não vê o valor em nenhuma superfície
- **WHEN** o OPER usa a listagem, o detalhe ou a exportação CSV
- **THEN** nenhuma coluna, linha ou campo de valor do projeto é exibido

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

### Requirement: Pasta local no detalhe do projeto
O detalhe do projeto MUST exibir a pasta local nos dados do projeto, para ADM e OPER, quando ela estiver definida — a localização física dos arquivos técnicos não é dado financeiro e não segue as restrições do resumo financeiro. Quando não definida, o detalhe MUST indicar a ausência de forma neutra (placeholder "—", padrão dos demais campos do card), sem oferecer cópia nem abertura. Para um projeto com pasta definida, a interface MUST oferecer a cópia do caminho para a área de transferência a qualquer perfil com acesso ao detalhe, inclusive em projeto cancelado. A pasta local MUST NÃO constar na listagem de projetos, nos filtros e na exportação CSV da consulta corrente, nem na linha do tempo como campo exibido em evento.

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
