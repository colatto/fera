# Design — handler-abrir-pasta

## Context

A change arquivada `2026-09-24-script-pasta-local` escolheu o protocolo nativo `search-ms` para abrir a pasta sem instalar nada. A investigação na máquina homologada (Windows 11 + Chrome, pasta existente) demonstrou que essa escolha não entrega o objetivo: com `crumb=location` o Windows recusa subpastas ("O Windows não pode encontrar" no Executar; nada acontece via Chrome) ou abre uma janela de pesquisa com o caminho na caixa de busca; a raiz da unidade abre, mas como "Resultados da Pesquisa em P:\" — o próprio Windows canônica a janela de sucesso como pesquisa. A emissão do app está correta (a caixa de busca recebe o caminho cru, prova de que o URI chega e é decodificado); o mecanismo é que não serve. Abrir a pasta de verdade exige rodar `explorer.exe` na máquina — o plano original `fera-pasta:` (handler PowerShell + registro HKCU), descartado no commit `c12d7ba` para evitar instalação, e cujo design está preservado em `git show c12d7ba^:openspec/changes/script-pasta-local/design.md` (D4/D5). O detalhe do projeto já exibe a pasta com "Copiar" (fallback universal) e a âncora é emitida somente quando `pastaValida` casa (`^[A-Za-z]:\\`, sem caracteres de controle) — nada disso muda. Sem qualquer alteração de banco: a change não toca MCP Supabase.

## Goals / Non-Goals

**Goals:**

- Clique em **Abrir pasta** abre uma janela de pasta comum (explorer.exe) no caminho cadastrado — sem modo de pesquisa.
- Handler instalável uma única vez por máquina/usuário, sem elevação, a partir de artefatos versionados no repositório.
- Degradação sem erro em toda falha (handler ausente, confirmação negada, protocolo bloqueado); cópia universal como alternativa.
- Superfície de ataque mínima: o handler valida o padrão de caminho e só conversa com `explorer.exe`.

**Non-Goals:**

- Alterar banco, RPCs, views, tipos ou o diálogo "Editar" — a persistência da pasta fica intocada.
- Detectar a presença do handler pela interface (o navegador não expõe esse sinal) — sem estado "handler instalado/não instalado" na UI.
- Instalador assinado, MSI ou distribuição automática pela aplicação — o push por TI, se houver, é responsabilidade da TI.
- Abertura em macOS/Linux/mobile; caminhos UNC — segue o padrão declarado de letra de unidade.
- Manter o `search-ms` como fallback — quebrado para subpastas nesta build e, mesmo funcionando, abre pesquisa.

## Decisions

### D1 — Protocolo customizado `fera-pasta:abrir?caminho=` + handler local (recupera o plano original)
Esquema opaco (`fera-pasta:abrir?caminho=<caminho codificado>`): na normalização do navegador nada vira "host". O handler é registrado em `HKCU\Software\Classes\fera-pasta` e o comando executa `powershell.exe` com o script do repositório. É o único mecanismo capaz de abrir janela de pasta comum a partir do navegador; a evidência da investigação está no Contexto. Alternativas rejeitadas nesta rodada: manter `search-ms` com qualquer variante de sintaxe — testado exaustivamente na máquina (cru, codificado, barras normais, via Executar e via Chrome), o handler do Windows não honra localização de subpasta e o teto do protocolo é janela de pesquisa; extensão de navegador ou executável assinado — custo/complexidade sem ganho sobre o PowerShell auditável.

### D2 — `abrir-pasta.ps1`: decodificação dupla + validação + `explorer.exe`, nada mais
O script recebe a URL completa em `%1`, extrai o valor de `caminho=`, decodifica percent-encoding **até duas passadas** (`[System.Uri]::UnescapeDataString`, que decodifica sequências UTF-8 — cobre espaços e acentos; a segunda passada cobre o re-encode do Chrome observado no despacho de protocolos customizados), valida: casa `^[A-Za-z]:\\`, sem caracteres de controle. Falhou → encerra sem abrir nada e sem executar qualquer comando com o conteúdo recebido. Válido → `Start-Process explorer.exe "<caminho>"`. `explorer.exe` com caminho de pasta abre janela de pasta comum; com caminho inválido o Windows apenas não abre nada. Nenhuma outra execução, download ou escrita com o conteúdo recebido.

### D3 — `instalar.cmd`/`remover.cmd`: HKCU por usuário, sem elevação
`instalar.cmd` cria `HKCU\Software\Classes\fera-pasta` com valor vazio `URL Protocol` e `shell\open\command` = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<caminho absoluto do ps1>" "%1"`, com o caminho do ps1 resolvido por `%~dp0` (relativo ao instalador). Por usuário: não exige admin, não exige consentimento de máquina. `remover.cmd` faz `reg delete` da chave. `README.md` documenta instalação, primeiro clique (diálogo do Chrome com "Sempre permitir"), remoção, ambiente homologado (Windows 11 + Chrome) e limitação a letra de unidade. `-ExecutionPolicy Bypass` vale só para o processo invocado — nenhuma política da máquina é alterada; `-WindowStyle Hidden` minimiza o flash de console.

### D4 — Frontend: uma âncora, mesmo gate, fallback de cópia inalterado
Em `projeto-detalhe.tsx`, o `href` da âncora "Abrir pasta" vira `"fera-pasta:abrir?caminho=" + encodeURIComponent(c.pasta_local)` — mesmo gate atual (`p.pasta_local && pastaValida(p.pasta_local)`), mesmo botão, "Copiar" permanece. O comentário adjacente é reescrito (a justificativa do `search-ms` deixa de valer). Sem estado novo, sem componente novo, sem detecção de handler.

### D5 — Purpose da spec principal atualizado
O `Purpose` de `openspec/specs/abertura-pasta-local/spec.md` ainda descreve "protocolo nativo search-ms, sem que nada precise ser instalado" — passa a descrever o mecanismo real (protocolo customizado atendido por handler local por usuário). Edições de Purpose de capability existente são feitas na spec principal, fora do delta.

## Risks / Trade-offs

- [O Chrome pode re-codificar a URL ao despachar o protocolo] → o script decodifica até duas passadas e valida o padrão; o roteiro de validação cobre caminho com espaços e acentos na máquina real.
- [Handler ausente em máquina nova] → o Chrome mostra o diálogo padrão de protocolo sem destino e nada abre; a aplicação não erra e a cópia cobre o fluxo. Instalação é uma ação única documentada no README.
- [Flash de console do PowerShell na primeira janela] → `-WindowStyle Hidden` minimiza; resíduo aceito no design original. Alternativa (exe compilado/assinado) rejeitada por custo.
- [Qualquer site pode invocar `fera-pasta:`] → o script só executa `explorer.exe` com caminho que casa com o padrão validado; o pior caso é uma janela de pasta. Protocolo bloqueável por política (URLBlocklist) — cópia permanece.
- [Instalação por usuário pode não acontecer em todas as máquinas] → sem mecanismo de verificação pela aplicação (decisão D4/Non-Goal); o README orienta e a TI pode empurrar o `instalar.cmd` por GPO/script de logon se houver.
- [PowerShell bloqueado por política corporativa mais restritiva] → mesmo fallback da cópia; ambiente homologado declarado Windows 11 + Chrome.

## Migration Plan

1. Criar `handler-pasta-local/` (ps1, dois .cmd, README) no repositório.
2. Trocar o `href` da âncora e o comentário em `projeto-detalhe.tsx`; `npm run build` para validar.
3. Instalar o handler na(s) máquina(s) homologada(s) (rodar `instalar.cmd` uma vez).
4. Validar na máquina: clique → diálogo do Chrome (marcar "Sempre permitir") → janela de pasta comum com o caminho na barra de endereço, incluindo caminho com espaços e acentos; confirmar degradação sem handler (máquina sem registro) e a cópia.
5. Atualizar o `Purpose` da spec principal (D5).

Rollback: reverter a âncora para a emissão anterior (um commit) e rodar `remover.cmd` nas máquinas — não há estado no banco nem artefato persistido pela aplicação.

## Open Questions

(nenhuma — a distribuição opcional pela TI não muda artefatos nem requisitos.)
