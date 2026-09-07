## 1. Edge Function `admin-usuarios` (somente via MCP Supabase)

- [x] 1.1 Obter o código vigente da função com `get_edge_function` e conferir que corresponde ao esperado (v3, guarda ADM e ações intactas)
- [x] 1.2 Aplicar D2 e D4 do design: atendimento antecipado de `OPTIONS` com `204` + headers CORS (`*`, métodos `POST, OPTIONS`, headers `authorization, x-client-info, apikey, content-type`) e acréscimo de `Access-Control-Allow-Origin: *` no helper `json()`
- [x] 1.3 Implantar a nova versão com `deploy_edge_function` mantendo `verify_jwt: true`
- [x] 1.4 Reobter a função com `get_edge_function` e conferir que apenas D2/D4 diferem do código anterior (nenhuma mudança de lógica de negócio)

## 2. Wrapper do frontend

- [x] 2.1 Em `src/lib/adminUsuarios.ts`, trocar a mensagem do ramo `status: 0` de `chamarAdminUsuarios` pela mensagem fixa de falha de comunicação (D5), mantendo `status: 0` como marcador
- [ ] 2.2 Publicar o frontend no Vercel para entregar a mensagem da D5 aos usuários de `https://fera.ruatrez.com` (independente e retrocompatível com o deploy da função)

## 3. Validação de endpoint

- [x] 3.1 `curl -X OPTIONS` (simulando preflight do navegador) retorna `204` com `Access-Control-Allow-Origin` e headers permitidos
- [x] 3.2 `curl -X POST` sem autenticação retorna `401` do gateway; POST autenticado com conflito (e-mail duplicado) retorna `409` com `Access-Control-Allow-Origin` e corpo `{ erro }`

## 4. Validação no navegador (produção, `https://fera.ruatrez.com`)

- [ ] 4.1 Como ADM, exercitar no sistema criar, alterar, inativar, reativar e redefinir senha usando usuário de teste descartável — todas operam sem erro de transporte
- [ ] 4.2 Criar usuário com e-mail duplicado exibe a mensagem de conflito da função (spec: erro legível pelo navegador)
- [ ] 4.3 Com a rede bloqueada (DevTools offline), uma ação exibe a mensagem amigável de falha de comunicação, sem mensagem crua do SDK
