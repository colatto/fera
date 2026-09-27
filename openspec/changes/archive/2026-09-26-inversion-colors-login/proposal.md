# Proposal

## Why

Na tela de login, o wordmark fica solto no fundo da página, separado da modal de acesso: a marca não acompanha a entrada de credenciais e a composição atual (card mais escura que o fundo) não destaca a modal. Movendo o wordmark para dentro da modal e invertendo as duas cores, a marca se funde com a modal — que passa a ser a superfície clara sobre o fundo escuro.

## What Changes

- Wordmark `feralogo.jpg` movido para dentro da modal de acesso (primeiro filho da `Card`), centralizado, mantendo o tamanho atual (`w-56`); o fundo navy embutido do JPG se funde com a nova cor da modal.
- Fundo da modal de login passa a ser `oklch(0.363 0.079 264.8)`.
- Fundo da tela de login passa a ser `oklch(0.322 0.054 268.8)`.
- Escopo restrito à tela de login: os tokens do tema (`--background`, `--card` em `src/index.css`) não mudam; todas as demais telas permanecem como estão (decisão confirmada com o usuário na exploração).
- Sem alteração de backend, de dependências nem de assets.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `interface-web`: o requisito "Identidade visual Fera" passa a fixar a composição da tela de login — wordmark exibido dentro da modal de acesso e as duas cores da tela (modal e fundo) com valores exatos; o shell e as demais telas permanecem cobertos pelo texto atual do requisito.

## Impact

- Código: `src/routes/login.tsx` (composição e classes de cor locais; nenhum outro arquivo).
- Sem mudanças em `src/index.css` (tokens do tema intactos), no shell, no Supabase ou nas dependências do npm.
- Specs: delta em `openspec/specs/interface-web/spec.md` (requisito "Identidade visual Fera").
