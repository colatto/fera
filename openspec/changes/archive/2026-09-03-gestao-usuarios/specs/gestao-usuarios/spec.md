## ADDED Requirements

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
