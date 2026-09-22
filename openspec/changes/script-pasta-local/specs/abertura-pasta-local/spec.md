## Purpose

Permitir que o usuário abra, com um clique a partir do detalhe do projeto, a pasta local onde os arquivos técnicos do projeto vivem — por meio de um protocolo customizado atendido por um handler instalado por usuário na máquina Windows — com cópia do caminho como fallback universal.

## ADDED Requirements

### Requirement: Abertura da pasta com um clique
Para um projeto com pasta local definida, a interface MUST oferecer a ação **Abrir pasta**, que aciona o protocolo customizado `fera-pasta` com o caminho codificado (`fera-pasta:abrir?caminho=<caminho url-codificado>`). O handler local MUST abrir a pasta no gerenciador de arquivos do Windows no caminho decodificado. O ambiente homologado é Windows 11 com Google Chrome. O primeiro acionamento em cada máquina MUST depender da confirmação do usuário no diálogo de protocolo externo do Chrome; após a permissão do site, os acionamentos seguintes MUST abrir diretamente. O link de abertura MUST ser emitido somente quando o projeto tem pasta local definida. A interface MUST NÃO depender da abertura para nada além da conveniência: a falha ou ausência do handler não pode causar erro de aplicação.

#### Scenario: Abertura com handler instalado
- **WHEN** o usuário clica em Abrir pasta em uma máquina com o handler instalado e autorizado
- **THEN** o Explorer abre a pasta no caminho cadastrado

#### Scenario: Primeira abertura
- **WHEN** o usuário clica em Abrir pasta pela primeira vez em uma máquina
- **THEN** o Google Chrome exibe o diálogo de confirmação de protocolo externo e, após a confirmação, a pasta é aberta

#### Scenario: Caminho com caracteres especiais
- **WHEN** a pasta cadastrada contém espaços, acentos ou barras invertidas
- **THEN** o caminho chega ao handler codificado e a pasta é aberta no caminho original, sem distorção

#### Scenario: Handler ausente
- **WHEN** o usuário clica em Abrir pasta em uma máquina sem o handler instalado
- **THEN** o Windows 11, acionado pelo Google Chrome, manifesta a ausência de aplicativo associado pelo seu mecanismo padrão e a aplicação segue funcionando, com a cópia do caminho disponível

### Requirement: Contrato e segurança do handler
O handler local MUST ser instalável por usuário, sem privilégios de administrador. Ao receber um acionamento, o handler MUST decodificar o caminho e validar que se trata de um caminho Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida; acionamento que não atenda a isso MUST ser descartado sem abrir nada. O handler MUST NÃO executar comandos com o conteúdo recebido além de abrir o gerenciador de arquivos no caminho validado. O instalador MUST registrar o protocolo para o usuário corrente e MUST vir acompanhado de instruções de instalação e remoção versionadas no repositório.

#### Scenario: Instalação por usuário
- **WHEN** o usuário executa o instalador em sua máquina Windows
- **THEN** o protocolo `fera-pasta` fica registrado para o usuário corrente, sem exigir elevação de administrador

#### Scenario: Caminho válido é aberto
- **WHEN** o handler recebe `fera-pasta:abrir?caminho=P%3A%5CProjetos%5CF-2026-0042`
- **THEN** o Explorer abre `P:\Projetos\F-2026-0042`

#### Scenario: Caminho fora do padrão é descartado
- **WHEN** o handler recebe um acionamento cujo caminho decodificado não inicia por letra de unidade com dois-pontos e barra invertida
- **THEN** nada é aberto e o handler encerra sem efeito

#### Scenario: Remoção do handler
- **WHEN** o usuário segue as instruções de remoção
- **THEN** o registro do protocolo é retirado do perfil do usuário e os acionamentos passam a não encontrar aplicativo associado
