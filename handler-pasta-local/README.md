# Handler de abertura de pasta local (`fera-pasta`)

Artefatos do protocolo customizado `fera-pasta:`, usado pelo botão **Abrir pasta**
do detalhe do projeto. O clique na aplicação emite
`fera-pasta:abrir?caminho=<caminho url-codificado>`; este handler, instalado na
máquina do usuário, decodifica o caminho, valida o padrão Windows e abre o
Explorador de Arquivos em **janela de pasta comum** (com o caminho na barra de
endereço e navegação normal — sem modo de pesquisa).

## Instalação (uma única vez por máquina/usuário)

1. Copie este diretório para a máquina (ou deixe-o no clone do repositório).
2. Execute `instalar.cmd` (duplo clique). Sem elevação de administrador: as
   chaves são criadas em `HKCU\Software\Classes\fera-pasta`, para o usuário atual.
3. O script confirma o registro ao final, exibindo a chave `shell\open\command`
   apontando para o `abrir-pasta.ps1` absoluto.

## Primeiro clique

Na primeira abertura, o Google Chrome exibe o diálogo de protocolo externo
("Este site está tentando abrir..."). Marque **Sempre permitir** e confirme.
A partir daí, os cliques seguintes abrem a janela de pasta diretamente, sem diálogo.

## Remoção

Execute `remover.cmd`: a chave `HKCU\Software\Classes\fera-pasta` é apagada e o
script confirma que ela não existe mais. Sem o handler, o clique em **Abrir
pasta** apenas não abre nada — a aplicação segue funcionando sem erro e o botão
**Copiar caminho** permanece como alternativa universal.

## Ambiente homologado

- Windows 11 com Google Chrome.
- PowerShell embutido do Windows (`powershell.exe`, versão 5.x) com a política
  padrão — `-ExecutionPolicy Bypass` vale apenas para o processo do handler;
  nenhuma política da máquina é alterada.

## Limitações

- O caminho cadastrado precisa ser um caminho Windows absoluto **iniciado por
  letra de unidade** (ex.: `P:\Projetos\F-2026-0042`) — o mesmo padrão validado
  pela edição na aplicação. Caminhos UNC (`\\servidor\...`) e caminhos relativos
  não são aceitos.
- Qualquer entrada cujo caminho decodificado fique fora desse padrão é
  descartada pelo script sem abrir nada e sem ser passada a nenhum outro comando.
