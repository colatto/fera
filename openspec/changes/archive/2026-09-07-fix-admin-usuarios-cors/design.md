## Context

A Edge Function `admin-usuarios` (v3, `verify_jwt: true`) responde apenas POST; toda resposta é montada pelo helper `json()`, que só define `Content-Type`. Medição no endpoint real (`functions/v1/admin-usuarios`):

- `OPTIONS` (preflight) atravessa o gateway e executa a função, que devolve `405 {"erro":"Método não suportado"}` **sem nenhum header CORS** — o navegador bloqueia o POST seguinte e o `fetch` falha (o SDK traduz como `FunctionsFetchError`).
- O gateway só acrescenta CORS (`access-control-allow-origin: *`, `access-control-allow-headers: authorization, x-client-info, apikey`) nas respostas que ele mesmo gera (ex.: 401 do `verify_jwt`); respostas produzidas pela função levam somente os headers que a função definir.

No cliente, `chamarAdminUsuarios` (src/lib/adminUsuarios.ts) já distingue `FunctionsHttpError` (lê o corpo `{ erro }`), mas o ramo de falha de transporte repassa a mensagem crua do SDK (`{status: 0, mensagem: error.message}`). Implantação e validação de recursos Supabase são exclusivas do MCP Supabase (regras do projeto); o código-fonte da função vive no próprio Supabase, não no repositório.

## Goals / Non-Goals

**Goals:**
- Tornar a função invocável pelo navegador em qualquer origem, com todos os erros de negócio legíveis pelo cliente.
- Distinguir, na interface, falha de comunicação de erro devolvido pela função.

**Non-Goals:**
- Mudar lógica de negócio, guarda ADM, salvaguarda de último ADM, validações ou contrato `{ acao, ...params }` / `{ erro }`.
- Restringir origens permitidas ou introduzir allowlist de domínios.
- Versionar código da função no repositório ou em `banco.sql`.

## Decisions

**D1 — CORS tratado dentro da função, não no gateway.** O gateway não injeta CORS em respostas da função (medido); a função é o único ponto que garante o header em sucesso e em erro. *Alternativa rejeitada:* depender do gateway — empiricamente falso para respostas da função e para o preflight, que chega ao código da função.

**D2 — `OPTIONS` respondido antes da checagem de método.** O preflight não carrega `Authorization` e o gateway o deixa passar sem verificar JWT (medido); portanto o handler atende `OPTIONS` primeiro, com status `204` e headers CORS (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`, `Access-Control-Max-Age`), sem tocar guarda nem body. Os demais métodos não-POST continuam em `405`, agora também com CORS.

**D3 — Origem `*`, alinhada ao gateway.** A autorização real é o JWT do chamador (`verify_jwt`) + guarda ADM no servidor; não há cookies envolvidos (supabase-js usa header `Authorization`), então `*` não enfraquece nada e é exatamente o que o gateway emite nas respostas dele. *Alternativa rejeitada:* espelhar `Origin` ou allowlist de domínios — acoplaria a função aos domínios de deploy (localhost de dev + Vercel) sem ganho de segurança.

**D4 — Headers centralizados no helper `json()`.** Toda resposta da função (sucesso, `HttpError`, 405, 500) passa por `json()`; acrescentar `Access-Control-Allow-Origin: *` ali garante cobertura total com um ponto único de mudança.

**D5 — Mensagem fixa para falha de comunicação no wrapper.** O ramo `status: 0` de `chamarAdminUsuarios` passa a lançar mensagem fixa em português ("Falha de comunicação com o servidor...") em vez de `error.message` do SDK; `status: 0` permanece o marcador de falha de transporte e `mensagemErroFuncao` não muda (já exibe `mensagem`). *Alternativa rejeitada:* traduzir mapeando mensagens do SDK — frágil e sem valor para o usuário.

**D6 — Implantação e referência somente pelo MCP.** Fluxo: `get_edge_function` para obter o código vigente → aplicar D2/D4 → `deploy_edge_function` (`verify_jwt: true` preservado). Nenhum arquivo local de função é criado; validação por `curl` no endpoint (preflight e respostas) e teste no navegador.

## Risks / Trade-offs

- [Redeploy acidentalmente altera lógica existente] → Diferenciar apenas D2/D4; revisar o conteúdo retornado por `get_edge_function` antes e depois do deploy.
- [`*` interpretado como permissividade em revisão] → Documentar que a proteção é `verify_jwt` + guarda ADM; sem cookies, `*` não amplia exposição.
- [`FunctionsFetchError` também ocorre em queda de rede real] → A mensagem fixa de D5 cobre ambos os casos (comportamento correto nos dois).
- [Sem versionamento local da função] → Compensado pelo histórico de versões do próprio Supabase e pelo registro deste change; rollback é o redeploy do conteúdo anterior via MCP.

## Migration Plan

O sistema já está em produção em `https://fera.ruatrez.com` (Vercel, SPA com rewrite). A D3 (origem `*`) mantém o fix agnóstico de domínio: produção, preview do Vercel e dev local são atendidos sem configuração por origem — nenhuma allowlist a atualizar se o domínio mudar.

1. Duas frentes de deploy independentes e retrocompatíveis, em ordem livre:
   - **Edge Function via MCP** (`deploy_edge_function`, `verify_jwt: true`): efeito imediato para todos os usuários — o frontend atual, que hoje falha por CORS, passa a operar no ato.
   - **Frontend no Vercel**: necessário apenas para o usuário receber a mensagem amigável da D5; até lá, a mensagem crua continua aparecendo no raro caso de falha de transporte.
   Nenhuma janela de manutenção: mudança sem banco, sem contrato novo, retrocompatível com a versão vigente de ambos os lados.
2. Validação de endpoint por `curl` (`OPTIONS` → `204` com CORS; POST sem auth → `401` do gateway; POST autenticado com conflito → `409` com `Access-Control-Allow-Origin` e corpo `{ erro }`), seguida da validação no navegador em produção (`fera.ruatrez.com`) conforme tasks.md — as ações sobre usuários usam conta de teste descartável, nunca conta real.
3. Rollback se necessário: redeploy do conteúdo da versão anterior obtido via `get_edge_function`.
