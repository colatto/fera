# Pendências operacionais — autenticacao-sessao

Registro de itens que ficam fora do alcance das ferramentas MCP atuais (configuração
do Auth no console/Management API do Supabase) e dos artefatos deixados pela validação.

## 1. Configuração do Auth (console/Management API)

A fazer pelo ADM no projeto remoto `wgdlazhrcyqmbvhaindq`:

- [ ] **Desabilitar o sign-up público** do provedor e-mail/senha. Usuários nascem pelo
  ADM (Edge Function `admin-usuarios`); enquanto o auto-cadastro seguir habilitado, um
  self-signup cria credencial em `auth.users` sem perfil em `public.usuario` — inócuo no
  banco (`usuario_ativo()` falso: não lê nada e não executa nada), mas indesejável.
- [ ] **Definir política de senha** no Auth (comprimento mínimo etc.) conforme política do Fera.
- [ ] **Ativar a proteção de senha vazada** (leaked password protection, HaveIBeenPwned) —
  apontado pelo security advisor do projeto como `auth_leaked_password_protection` (WARN).

## 2. Artefatos da validação (deixados no projeto remoto)

- Usuários de teste criados nesta validação, ambos **inativos** (sessões revogadas) ao final:
  - `adm.validacao@fera.teste` — fixture ADM criada para obtenção de sessão de validação
    (um ADM é necessário para criar qualquer usuário; a senha desta fixture foi descartada).
  - `oper.validacao2@fera.teste` — usuário OPER criado pela própria Edge Function (teste 3.1),
    depois renomeado de `oper.validacao@fera.teste` pela ação `alterar` (teste 3.4).
- Reativação (se desejado): ação `reativar` da Edge Function `admin-usuarios` com um ADM ativo.
- Nenhum arquivo ou configuração local de Supabase foi criado; `banco.sql` segue apenas
  como referência declarativa versionada.

## 3. Observação do security advisor (padrão aceito)

O linter aponta `security_definer_view` (ERROR) para `v_usuarios_manutencao` — o mesmo
apontamento já existente para as demais views administrativas/operacionais do projeto.
É o padrão deliberado do projeto: view com direitos do dono + `security_barrier` + filtro
`usuario_adm()`/`usuario_ativo()` no corpo, que retorna **conjunto vazio** para não-ADM
(validado ponta a ponta). `security_invoker` não é adequado aqui: faria as consultas de
não-ADM falharem por falta de grant nas tabelas base, em vez de retornarem vazio, e
contradiz a decisão de design 4 da change.
