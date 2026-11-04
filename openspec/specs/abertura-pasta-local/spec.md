## Purpose

Permitir que o usuário abra, com um clique a partir do detalhe do projeto, a pasta local onde os arquivos técnicos do projeto vivem — por meio do protocolo customizado `fera-pasta`, atendido por um handler local instalado uma única vez por máquina/usuário a partir dos artefatos distribuídos pelo repositório, que abre uma janela de pasta comum do Explorador de Arquivos no caminho informado.

## Requirements

### Requirement: Abertura da pasta com um clique
Para um projeto com pasta local definida, a interface MUST oferecer a ação **Abrir pasta**, que aciona o protocolo customizado `fera-pasta` com o caminho codificado (`fera-pasta:abrir?caminho=<caminho url-codificado>`). O handler local instalado na máquina MUST abrir uma **janela de pasta comum** no caminho recebido — `explorer.exe` posicionado na pasta, com o caminho na barra de endereço e navegação normal, **sem modo de pesquisa** (a janela MUST NÃO ser "Resultados da Pesquisa" nem variante do protocolo `search-ms`). O ambiente homologado é Windows 11 com Google Chrome. O handler é instalado uma única vez por máquina/usuário, sem elevação de administrador, a partir dos artefatos distribuídos pelo repositório. O primeiro acionamento em cada máquina MUST depender da confirmação do usuário no diálogo de protocolo externo do Chrome; após a permissão do site, os acionamentos seguintes MUST abrir diretamente. O link de abertura MUST ser emitido somente quando o projeto tem pasta local definida. A interface MUST NÃO depender da abertura para nada além da conveniência: handler ausente, confirmação negada, protocolo bloqueado por política do navegador ou qualquer falha do acionamento não pode causar erro de aplicação.

#### Scenario: Abertura com handler instalado
- **WHEN** o usuário clica em Abrir pasta em uma máquina com o handler `fera-pasta` instalado
- **THEN** o Explorador de Arquivos abre uma janela de pasta comum posicionada na pasta cadastrada, com o caminho na barra de endereço, sem modo de pesquisa

#### Scenario: Primeira abertura
- **WHEN** o usuário clica em Abrir pasta pela primeira vez em uma máquina
- **THEN** o Google Chrome exibe o diálogo de confirmação de protocolo externo e, após a confirmação, a janela de pasta é aberta no caminho

#### Scenario: Caminho com caracteres especiais
- **WHEN** a pasta cadastrada contém espaços, acentos ou barras invertidas
- **THEN** o handler decodifica o caminho recebido e a janela de pasta é aberta no caminho original, sem distorção

#### Scenario: Abertura sem qualquer instalação
- **WHEN** o usuário clica em Abrir pasta em uma máquina Windows sem nenhum componente instalado pela aplicação
- **THEN** o Chrome exibe o diálogo padrão de protocolo externo sem aplicativo de destino, nada é aberto, a aplicação segue funcionando sem erro e a cópia do caminho permanece disponível

#### Scenario: Confirmação negada ou protocolo bloqueado
- **WHEN** o usuário nega o diálogo de protocolo externo, ou o navegador tem o protocolo bloqueado por política
- **THEN** nada é aberto e a aplicação segue funcionando sem erro

### Requirement: Emissão restrita do link de abertura
A interface MUST emitir o link de abertura somente a partir de um caminho já validado no padrão Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida, sem caracteres de controle — padrão garantido pela validação da edição e pela restrição da tabela. O link MUST NÃO conter nada além do esquema `fera-pasta:abrir?caminho=` e do caminho codificado (nenhum outro parâmetro ou conteúdo). O handler MUST NÃO baixar nem executar conteúdo com o que recebe: decodifica, valida o mesmo padrão de caminho Windows e chama o Explorador com o caminho — conteúdo recebido fora do padrão MUST NÃO abrir nada e não pode ser passado a nenhum outro comando. Pasta armazenada fora do padrão (fora da validação de escrita) MUST NÃO ter link de abertura emitido, permanecendo o caminho exibido no detalhe.

#### Scenario: Caminho válido é aberto
- **WHEN** a interface emite `fera-pasta:abrir?caminho=P%3A%5CProjetos%5CF-2026-0042`
- **THEN** o handler decodifica o parâmetro e o Explorador abre a pasta `P:\Projetos\F-2026-0042` em janela de pasta comum

#### Scenario: Link restrito aos parâmetros previstos
- **WHEN** o link de abertura é emitido para uma pasta cadastrada
- **THEN** o link contém somente o esquema `fera-pasta:abrir?caminho=` com o caminho codificado, sem outros parâmetros ou conteúdos

#### Scenario: Handler descarta conteúdo fora do padrão
- **WHEN** o handler recebe uma URL cujo caminho decodificado não casa com o padrão de caminho Windows validado
- **THEN** nada é aberto e nenhum comando é executado com o conteúdo recebido

#### Scenario: Caminho fora do padrão não é emitido
- **WHEN** a pasta armazenada não atende ao padrão de caminho Windows validado
- **THEN** nenhum link de abertura é emitido e o caminho continua exibido no detalhe
