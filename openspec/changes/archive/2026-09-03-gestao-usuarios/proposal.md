## Why

O ciclo de vida do usuário entregue em `autenticacao-sessao` (provisionamento, inativação/reativação, alteração de perfil e consulta de manutenção) define a senha somente na criação: esquecida a senha, não existe caminho de redefinição — nem pelo ADM, nem pelo próprio usuário. Além disso, nada impede que o ADM inative ou rebaixe a si mesmo ou ao último ADM ativo, deixando o sistema sem quem possa administrar usuários (a própria Edge Function `admin-usuarios` exige chamador ADM ativo) e empurrando o resgate para intervenção manual no console.

## What Changes

- Nova ação de redefinição de senha do usuário pelo ADM na Edge Function `admin-usuarios`, executada pela Admin API do Auth e com revogação das sessões existentes do usuário-alvo; o usuário volta a autenticar-se somente com a nova senha.
- Alteração da própria senha pelo usuário autenticado ativo pelo fluxo nativo do Supabase Auth (exige credencial atual do usuário), sem envolver a credencial de serviço e sem tocar em `public.usuario`.
- Salvaguarda de administração: operações que deixariam o sistema sem nenhum ADM ativo — inativação do último ADM ativo ou rebaixamento do seu perfil para `OPER`, incluindo auto-operações — são negadas, com a regra garantida no banco (gatilho de restrição em `public.usuario`) e revalidada na Edge Function.
- Sem exclusão física, sem auto-cadastro e sem novos perfis: o modelo de acesso existente (`ADM`/`OPER`, RLS e guardas `usuario_ativo()`/`usuario_adm()`) permanece intocado.

## Capabilities

### New Capabilities

- Nenhum.

### Modified Capabilities

- `gestao-usuarios`: acrescenta requisitos de ciclo de senha pós-criação (redefinição pelo ADM com revogação de sessão; troca da própria senha pelo usuário ativo) e o requisito de salvaguarda que impede ficar sem ADM ativo. Os cinco requisitos existentes (provisionamento atômico, inativação com revogação, sem exclusão física, alteração de perfil/dados e consulta de manutenção) não mudam.

## Impact

- **Projeto Supabase remoto (via MCP Supabase)**: migration aditiva criando o gatilho de salvaguarda do último ADM ativo em `public.usuario`; novo deploy da Edge Function `admin-usuarios` (nova ação de redefinição de senha e guarda de salvaguarda nas ações `inativar` e `alterar`), mantendo `verify_jwt` e a credencial de serviço confinada ao backend.
- **`banco.sql`**: atualizado como referência declarativa versionada do novo estado (gatilho); continua não sendo mecanismo de deploy.
- **Cliente**: passa a contar com o fluxo nativo de troca da própria senha do Supabase Auth; nenhuma decisão de permissão passa para a interface.
- **Sem impacto** nas RPCs do fluxo de projetos, RLS de negócio, views operacionais/administrativas e no comportamento das ações `criar`, `inativar`, `reativar` e `alterar` fora das salvaguardas adicionadas.
