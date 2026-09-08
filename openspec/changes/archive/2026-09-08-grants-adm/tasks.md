## 1. Banco remoto (via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto (mesmo projeto das verificações do diagnóstico).
- [x] 1.2 Aplicar migration DDL `grant_select_documentos_authenticated` com os três grants:
  `GRANT SELECT ON public.autorizacao_faturamento, public.nota_fiscal, public.recebimento TO authenticated;`
- [x] 1.3 Verificar em `information_schema.role_table_grants` que `authenticated` tem apenas `SELECT` (e nenhuma escrita) nas três tabelas, e que `anon` continua sem privilégios.
- [x] 1.4 Rodar advisors de segurança do Supabase e registrar qualquer sinalização com a justificativa (RLS cobre a filtragem por perfil), sem reverter.

## 2. Referência declarativa

- [x] 2.1 Adicionar em `banco.sql`, na seção de concessões a `authenticated`, o `grant select` para `public.autorizacao_faturamento`, `public.nota_fiscal` e `public.recebimento`.

## 3. Validação

- [x] 3.1 Simular sessão `authenticated` com `SET ROLE` e claims de JWT (`auth.uid()` de um usuário ADM de teste) confirmando que o SELECT direto nas três tabelas retorna linhas conforme a RLS.
- [x] 3.2 Repetir a simulação com `auth.uid()` de usuário OPER (ou inativo) confirmando conjunto vazio, sem erro de privilégio.
- [x] 3.3 Na interface, como ADM, abrir um projeto e confirmar que a Linha do tempo carrega eventos e documentos (autorização, nota, recebimentos) sem erro.
- [x] 3.4 Rodar `openspec validate` na change e arquivar após aprovação.
