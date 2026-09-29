# Proposal

## Why

Na administração de usuários, a modal de edição oferece `Ações do usuário` (`Redefinir senha` e `Inativar`/`Reativar`) também quando o usuário em edição é o próprio usuário logado. Inativar a si mesmo derruba a própria sessão com um clique — a salvaguarda de último ADM ativo só cobre o caso de um único ADM —, e redefinir a própria senha pela ação de admin dispensa a prova da credencial atual que a página `Minha senha` exige. Nenhuma dessas ações faz sentido sobre o próprio registro.

## What Changes

- A modal de edição `Editar usuário` deixa de exibir o bloco `Ações do usuário` (separador, título e botões) quando o usuário em edição é o usuário logado; a modal segue oferecendo a edição de perfil, nome e e-mail com `Salvar`.
- Para os demais usuários, a modal permanece exatamente como está.
- Mudança apenas na interface: a Edge Function `admin-usuarios` e o banco não mudam. A guarda contra chamada direta à função com alvo igual ao chamador permanece responsabilidade da função (risco conhecido, fora de escopo).

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `administracao-usuarios`: os requisitos `Inativação e reativação` e `Redefinição de senha pelo ADM` passam a aplicar-se a outro usuário; para o próprio registro do usuário logado, a modal de edição oferece apenas a alteração de perfil, nome e e-mail.

## Impact

- `src/routes/usuarios/usuarios.tsx` (`DialogEditarUsuario`): comparação entre o `id` do usuário em edição e o `id` do usuário da sessão (`useRouteLoaderData("shell")`) e renderização condicional do bloco de ações.
- Spec `administracao-usuarios`: delta nos dois requisitos citados.
- Sem alteração em backend, banco, dependências ou rotas.
