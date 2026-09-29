# Design

## Context

A tela "Minha senha" (`src/routes/usuarios/minha-senha.tsx`) troca a senha com `updateUser({ password, current_password })` e exibe recusas via `mensagemDeErro` (`src/lib/formato.ts`), que traduz erros do Auth pelo `error_code` que o auth-js copia para `AuthApiError.code` (padrão do change `corrigir-minha-senha`: tradução por código, pass-through para códigos fora do mapa). O mapa não conhece `weak_password`, e o texto cru vaza.

Os fluxos ADM passam pela Edge Function `admin-usuarios` (contrato `{ acao, ...params }` → `{ erro }` por status HTTP), que hoje interpola a mensagem crua do Auth: `criar` responde `Falha ao criar credencial: ${erroCriar.message}` e `redefinirSenha` responde `Falha ao redefinir senha: ${erroSenha.message}`; o cliente exibe essa mensagem via `mensagemErroFuncao` sem alterá-la.

A política vigente foi confirmada por sonda na API Auth do projeto (setembro/2026, rejeição de senha fraca sem criar recurso): 422 com `error_code: weak_password`, `weak_password.reasons` variando entre `["length"]`, `["characters"]` ou ambos, e mensagem que concatena "Password should be at least 6 characters." com "Password should contain at least one character of each: a-z, A-Z, 0-9, símbolos…". O piso de 6 caracteres segue válido — `SENHA_MINIMA = 6` no cliente e na função permanece correto. O auth-js instalado (2.115.0) lança `AuthWeakPasswordError` com `code: "weak_password"` e `reasons: string[]`. Na Admin API usada pela função, o erro também carrega `code`, que a função já lê em `eEmailDuplicado`.

## Goals / Non-Goals

**Goals:**

- Recusas por política de força de senha em português amigável nos três fluxos de senha ("Minha senha", criação com senha inicial, redefinição pelo ADM).
- Formulários de senha anunciando a política vigente, prevenindo o erro.
- Padrão do tradutor preservado: por código, aditivo, sem casar por texto.

**Non-Goals:**

- Alterar a política de força no Auth ou o piso de 6 caracteres.
- Mudar o contrato `{ erro }` da função ou o mecanismo de exibição do cliente.
- Pré-validar as quatro classes no cliente ou na função (ver D2).

## Decisions

**D1 — Tradução de `weak_password` no mapa de códigos, com mensagem fixa que declara a política inteira.** Nova entrada em `MENSAGENS_AUTH`: `weak_password` → "A senha deve ter ao menos 6 caracteres e conter pelo menos uma letra minúscula, uma maiúscula, um dígito e um símbolo." Uma única mensagem cobre corretamente os três combos de `reasons` (length, characters, ambos) porque enuncia a política completa. *Alternativas rejeitadas:* mensagens diferenciadas por `reasons` — a granularidade disponível só distingue comprimento × classes (não identifica a classe faltante), o ganho não paga dois textos; casar por substring do texto — frágil e contraria o padrão de nunca traduzir por texto (o servidor repete e concatena frases entre casos).

**D2 — Edge Function: detecção por código, resposta 400 com a mesma mensagem.** Em `criar` e `redefinirSenha`, quando o erro do Auth tiver `code === 'weak_password'` (mesma leitura de `e.code` já usada em `eEmailDuplicado`), a função responde `HttpError(400, <mensagem fixa em português>)` em vez de interpolar `erro.message`. 400 por ser erro de entrada do chamador — a função já converte o 422 do Auth para 400 na criação. O contrato `{ erro }` e o cliente ficam intactos. *Alternativas rejeitadas:* pré-validar as classes na função ou no cliente — duplica a definição da política, que vive no Auth; se o console mudar, uma cópia local diverge e pode recusar senha válida ou aceitar inválida. A recusa do servidor, traduzida, é sempre a verdade.

**D3 — Dica preventiva fixa nos três formulários.** Texto curto fixo — "Mínimo 6 caracteres, com minúscula, maiúscula, dígito e símbolo." — como texto de apoio junto ao campo de nova senha em "Minha senha", ao campo de senha inicial no diálogo "Novo usuário" e ao campo de nova senha da redefinição na modal de edição. `SENHA_MINIMA` permanece 6. A mensagem completa (D1) e a função (D2) precisam da mesma frase em runtimes sem compartilhamento possível (frontend e função autônoma no Supabase): duplicação consciente, ambas estáveis por descreverem a política vigente.

**D4 — Sem testes automatizados; verificação por build, navegador e sonda** (padrão do projeto, cf. D5 do `traduzir-erros-constraint` e D4 do `corrigir-minha-senha`). Roteiro manual: senha fora da política nas três telas → mensagem em português, sem texto cru; credencial atual errada e nova senha igual à atual mantêm suas mensagens específicas; troca válida, criação válida e redefinição válida funcionam; dica visível nos três formulários; sonda à API Auth confirma que a política vigente continua a declarada na mensagem.

## Risks / Trade-offs

- [Política do Auth mudar no console (classes ou piso)] → Mensagem e dica defasam; os pontos são centralizados (uma entrada no mapa, uma constante na função, uma dica por formulário) e o ajuste é barato; o roteiro de verificação confere a política vigente por sonda.
- [Mensagem duplicada entre frontend e Edge Function] → Consciência da limitação de runtime; as tarefas explicitam os dois pontos para atualização conjunta.
- [Outros códigos do Auth sem entrada no mapa] → Pass-through mantido conforme o change `corrigir-minha-senha`; o mapa segue aditivo e barato de estender.

## Migration Plan

Frontend: deploy normal no Vercel, efeito imediato. Edge Function: implantar versão nova exclusivamente via MCP Supabase (regra do projeto; sem CLI, Docker ou arquivos locais de função), sem segredos ou variáveis novas. Rollback: revert do commit e redeploy do frontend e da função — o pior caso restaura o texto cru atual, sem corromper dados.

## Open Questions

Nenhum.
