## ADDED Requirements

### Requirement: Edição de identificadores em CADASTRADO
A interface MUST oferecer a ação "Editar" na tela de detalhe somente para projeto em status `CADASTRADO` e somente ao ADM, abrindo diálogo com os campos "Identificador do cliente" e "Identificador da operadora" pré-preenchidos com os valores atuais. A edição MUST abranger apenas o texto desses dois identificadores: cliente e operadora vinculadas e os demais dados do projeto MUST NOT ser alteráveis por essa ação. A interface MUST validar localmente que ambos os campos, após remoção de espaços das pontas, não estejam vazios antes de chamar a RPC `editar_identificadores_projeto`, que MUST ser transacional, MUST exigir perfil ADM e status `CADASTRADO` e MUST atualizar os dois identificadores em uma única operação. Com sucesso, o projeto MUST registrar na linha do tempo o evento `Alteração cadastral` com o registro de quem alterou e quando, sem detalhes dos valores, e os dados atualizados MUST refletir imediatamente na listagem, no detalhe e na linha do tempo. Quando os dois valores submetidos forem idênticos aos vigentes, a RPC MUST NOT alterar o projeto nem gravar evento.

#### Scenario: Edição válida por ADM
- **WHEN** o ADM abre o detalhe de um projeto em status `CADASTRADO`, clica em "Editar", altera um dos identificadores e confirma
- **THEN** os dois identificadores são atualizados e o projeto registra o evento "Alteração cadastral" na linha do tempo

#### Scenario: Reflexo imediato dos valores editados
- **WHEN** a edição é confirmada com sucesso
- **THEN** os novos identificadores aparecem no detalhe e na listagem, e o evento "Alteração cadastral" com autor e data aparece na linha do tempo sem recarregar a página

#### Scenario: Campo vazio ou só de espaços
- **WHEN** o ADM submete o diálogo com algum identificador vazio ou composto apenas por espaços
- **THEN** a interface bloqueia o envio localmente antes de chamar a RPC

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
- **WHEN** o ADM confirma o diálogo com os dois identificadores idênticos aos vigentes
- **THEN** a RPC não altera o projeto e não grava evento, e a linha do tempo permanece como estava

#### Scenario: Cliente e operadora vinculadas preservadas
- **WHEN** o ADM edita os identificadores de um projeto
- **THEN** o cliente e a operadora vinculadas ao projeto permanecem os mesmos antes e depois da edição
