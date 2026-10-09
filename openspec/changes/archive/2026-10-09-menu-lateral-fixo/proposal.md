# Proposal

## Why

A sidebar do shell rola junto com a página: páginas longas (ex.: listagem de 50 projetos) fazem o menu desaparecer da tela durante a rolagem, forçando o usuário a voltar ao topo para navegar. O menu é o elemento de navegação permanente e deve permanecer visível.

## What Changes

- O `<aside>` do `Shell` passa a ter altura de viewport e fica fixo no topo da tela em desktop (`md:sticky md:top-0 md:h-svh`), permanecendo visível durante toda a rolagem.
- Em viewports estreitos (mobile) nada muda: a sidebar continua empilhada no topo e rolando com a página.
- O bloco de usuário e o botão "Encerrar sessão" no pé da sidebar passam a ficar sempre visíveis em desktop, em vez de só aparecerem ao rolar até o fim da página.
- Novo requirement no spec `interface-web` sobre fixação da sidebar; nenhum requisito existente é alterado.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `interface-web`: novo requirement "Menu fixo no desktop" — a sidebar MUST permanecer fixa durante a rolagem da página em viewports largos, com rolagem interna quando o menu exceder a altura da viewport.

## Impact

- `src/components/shell.tsx`: classes do `<aside>` (única alteração de código).
- Nenhum impacto em banco de dados, Supabase, rotas ou autenticação.
- O rodapé institucional sticky no `main` não é afetado: o scrollport continua sendo o documento.
