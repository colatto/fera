# Spec Delta

## ADDED Requirements

### Requirement: Edição da pasta local em qualquer status ativo
A interface MUST oferecer ao ADM a ação **"Editar"** na linha da pasta local do detalhe do projeto, em qualquer status, exceto `CANCELADO`; a ação MUST estar **oculta** em `CADASTRADO`, onde a edição da pasta permanece responsabilidade da ação "Editar" do cabeçalho (requisito "Edição de identificadores em CADASTRADO"). A ação MUST aparecer também quando a pasta local não está definida, ao lado do placeholder de ausência, permitindo incluir o caminho. A ação rotula-se "Editar" e abre diálogo com um único campo pré-preenchido com o caminho vigente, quando existir; deixar o campo vazio MEANS limpar a pasta local e MUST NOT impedir a confirmação. A interface MUST validar localmente que o caminho, quando preenchido e aparado nas pontas, corresponda a um caminho Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida, sem caracteres de controle; caminho que não atenda a isso MUST ser bloqueado localmente. Usuário OPER MUST NOT ter acesso à ação.

A RPC `editar_pasta_local` MUST ser transacional, MUST exigir perfil ADM e MUST recusar somente o status `CANCELADO` — qualquer outro status, inclusive `PAGO`, permite a edição. A RPC MUST atualizar apenas a pasta local do projeto: nenhum identificador, vínculo ou dado financeiro MUST ser alterável por ela. Caminho preenchido é aparado nas pontas e validado com o mesmo padrão do requisito local (padrão Windows absoluto, sem caracteres de controle, até 500 caracteres); caminho inválido informado é recusado. Com sucesso, o projeto MUST registrar na linha do tempo um único evento `Alteração cadastral` com o registro de quem alterou e quando, sem detalhes dos valores, e a pasta atualizada MUST refletir imediatamente no detalhe. Quando o caminho submetido for idêntico ao vigente, a RPC MUST NOT alterar o projeto nem gravar evento.

#### Scenario: ADM edita a pasta em projeto Pago
- **WHEN** o ADM aciona "Editar" na linha da pasta local de um projeto com status `PAGO` e confirma um caminho válido
- **THEN** a pasta local é atualizada, o detalhe passa a exibir o novo caminho e a linha do tempo registra o evento `Alteração cadastral`

#### Scenario: ADM inclui pasta em projeto sem pasta
- **WHEN** o ADM consulta o detalhe de um projeto sem pasta local definida, em status fora de `CADASTRADO` e `CANCELADO`
- **THEN** a ação "Editar" aparece ao lado do placeholder de ausência e permite cadastrar o caminho

#### Scenario: Ação oculta em CADASTRADO
- **WHEN** o projeto está em status `CADASTRADO`
- **THEN** a linha da pasta local não oferece a ação "Editar", pois a pasta é editável pela ação "Editar" do cabeçalho

#### Scenario: Ação indisponível em projeto cancelado
- **WHEN** o projeto está em status `CANCELADO`
- **THEN** nenhuma ação de edição da pasta local é oferecida, mantendo o caminho apenas exibido

#### Scenario: OPER não edita a pasta
- **WHEN** um usuário OPER consulta o detalhe de um projeto com pasta definida ou não
- **THEN** nenhuma ação de edição da pasta local é oferecida

#### Scenario: Campo vazio limpa a pasta
- **WHEN** o ADM confirma o diálogo com o campo vazio em um projeto com pasta definida
- **THEN** a pasta local é removida, o detalhe passa a indicar a ausência de forma neutra e a linha do tempo registra o evento

#### Scenario: Caminho inválido bloqueado
- **WHEN** o ADM informa um caminho que não atende ao padrão Windows validado
- **THEN** a confirmação é bloqueada localmente com mensagem explícita e a RPC não é chamada

#### Scenario: Envio idêntico ao vigente
- **WHEN** o caminho submetido é idêntico ao vigente do projeto
- **THEN** nenhum dado é alterado e nenhum evento é gravado
