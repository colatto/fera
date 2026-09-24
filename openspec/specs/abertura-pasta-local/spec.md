## Purpose

Permitir que o usuário abra, com um clique a partir do detalhe do projeto, a pasta local onde os arquivos técnicos do projeto vivem — por meio do protocolo nativo do Windows `search-ms:`, atendido pelo próprio sistema, sem que nada precise ser instalado na máquina — com a cópia do caminho como caminho universal.

## Requirements

### Requirement: Abertura da pasta com um clique
Para um projeto com pasta local definida, a interface MUST oferecer a ação **Abrir pasta**, que aciona o protocolo nativo do Windows `search-ms` com o caminho codificado (`search-ms:query=&crumb=location:<caminho url-codificado>`, com o crumb de localização separado do caminho por dois-pontos — sintaxe documentada do protocolo). O Windows MUST posicionar o Explorador de Arquivos na pasta indicada, mostrando seu conteúdo, sem que nenhum componente precise ser instalado na máquina. O ambiente homologado é Windows 11 com Google Chrome. O primeiro acionamento em cada máquina MUST depender da confirmação do usuário no diálogo de protocolo externo do Chrome; após a permissão do site, os acionamentos seguintes MUST abrir diretamente. O link de abertura MUST ser emitido somente quando o projeto tem pasta local definida. A interface MUST NÃO depender da abertura para nada além da conveniência: confirmação negada, protocolo bloqueado por política do navegador ou qualquer falha do acionamento não pode causar erro de aplicação.

#### Scenario: Abertura sem qualquer instalação
- **WHEN** o usuário clica em Abrir pasta em uma máquina Windows sem nenhum componente instalado pela aplicação
- **THEN** nada é instalado e, após a confirmação do navegador, o Explorador abre a janela posicionada na pasta cadastrada

#### Scenario: Primeira abertura
- **WHEN** o usuário clica em Abrir pasta pela primeira vez em uma máquina
- **THEN** o Google Chrome exibe o diálogo de confirmação de protocolo externo e, após a confirmação, o Explorador é aberto na pasta

#### Scenario: Caminho com caracteres especiais
- **WHEN** a pasta cadastrada contém espaços, acentos ou barras invertidas
- **THEN** o caminho chega ao Windows codificado e o Explorador é aberto no caminho original, sem distorção

#### Scenario: Confirmação negada ou protocolo bloqueado
- **WHEN** o usuário nega o diálogo de protocolo externo, ou o navegador tem o protocolo bloqueado por política
- **THEN** nada é aberto, a aplicação segue funcionando sem erro e a cópia do caminho permanece disponível

### Requirement: Emissão restrita do link de abertura
A interface MUST emitir o link de abertura somente a partir de um caminho já validado no padrão Windows absoluto iniciado por letra de unidade seguida de dois-pontos e barra invertida, sem caracteres de controle — padrão garantido pela validação da edição e pela restrição da tabela. O link MUST NÃO conter nada além de uma consulta vazia e da localização do caminho codificado (nenhum outro parâmetro), e o acionamento MUST NÃO baixar nem executar conteúdo: o protocolo nativo apenas posiciona o Explorador na pasta informada. Pasta armazenada fora do padrão (fora da validação de escrita) MUST NÃO ter link de abertura emitido, permanecendo a cópia disponível.

#### Scenario: Caminho válido é aberto
- **WHEN** a interface emite `search-ms:query=&crumb=location:P%3A%5CProjetos%5CF-2026-0042`
- **THEN** o Explorador é aberto posicionado em `P:\Projetos\F-2026-0042`

#### Scenario: Link restrito aos parâmetros previstos
- **WHEN** o link de abertura é emitido para uma pasta cadastrada
- **THEN** o link contém somente a consulta vazia e o parâmetro de localização com o caminho codificado, sem outros parâmetros ou conteúdos

#### Scenario: Caminho fora do padrão não é emitido
- **WHEN** a pasta armazenada não atende ao padrão de caminho Windows validado
- **THEN** nenhum link de abertura é emitido e a cópia do caminho permanece disponível
