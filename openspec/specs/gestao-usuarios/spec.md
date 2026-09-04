## Purpose

Define o ciclo de vida do usuário do Fera operado pelo ADM: provisionamento atômico da credencial no Supabase Auth e do perfil em `public.usuario`, inativação/reativação com revogação imediata de sessão, alteração de perfil e dados cadastrais, e consulta de manutenção — com a credencial de serviço confinada ao backend e sem exclusão física de usuários.

## Requirements

### Requirement: Provisionamento atômico de usuário
O sistema MUST criar, em uma única operação administrativa, a credencial em `auth.users` e o perfil em `public.usuario` com o mesmo UUID, definindo perfil (`ADM`/`OPER`), nome, e-mail e status ativo. A credencial de serviço MUST permanecer exclusivamente no backend; o cliente NUNCA a possui. Se a criação do perfil falhar após a credencial existir, o sistema MUST NOT deixar credencial órfã.

#### Scenario: ADM cria usuário com sucesso
- **WHEN** um ADM autenticado cria um usuário com perfil, nome e e-mail válidos
- **THEN** existe credencial em `auth.users` e perfil ativo em `public.usuario` com o mesmo UUID, e o usuário consegue autenticar-se com a credencial definida

#### Scenario: Falha na criação do perfil
- **WHEN** a credencial é criada mas a gravação do perfil falha (por exemplo, e-mail já presente em `public.usuario`)
- **THEN** a operação falha para o chamador e nenhuma credencial órfã permanece em `auth.users`

#### Scenario: Chamador sem permissão
- **WHEN** um chamador não ADM (OPER, usuário inativo ou sessão anônima) tenta criar usuário
- **THEN** a operação é negada e nenhum registro é criado

#### Scenario: E-mail duplicado
- **WHEN** o e-mail informado já existe em `auth.users` ou em `public.usuario`
- **THEN** a operação falha sem deixar registros parciais

### Requirement: Inativação com revogação imediata
O sistema MUST permitir ao ADM inativar um usuário, e a inativação MUST surtir efeito imediato: as sessões existentes do usuário são revogadas e novas sessões não podem ser iniciadas. Enquanto inativo, o usuário MUST NOT ler dados nem executar operações, ainda que possua token emitido antes da inativação.

#### Scenario: Inativação encerra acesso
- **WHEN** o ADM inativa um usuário autenticado
- **THEN** as sessões do usuário são revogadas (renovação negada) e as consultas retornam conjunto vazio e as RPCs falham por `usuario_ativo()`

#### Scenario: Reativação restaura acesso
- **WHEN** o ADM reativa um usuário inativo
- **THEN** o usuário volta a autenticar-se e acessar dados conforme seu perfil

### Requirement: Sem exclusão física de usuário
O sistema MUST NOT oferecer exclusão física de usuários; a saída do usuário é a inativação. A exclusão da credencial em `auth.users` MUST ser impedida enquanto existir perfil vinculado (FK `on delete restrict`).

#### Scenario: Tentativa de exclusão
- **WHEN** alguém tenta remover a credencial ou o perfil de um usuário
- **THEN** a operação é bloqueada pelo banco e a única mudança de disponibilidade possível é `ativo`

### Requirement: Alteração de perfil e dados cadastrais
O sistema MUST permitir ao ADM alterar perfil, nome e e-mail de um usuário. O perfil MUST restringir-se a `ADM` e `OPER`, e o e-mail MUST permanecer igual em `public.usuario` e em `auth.users` após qualquer alteração.

#### Scenario: Alteração de perfil
- **WHEN** o ADM altera o perfil de um usuário de `OPER` para `ADM`
- **THEN** o usuário passa a ter acesso administrativo conforme RLS e permissões do banco

#### Scenario: Alteração de e-mail
- **WHEN** o ADM altera o e-mail de um usuário
- **THEN** o novo e-mail passa a valer para autenticação e fica idêntico em `public.usuario` e `auth.users`, sem duplicidade

### Requirement: Consulta de manutenção de usuários
O sistema MUST expor ao ADM a lista de usuários, ativos e inativos, com perfil, nome e e-mail, para manutenção. Cada autenticado não ADM MUST conseguir ler somente a própria linha.

#### Scenario: ADM lista usuários
- **WHEN** o ADM consulta a lista de usuários
- **THEN** retornam usuários ativos e inativos com perfil, nome e e-mail

#### Scenario: OPER consulta usuários
- **WHEN** um usuário OPER consulta a lista de usuários
- **THEN** recebe apenas a própria linha

### Requirement: Redefinição de senha pelo ADM
O sistema MUST permitir ao ADM redefinir a senha de qualquer usuário pela via administrativa de backend com credencial de serviço, sem que a senha transite pela interface ou pelo cliente. A redefinição MUST revogar as sessões existentes do usuário-alvo; o retorno do acesso ocorre exclusivamente com a nova senha. A redefinição de senha MUST NOT alterar o status do usuário: senha nova em usuário inativo não restaura acesso.

#### Scenario: ADM redefine senha com sucesso
- **WHEN** um ADM autenticado redefine a senha de um usuário ativo
- **THEN** as sessões atuais desse usuário são revogadas, o login com a senha antiga falha e o login com a nova senha funciona

#### Scenario: Redefinição não restaura usuário inativo
- **WHEN** o ADM redefine a senha de um usuário inativo
- **THEN** a senha nova é gravada, mas o usuário continua sem autenticar-se e sem acessar dados enquanto estiver inativo

#### Scenario: Chamador sem permissão
- **WHEN** um chamador não ADM (OPER, usuário inativo ou sessão anônima) tenta redefinir senha
- **THEN** a operação é negada e nenhuma senha é alterada

### Requirement: Alteração da própria senha
O sistema MUST permitir ao usuário autenticado ativo alterar a própria senha diretamente pelo Supabase Auth, mediante sua credencial atual, sem intervenção do ADM e sem uso da credencial de serviço. A troca da própria senha MUST NOT alterar perfil, nome, e-mail ou status em `public.usuario`, e o e-mail MUST permanecer idêntico em `public.usuario` e `auth.users`.

#### Scenario: Usuário ativo troca a própria senha
- **WHEN** um usuário ativo autenticado altera a própria senha informando a credencial atual
- **THEN** o login passa a valer com a nova senha e seu perfil, nome, e-mail e status permanecem inalterados

#### Scenario: Credencial atual não comprovada
- **WHEN** a tentativa de troca da própria senha não comprova a credencial atual
- **THEN** a troca é negada e a senha anterior permanece válida

#### Scenario: Usuário inativo não altera senha autenticado
- **WHEN** um usuário inativo tenta alterar a própria senha
- **THEN** a operação não é executada, pois suas sessões estão revogadas e novo login é negado

### Requirement: Salvaguarda de ADM ativo
O sistema MUST impedir, com garantia no banco, qualquer operação que deixe o sistema sem nenhum usuário ativo com perfil `ADM` — incluindo operações do próprio ADM sobre si. Inativação do último ADM ativo e alteração do perfil do último ADM ativo para `OPER` MUST ser negadas sem produzir efeito; a negação MUST ocorrer também quando a via de chamada for a administração de backend com credencial de serviço.

#### Scenario: Inativação do último ADM negada
- **WHEN** o ADM inativa a si mesmo ou a outro ADM sendo que não existe outro ADM ativo
- **THEN** a operação falha, o usuário permanece ativo com perfil `ADM` e as sessões não são revogadas

#### Scenario: Rebaixamento do último ADM negado
- **WHEN** o ADM altera para `OPER` o perfil de si mesmo ou de outro ADM sendo que não existe outro ADM ativo
- **THEN** a operação falha e o perfil permanece `ADM`

#### Scenario: Operação permitida com outro ADM ativo
- **WHEN** existe mais de um ADM ativo e o ADM inativa ou rebaixa um deles
- **THEN** a operação é executada normalmente e permanece ao menos um ADM ativo
