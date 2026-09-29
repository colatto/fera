# Proposal

## Why

A política de força de senha do Supabase Auth do projeto — mínimo de 6 caracteres e ao menos uma letra minúscula, uma maiúscula, um dígito e um símbolo, confirmada por chamada direta à API Auth (rejeição de senha fraca, sem efeito colateral) — recusa senhas fora da política com `error_code: weak_password` e mensagem bruta em inglês ("Password should contain at least one character of each…"). O tradutor de erros do cliente não conhece esse código e o texto cru vaza para o toast na tela "Minha senha"; os fluxos ADM de criação de usuário e redefinição de senha vazam o mesmo texto, interpolado pela Edge Function `admin-usuarios`. Além disso, nenhum formulário de senha anuncia as classes exigidas — o usuário só descobre a regra quando o erro estoura.

## What Changes

- `mensagemDeErro` passa a traduzir o código `weak_password` com mensagem fixa em português que declara a política inteira (mínimo de 6 caracteres e as quatro classes).
- Edge Function `admin-usuarios`: nas ações `criar` e `redefinir_senha`, o erro de política do Auth é detectado por `error_code` (nunca por texto) e devolvido como 400 com a mensagem amigável em `{ erro }` — o contrato do cliente não muda e já exibe a mensagem da função como está.
- Os três formulários de senha ("Minha senha", "Novo usuário" e a redefinição na modal de edição) passam a anunciar a política vigente, prevenindo o erro em vez de apenas traduzi-lo.
- A política vigente permanece: piso de 6 caracteres no cliente e na função continua correto; nenhum ajuste de configuração do Auth, schema ou RLS.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `administracao-usuarios`: requisitos "Troca da própria senha", "Criação de usuário com senha inicial" e "Redefinição de senha pelo ADM" — a recusa por senha fora da política de força passa a ser exibida com mensagem amigável, sem a mensagem bruta do servidor, e os formulários de senha passam a anunciar a política vigente.

## Impact

- Código: `src/lib/formato.ts` (entrada `weak_password` no mapa de códigos Auth), `src/routes/usuarios/minha-senha.tsx` (dica da política) e `src/routes/usuarios/usuarios.tsx` (dica nos diálogos de criação e redefinição).
- Supabase: somente a Edge Function `admin-usuarios` recebe versão nova, implantada via MCP Supabase — schema, Auth, RLS, views e segredos não mudam; nada a fazer em `banco.sql`.
- Dependências: nenhuma.
