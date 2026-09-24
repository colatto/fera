## MODIFIED Requirements

### Requirement: Edição de identificadores em CADASTRADO
A interface MUST oferecer a ação "Editar" na tela de detalhe somente para projeto em status `CADASTRADO` e somente ao ADM, abrindo diálogo com os campos "Identificador do cliente" e "Identificador da operadora" pré-preenchidos com os valores atuais e o campo opcional "Pasta local" pré-preenchido com o caminho vigente, quando existir. A edição MUST abranger apenas o texto desses dois identificadores e a pasta local: cliente e operadora vinculadas e os demais dados do projeto MUST NOT ser alteráveis por essa ação. A interface MUST validar localmente que ambos os identificadores, após remoção de espaços das pontas, não estejam vazios antes de chamar a RPC `editar_identificadores_projeto`. A pasta local, quando preenchida, MUST ser aparada nas pontas e MUST corresponder a um caminho Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida, sem caracteres de controle; caminho que não atenda a isso MUST ser bloqueado localmente. Deixar o campo da pasta vazio MEANS limpar a pasta local do projeto; a pasta é opcional e sua ausência MUST NOT impedir a confirmação do diálogo.

A RPC `editar_identificadores_projeto` MUST ser transacional, MUST exigir perfil ADM e status `CADASTRADO` e MUST atualizar os dois identificadores e a pasta local em uma única operação: parâmetro de pasta ausente preserva o valor vigente, vazio limpa, e caminho inválido informado é recusado. Com sucesso, o projeto MUST registrar na linha do tempo um único evento `Alteração cadastral` com o registro de quem alterou e quando, sem detalhes dos valores, e os dados atualizados MUST refletir imediatamente no detalhe, na listagem (identificadores) e na linha do tempo. Quando os dois identificadores e a pasta submetidos forem todos idênticos aos vigentes, a RPC MUST NOT alterar o projeto nem gravar evento.

#### Scenario: Edição válida por ADM
- **WHEN** o ADM abre o detalhe de um projeto em status `CADASTRADO`, clica em "Editar", altera um dos identificadores e confirma
- **THEN** os dois identificadores são atualizados e o projeto registra um único evento "Alteração cadastral" na linha do tempo

#### Scenario: Edição define a pasta local
- **WHEN** o ADM confirma o diálogo preenchendo a Pasta local com um caminho Windows válido, com ou sem alteração nos identificadores
- **THEN** o caminho é gravado junto com os identificadores na mesma operação e passa a constar no detalhe, com um único evento "Alteração cadastral"

#### Scenario: Campo da pasta vazio limpa a pasta local
- **WHEN** o ADM confirma o diálogo deixando a Pasta local vazia em um projeto que a possui
- **THEN** a pasta local deixa de estar definida e o detalhe passa a indicar a ausência, com um único evento "Alteração cadastral"

#### Scenario: Pasta local com formato inválido
- **WHEN** o ADM informa um caminho que não inicia por letra de unidade com dois-pontos e barra invertida (por exemplo `Projetos/F-2026-0042`) ou contém caracteres de controle
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

#### Scenario: Reflexo imediato dos valores editados
- **WHEN** a edição é confirmada com sucesso
- **THEN** os novos identificadores aparecem no detalhe e na listagem, a pasta atualizada aparece no detalhe, e o evento "Alteração cadastral" com autor e data aparece na linha do tempo sem recarregar a página

#### Scenario: Campo de identificador vazio ou só de espaços
- **WHEN** o ADM submete o diálogo com algum identificador vazio ou composto apenas de espaços
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC, independentemente do conteúdo do campo da pasta

#### Scenario: Botão indisponível fora de CADASTRADO
- **WHEN** o ADM abre o detalhe de um projeto com status `ENVIADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA`, `PAGO` ou `CANCELADO`
- **THEN** a interface não oferece a ação "Editar", mantendo as demais ações do status

#### Scenario: RPC recusa não ADM
- **WHEN** uma chamada à RPC `editar_identificadores_projeto` é feita por usuário sem perfil ADM
- **THEN** a RPC falha com erro transacional de permissão e nenhum dado é alterado

#### Scenario: RPC recusa fora de CADASTRADO
- **WHEN** uma chamada à RPC `editar_identificadores_projeto` solicita edição para projeto em status diferente de `CADASTRADO`
- **THEN** a RPC falha com erro transacional informando que a edição exige status `CADASTRADO`, e os dados e a linha do tempo permanecem inalterados

#### Scenario: Submissão sem alteração efetiva
- **WHEN** o ADM confirma o diálogo com os dois identificadores e a pasta idênticos aos vigentes
- **THEN** a RPC não altera o projeto e não grava evento, e a linha do tempo permanece como estava

#### Scenario: Cliente e operadora vinculadas preservadas
- **WHEN** o ADM edita os identificadores de um projeto
- **THEN** o cliente e a operadora vinculadas ao projeto permanecem os mesmos antes e depois da edição
