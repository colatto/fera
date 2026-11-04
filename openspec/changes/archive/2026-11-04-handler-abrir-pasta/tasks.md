# Tasks

## 1. Handler local (`handler-pasta-local/`)

- [x] 1.1 Criar `handler-pasta-local/abrir-pasta.ps1`: recebe a URL em `%1` (param), extrai o valor de `caminho=`, decodifica com `[System.Uri]::UnescapeDataString` até duas passadas, valida `^[A-Za-z]:\\` sem caracteres de controle; inválido → encerra sem abrir nada; válido → `Start-Process explorer.exe "<caminho>"`; nenhum outro comando com o conteúdo recebido — verificar com entrada válida (`fera-pasta:abrir?caminho=P%3A%5CProjetos%5CF-2026-0042`), entrada re-codificada duas vezes, entrada com espaços/acentos e entrada fora do padrão (ex.: `...caminho=evil`), executando o script direto num PowerShell
- [x] 1.2 Criar `handler-pasta-local/instalar.cmd`: cria `HKCU\Software\Classes\fera-pasta` (`URL Protocol` vazio) com `shell\open\command` = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<caminho via %~dp0>abrir-pasta.ps1" "%1"` — verificar com `reg query` após rodar, confirmando o comando apontando para o ps1 absoluto
- [x] 1.3 Criar `handler-pasta-local/remover.cmd` (`reg delete` da chave) — verificar que após rodar, `reg query` não encontra mais a chave
- [x] 1.4 Criar `handler-pasta-local/README.md`: instalação (rodar `instalar.cmd` uma vez), primeiro clique (diálogo do Chrome, "Sempre permitir"), remoção (`remover.cmd`), ambiente homologado (Windows 11 + Google Chrome), limitação a letra de unidade e nota de que sem handler o clique apenas não abre nada

## 2. Frontend

- [x] 2.1 Em `src/routes/projetos/projeto-detalhe.tsx`, trocar o `href` da âncora "Abrir pasta" para `"fera-pasta:abrir?caminho=" + encodeURIComponent(p.pasta_local)` e reescrever o comentário adjacente (mesmo gate `p.pasta_local && pastaValida(p.pasta_local)`; "Copiar" inalterado) — verificar com `npm run build` (`tsc -b && vite build`) sem erro e conferindo na página o atributo da âncora para um projeto com pasta definida

## 3. Verificação integrada (máquina homologada: Windows 11 + Chrome)

- [x] 3.1 Instalar o handler (`instalar.cmd`) e clicar em **Abrir pasta** na primeira vez: diálogo de protocolo do Chrome → marcar "Sempre permitir" → abrir janela de pasta comum com o caminho na barra de endereço, sem modo de pesquisa — incluindo caminho com espaços e acentos
- [x] 3.2 Clicar de novo (sem diálogo): janela de pasta abre direta; navegar para cima dentro da janela funciona normalmente
- [x] 3.3 Degradar em máquina sem handler: clicar não abre nada, a aplicação segue sem erro e "Copiar caminho" permanece funcional; negar a confirmação do Chrome também não gera erro na aplicação
- [x] 3.4 Revisar os cenários da spec delta contra a implementação (abertura com handler, primeira abertura, caracteres especiais, handler ausente, confirmação negada, link restrito a `caminho=`, descarte fora do padrão pelo script, caminho fora do padrão sem link)

## Workflow follow-up

- Atualizar o `Purpose` de `openspec/specs/abertura-pasta-local/spec.md` para descrever o mecanismo real (protocolo customizado `fera-pasta` atendido por handler local por usuário), conforme design D5 — editar a spec principal diretamente antes do archive.
- Archivar a change ao final (`/opsx:archive`).
