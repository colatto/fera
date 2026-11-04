# Proposal: handler-abrir-pasta

## Why

O botão **Abrir pasta** do detalhe do projeto não atingiu o objetivo da change `script-pasta-local` (arquivada): a investigação na máquina homologada (Windows 11 + Chrome) demonstrou que o protocolo `search-ms` não honra `crumb=location` para subpastas — o Windows recusa o acionamento ("O Windows não pode encontrar") ou abre uma janela de **pesquisa** com o caminho na caixa de busca — e que mesmo o caso de sucesso do `search-ms` abre "Resultados da Pesquisa em <pasta>", nunca uma janela de pasta. O usuário precisa que o clique abra a pasta de verdade, e isso exige executar `explorer.exe` na máquina — o navegador sozinho não executa processos.

## What Changes

- A âncora **Abrir pasta** (`projeto-detalhe.tsx`) passa a emitir `fera-pasta:abrir?caminho=<caminho url-codificado>` no lugar de `search-ms:query=&crumb=location:...` — a emissão continua restrita ao caminho validado no padrão Windows.
- Novo diretório `handler-pasta-local/` no repositório, instalado **uma única vez por máquina/usuário, sem elevação** (HKCU):
  - `abrir-pasta.ps1` — recebe a URL, decodifica (até duas passadas: o Chrome re-codifica a URL ao despachar protocolos customizados), valida o padrão de caminho Windows e chama `explorer.exe` com o caminho; inválido → encerra sem abrir nada.
  - `instalar.cmd` / `remover.cmd` — cria/remove `HKCU\Software\Classes\fera-pasta` (`shell\open\command` → `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<ps1>" "%1"`).
  - `README.md` — instalação, primeiro clique, remoção, ambiente homologado e limitações.
- **Copiar caminho** permanece como caminho universal — cobre a máquina sem handler instalado, confirmação negada ou protocolo bloqueado por política.
- **Sem mudança de banco**: coluna `pasta_local`, RPC `editar_identificadores_projeto`, views e `banco.sql` ficam intocados; diálogo "Editar" e validação de caminho permanecem como estão.
- A janela resultante é de **pasta comum** (`explorer.exe`), sem modo de pesquisa — requisito explícito que a spec anterior deixava ambíguo.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `abertura-pasta-local`: o mecanismo de abertura muda de `search-ms` (protocolo nativo, zero instalação) para o protocolo customizado `fera-pasta` atendido por handler local instalado por usuário (HKCU, sem admin); o requisito passa a exigir janela de pasta comum sem modo de pesquisa, define a degradação quando o handler não está instalado e mantém a emissão restrita ao caminho validado.

## Impact

- **Frontend**: `src/routes/projetos/projeto-detalhe.tsx` (apenas o `href` da âncora "Abrir pasta" e o comentário adjacente). Nenhuma query, tipo ou componente novo.
- **Novo diretório `handler-pasta-local/`** no repositório (4 arquivos: ps1, dois .cmd, README) — artefatos de distribuição versionados, sem instalação automática pelo app.
- **Instalação por máquina**: ação manual única por usuário (importar `instalar.cmd`), sem admin; pode ser empurrada pela TI se houver mecanismo de distribuição.
- **Supabase**: nenhuma alteração (sem MCP nesta change).
- **Máquinas sem handler**: o Chrome mostra o diálogo padrão de protocolo externo sem aplicativo de destino e nada abre — a aplicação não erra; a cópia permanece disponível.
- **Ambiente homologado**: Windows 11 com Google Chrome; validação manual na máquina (janela de pasta com caminho na barra de endereço, não "Resultados da Pesquisa").
