## Context

A tela "Minha senha" (`src/routes/usuarios/minha-senha.tsx`) comprova a credencial atual com um `signInWithPassword` prévio (design D6 do change arquivado do toggle de campo) e depois troca a senha com `updateUser({ password })`. O servidor Auth do projeto agora tem `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` ativo: `PUT /auth/v1/user` com `password` e sem `current_password` responde 400 com `error_code: current_password_required`, e a mensagem crua em inglês chega ao toast via `mensagemDeErro` (`src/lib/formato.ts`), que hoje só traduz códigos Postgres. Reprodução por chamada direta à API Auth do projeto (set/2026) confirmou os três códigos possíveis: `current_password_required` (campo ausente), `current_password_invalid` (credencial errada — com o mesmo `msg` do anterior, só o `error_code` difere) e `same_password` (nova senha igual à atual, 422). O auth-js 2.115.0 instalado já suporta `current_password` em `UserAttributes` e copia o `error_code` do servidor para `AuthApiError.code`.

## Goals / Non-Goals

**Goals:**

- Troca da própria senha funcionando de novo, com a comprovação da credencial resolvida na própria chamada de troca.
- Recusas exibidas em português amigável, sem mensagem bruta do servidor.
- Mensagem específica para nova senha igual à atual.

**Non-Goals:**

- Qualquer alteração no Supabase (schema, configuração de Auth, Edge Functions, RLS) — a exigência já está ativa no servidor e nada muda nele.
- Mudança nos demais fluxos de senha (criação com senha inicial e redefinição pelo ADM, que passam pela Edge Function `admin-usuarios`).
- Internacionalização dinâmica: mensagens fixas em português, como o resto da interface.
- Reautenticação por nonce/MFA (o projeto não usa fatores).

## Decisions

**D1 — Comprovação server-side: `updateUser({ password, current_password })` e remoção do `signInWithPassword` prévio.** O servidor passa a exigir e validar a credencial atual na própria chamada; enviar o campo resolve o 400. O `signInWithPassword` prévio vira redundância com efeitos colaterais: requisição extra, emissão de sessão nova (substitui os tokens salvos) e atualização de `last_sign_in_at` a cada tentativa de troca. *Alternativas rejeitadas:* manter os dois mecanismos (a dupla checagem paga os efeitos colaterais sem ganho de comportamento); desligar a configuração no dashboard do Supabase (enfraquece a segurança do fluxo e a configuração é gerida pela plataforma, nem exposta em `config.toml`).

**D2 — Tradução por `error_code` (lido em `error.code`), nunca por texto.** O servidor responde `current_password_required` e `current_password_invalid` com o mesmo `msg` — só o `error_code` distingue os casos. O auth-js copia `error_code` para `AuthApiError.code`, campo que `mensagemDeErro` já lê. Novo mapa de códigos Auth no mesmo ponto do tradutor:

| `error.code` | Mensagem |
|---|---|
| `current_password_invalid` | Credencial atual não comprovada. Verifique a senha atual. |
| `current_password_required` | Credencial atual não comprovada. Verifique a senha atual. |
| `same_password` | A nova senha deve ser diferente da senha atual. |

`current_password_required` é salvaguarda: com o campo enviado não deve ocorrer; se ocorrer (regressão futura), a mensagem certa ainda aparece. *Alternativa rejeitada:* casar por substring da mensagem — o servidor repete o mesmo texto entre casos distintos.

**D3 — Pass-through mantido para os demais erros Auth.** Erros fora do mapa (rede, sessão expirada, senha vazada/leaked-password) seguem o caminho atual de `mensagemDeErro` (`error.message`). O tradutor continua aditivo: só entra quando há tradução certa.

**D4 — Sem testes automatizados; verificação por build e navegador** (padrão do projeto, cf. D5 do change `traduzir-erros-constraint`). Roteiro manual: troca válida, credencial atual errada, nova senha igual à atual, e conferência de que o botão segue bloqueado com nova senha abaixo do mínimo.

## Risks / Trade-offs

- [A configuração server-side ser desligada no futuro] → Com `current_password` enviado, a chamada segue válida (o campo é ignorado quando a exigência não está ativa); a ressalva é que a comprovação deixa de recusar credencial errada nesse cenário — a reavaliar se a plataforma mudar o padrão, embora a direção observada seja endurecer, não afrouxar.
- [Servidor introduzir códigos Auth novos sem entrada no mapa] → Pass-through atual prevalece (mensagem crua); o mapa é barato de estender.
- [`same_password` surfar em outro fluxo de senha futuro] → A mensagem é específica, mas correta em qualquer tela de troca de senha; o mapa centralizado permite refinar por contexto se isso acontecer.

## Migration Plan

Somente frontend, dois arquivos; nenhum recurso Supabase a implantar — a configuração de Auth já está ativa no projeto remoto e nada muda nele (nada a fazer via MCP). Deploy normal no Vercel, efeito imediato. Rollback: revert do commit e redeploy — o pior caso volta ao erro atual, sem corromper dados.

## Open Questions

Nenhum.
