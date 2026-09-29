# Proposal

## Why

O Supabase Auth do projeto passou a exigir (`GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD`) que a própria chamada de alteração de senha comprove a credencial atual, e a tela "Minha senha" quebrou: o cliente comprova a credencial com um `signInWithPassword` prévio, mas o `updateUser({ password })` é rejeitado pelo servidor (400 `current_password_required` — "Current password required when setting new password"), e a mensagem bruta em inglês vaza para o toast via `mensagemDeErro`. Erro reproduzido e correção validada por chamada direta à API Auth do projeto.

## What Changes

- Troca da própria senha: a comprovação da credencial atual passa a ser feita pelo servidor na própria chamada — `updateUser({ password, current_password })` — e o `signInWithPassword` prévio é removido (elimina requisição extra e a emissão de sessão nova a cada tentativa).
- `mensagemDeErro` passa a traduzir os códigos de erro do Auth por `error_code` (nunca pelo texto, que o servidor repete entre casos): `current_password_invalid` e `current_password_required` → mensagem amigável de credencial não comprovada; `same_password` → "a nova senha deve ser diferente da atual".
- Comportamento observável novo: tentativa com nova senha igual à atual passa a ser recusada com mensagem amigável (o servidor responde 422 `same_password`; antes era aceita silenciosamente, sem efeito visível).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `administracao-usuarios`: requisito "Troca da própria senha" — a recusa por credencial atual não comprovada passa a ser detectada na resposta da própria chamada de troca (validação do servidor via `current_password`), e nova senha igual à atual passa a ser recusada com mensagem amigável.

## Impact

- Código: `src/routes/usuarios/minha-senha.tsx` (fluxo `submeter`, remoção do bloco de comprovação) e `src/lib/formato.ts` (`mensagemDeErro` com mapeamento dos códigos do Auth).
- Supabase: nenhuma alteração — schema, configuração de Auth, Edge Functions e RLS não mudam; a exigência já está ativa no servidor do projeto. Nada a implantar via MCP.
- Dependências: nenhuma — `@supabase/auth-js` 2.115.0 (via `@supabase/supabase-js`) já suporta `current_password` em `updateUser`.
- Escopo restrito à tela "Minha senha" e ao tradutor de erros; demais fluxos de autenticação não são afetados.
