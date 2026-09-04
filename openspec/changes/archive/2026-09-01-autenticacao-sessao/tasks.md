## 1. Banco — manutenção de usuários (via MCP Supabase)

- [x] 1.1 Aplicar migration no projeto remoto: criar `public.v_usuarios_manutencao` (`security_barrier`, projetando `id, perfil, nome, email, ativo, criado_em, atualizado_em`, sem filtro de `ativo`, avaliando `public.usuario_adm()`)
- [x] 1.2 Remover `public.v_usuarios_ativos` e conceder `GRANT SELECT` em `v_usuarios_manutencao` a `authenticated`
- [x] 1.3 Atualizar `banco.sql` como referência declarativa versionada (substituição da view e ajuste de grants), sem alterar as demais seções

## 2. Edge Function `admin-usuarios` (via MCP Supabase)

- [x] 2.1 Criar a function e fazer deploy com `verify_jwt` ativo; a cada chamada, validar que o chamador é usuário ativo e `ADM` (consulta com `service_role`)
- [x] 2.2 Implementar ação `criar`: `createUser` na Admin API (`email_confirm: true`, senha inicial da chamada) + insert em `public.usuario` com o mesmo UUID; ação compensatória `deleteUser` se a gravação do perfil falhar; validar perfil (`ADM`/`OPER`), e-mail e duplicidade antes de gravar
- [x] 2.3 Implementar ação `inativar`: revogar sessões (`signOut`) + banimento de longa duração na Admin API + `ativo = false` em `public.usuario`; compensar com unban e reportar erro se a atualização do banco falhar; idempotente para retry
- [x] 2.4 Implementar ação `reativar`: unban na Admin API + `ativo = true` em `public.usuario`
- [x] 2.5 Implementar ação `alterar`: perfil/nome direto em `public.usuario`; e-mail via `updateUserById` na Admin API e atualização correspondente em `public.usuario` na mesma chamada

## 3. Validação ponta a ponta no remoto (via MCP Supabase)

- [x] 3.1 Provisionamento: ADM cria usuário `OPER` de teste — credencial e perfil existem com mesmo UUID e login funciona; e-mail duplicado falha sem deixar credencial órfã; chamada de não-ADM é negada
- [x] 3.2 Sessão: `OPER` lê a própria linha e recebe conjunto vazio em dados financeiros/views administrativas; RPC exclusiva de ADM falha com negação de permissão; requisição anônima não obtém dados
- [x] 3.3 Inativação: ADM inativa o `OPER` — token residual retorna vazio/erro, renovação de sessão é negada; reativação restaura acesso conforme perfil
- [x] 3.4 Manutenção: ADM lista ativos e inativos em `v_usuarios_manutencao`; `OPER` vê somente a própria linha; alteração de perfil e de e-mail fica idêntica em `public.usuario` e `auth.users`

## 4. Encerramento

- [x] 4.1 Verificar avisos de segurança do projeto (policies/RLS) via MCP e tratar o que for decorrente das alterações
- [x] 4.2 Registrar pendência operacional: desabilitar sign-up público e definir política de senha na configuração do Auth (console/Management API, fora do alcance do MCP)
