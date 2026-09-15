## MODIFIED Requirements

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
