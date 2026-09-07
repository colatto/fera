## Why

Toda ação de administração de usuários pela interface (criar, alterar, inativar, reativar, redefinir senha) falha com "Failed to send a request to the edge function": a Edge Function `admin-usuarios` não responde ao preflight CORS do navegador (devolve 405 sem headers de CORS), o navegador bloqueia o POST real e o `fetch` falha antes de qualquer resposta HTTP. A requisição nunca chega à lógica da função — a spec `administracao-usuarios` é impossível de satisfazer pelo navegador no estado atual. O teste da função deve ter sido feito por HTTP direto (curl), caminho onde CORS não existe.

## What Changes

- Edge Function `admin-usuarios` passa a responder `OPTIONS` (preflight) com status de sucesso e headers CORS, e a incluir `Access-Control-Allow-Origin` em **todas** as respostas — inclusive erros de validação, guarda e erros internos.
- Headers de CORS alinhados ao que o próprio gateway Supabase emite: origem `*`, headers permitidos `authorization, x-client-info, apikey, content-type`.
- O wrapper `src/lib/adminUsuarios.ts` deixa de exibir a mensagem crua do SDK em falha de comunicação (`FunctionsFetchError`, status 0): passa a exibir mensagem amigável de falha de comunicação com o servidor, distinguindo-a dos erros de negócio devolvidos pela função.
- Nenhuma mudança na lógica de negócio da função (guarda ADM, salvaguarda de último ADM, validações, compensações) nem no banco.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `administracao-usuarios`: nova exigência de que a Edge Function seja invocável pelo navegador — preflight `OPTIONS` aceito e headers CORS presentes em todas as respostas — e de que falha de comunicação (requisição que não chega à função) seja exibida pela interface como falha de comunicação, distinta das mensagens de erro da função.

## Impact

- **Edge Function `admin-usuarios`** (nova versão, implantação exclusivamente via MCP Supabase, conforme regras do projeto; sem arquivos locais de função).
- **`src/lib/adminUsuarios.ts`** — tratamento de `FunctionsFetchError`/status 0 em `chamarAdminUsuarios`/`mensagemErroFuncao`.
- Todas as telas de administração de usuários passam a operar pelo navegador (hoje, nenhuma ação funciona).
- Sem impacto em `banco.sql`, schema, RLS ou em outras Edge Functions.
