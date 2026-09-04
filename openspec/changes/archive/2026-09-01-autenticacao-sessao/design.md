## Context

`banco.sql` (referência declarativa do estado esperado) já traz: `public.usuario` 1:1 com `auth.users` (FK `on delete restrict`), enum `app_role` (`ADM`/`OPER`), guardas `usuario_ativo()`/`usuario_adm()` (`security definer`), política `usuario_leitura` (própria linha ou ADM) e `GRANT` restritivos. O que falta é o caminho operacional: nada cria credencial + perfil atomicamente, nada revoga sessão na inativação e `v_usuarios_ativos` só mostra ativos, o que impede o ADM de manter usuários inativos.

Restrição do projeto: o projeto remoto do Supabase é o único ambiente operacional; toda criação, alteração e validação (schema, Auth, views, Edge Functions, segredos) usa exclusivamente o MCP Supabase. `banco.sql` não é mecanismo de deploy — é mantido sincronizado como referência versionada.

## Goals / Non-Goals

**Goals:**
- Provisionamento atômico de usuário (credencial em `auth.users` + perfil em `public.usuario`, mesmo UUID), exclusivo de ADM, com credencial de serviço confinada ao backend.
- Inativação/reativação com efeito imediato sobre a sessão (revogação + bloqueio no banco).
- Manutenção de perfil, nome e e-mail com `public.usuario` e `auth.users` sempre consistentes.
- Fonte única de consulta de manutenção para o ADM (ativos e inativos).

**Non-Goals:**
- Interface/web do cliente — a interface não é mecanismo de proteção; este recorte é banco + backend.
- Alterar o fluxo de projetos, as RPCs de negócio existentes ou a RLS de negócio.
- SSO ou provedores além de e-mail/senha; auto-cadastro público (usuários nascem pelo ADM).
- Exclusão física de usuários.

## Decisions

**1. Provisionamento por Edge Function `admin-usuarios` usando a Admin API do Auth + SQL com `service_role`.**
O hash de senha pertence ao GoTrue; gravar direto em `auth.users` via SQL contorna o formato `encrypted_password` e é frágil. Fluxo: a function valida o JWT do chamador, confirma via consulta com `service_role` que o chamador é ativo e `ADM`, cria a credencial (`email_confirm: true`, senha inicial fornecida na chamada) e grava o perfil com o UUID retornado; se a gravação do perfil falhar, executa ação compensatória (`deleteUser`) para não deixar credencial órfã e devolve erro.
Alternativas rejeitadas: trigger de `INSERT` em `auth.users` (prática desencorajada, espalha lógica administrativa) e RPC `security definer` escrevendo em `auth.users` (exigiria grant de escrita no schema `auth` — amplifica a superfície de ataque).

**2. Inativação = `ativo = false` + revogação de sessões pela Admin API.**
A function revoga as sessões (`signOut`) e bane o usuário (`ban_duration` longo) — isso mata o refresh imediatamente e impede novo login. O access token residual vale até expirar, e é exatamente nesse intervalo que o bloqueio definitivo é o banco: `usuario_ativo()`/`usuario_adm()` já governam RLS, views e RPCs. Reativação = unban + `ativo = true`. Ordem fixa: revogar → atualizar o banco → compensar com unban se o banco falhar, reportando o erro.
Alternativa rejeitada: só `ativo = false` — o usuário inativo continuaria renovando sessão indefinidamente.

**3. Perfil permanece fora do JWT.**
O cliente lê a própria linha de `public.usuario` (`id = auth.uid()`) só para navegação; toda autorização continua em RLS/permissões/guardas. Alternativa rejeitada: perfil como claim customizado no JWT via Auth hook — adiciona sincronização de claims sem ganho, pois nenhuma decisão de acesso depende da interface.

**4. Substituir `v_usuarios_ativos` por `v_usuarios_manutencao`.**
Mesma projeção (`id, perfil, nome, email, ativo, criado_em, atualizado_em`), com `security_barrier`, sem filtro de `ativo` e avaliando `usuario_adm()` — conjunto vazio para não-ADM, igual às demais views administrativas. O `GRANT SELECT` a `authenticated` acompanha. A leitura "apenas a própria linha" do não-ADM permanece na tabela via `usuario_leitura`. Não há referências a `v_usuarios_ativos` além da própria criação, então não há quebra.

**5. Uma única Edge Function com ação no corpo.**
Operações `criar`, `inativar`, `reativar` e `alterar` (perfil/nome/e-mail) no corpo da requisição; guarda de ADM e segredos definidos uma vez. Alteração de e-mail usa `updateUserById` na Admin API e grava o novo e-mail em `public.usuario` na mesma chamada; perfil/nome são apenas `public.usuario`. Alternativa rejeitada: uma function por ação — repetição de guarda, segredo e deploy.

**6. Auto-cadastro público fica inócuo no banco, e a configuração do Auth é pendência operacional.**
Um self-signup cria `auth.users` sem `public.usuario`: `usuario_ativo()` é falso, então ele não lê nada e não executa nada. Ainda assim, recomenda-se desabilitar o sign-up público do provedor e-mail/senha na configuração do Auth (console/Management API — fora do alcance das ferramentas MCP atuais).

## Risks / Trade-offs

- [Ação compensatória do provisionamento falhar e deixar credencial órfã] → credencial sem perfil não tem acesso algum (`usuario_ativo()` falso); a function reporta o erro e a limpeza é triviação de manutenção ADM.
- [Access token residual de inativo até expirar] → janela curta por natureza e coberta pelo bloqueio no banco (RLS vazio, RPCs com `usuario_ativo()`).
- [Corrida entre revogação e atualização do banco] → ordem fixa com compensação (unban) e erro explícito ao chamador; inativação é idempotente para retry.
- [Edge Function como superfície administrativa] → `verify_jwt` ativo, guarda ADM revalidada a cada chamada contra o banco, entrada validada (enum de perfil, formato de e-mail, UUID), `service_role` só no ambiente da function.
- [MCP Supabase indisponível] → interromper a operação remota e reportar o bloqueio; nenhuma alternativa local (CLI/Docker/seeds) é aceita.
- [Configuração do Auth fora do MCP] → bloqueio do banco torna self-signup inócuo; desabilitar sign-up fica registrado como pendência operacional.

## Migration Plan

1. Migration no projeto remoto via MCP: criar `v_usuarios_manutencao`, remover `v_usuarios_ativos`, ajustar `GRANT` (select da nova view a `authenticated`); sincronizar `banco.sql` como referência.
2. Deploy da Edge Function `admin-usuarios` via MCP com `verify_jwt` ativo.
3. Pendência operacional: configuração do Auth (e-mail/senha, desabilitar sign-up público, política de senha) via console/Management API.
4. Validação ponta a ponta no remoto via MCP com usuários de teste: ADM cria OPER → login → OPER consulta (linha própria; financeiro vazio) → ADM inativa → token residual negado e refresh falha → reativação restaura.
5. Rollback: alterações são aditivas (view nova + function nova) e sem migração de dados; rollback = remover objetos criados.
