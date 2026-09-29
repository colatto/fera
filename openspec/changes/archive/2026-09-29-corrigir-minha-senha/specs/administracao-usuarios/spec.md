# Spec Delta

## MODIFIED Requirements

### Requirement: Troca da própria senha
A interface MUST permitir ao usuário autenticado ativo alterar a própria senha pelo Supabase Auth, informando a credencial atual; a troca MUST NOT alterar perfil, nome, e-mail ou status em `public.usuario`, e a recusa por credencial atual não comprovada ou por nova senha igual à atual MUST ser exibida com mensagem amigável, sem a mensagem bruta do servidor. O campo de nova senha MUST oferecer um controle de alternância de exibição que revele e oculte o texto digitado, e a conferência do que foi digitado MUST ser feita por essa alternância: a interface MUST NOT apresentar campo de confirmação de senha nova.

#### Scenario: Troca válida
- **WHEN** o usuário ativo altera a própria senha informando a credencial atual correta
- **THEN** o login passa a valer com a senha nova e seus dados de perfil permanecem inalterados

#### Scenario: Credencial atual incorreta
- **WHEN** a troca é tentada sem comprovar a credencial atual
- **THEN** a operação é negada e a interface exibe mensagem amigável de credencial não comprovada, sem a mensagem bruta do servidor, mantendo a senha anterior

#### Scenario: Nova senha igual à atual
- **WHEN** o usuário informa como nova senha a mesma credencial atual, correta
- **THEN** a operação é negada e a interface exibe mensagem amigável de que a nova senha deve ser diferente da atual, mantendo a senha anterior

#### Scenario: Conferência da senha nova
- **WHEN** o usuário aciona a alternância de exibição no campo de nova senha
- **THEN** o texto digitado fica visível para conferência e o controle permite ocultá-lo novamente

#### Scenario: Sem campo de confirmação
- **WHEN** a tela de troca da própria senha é exibida
- **THEN** apenas os campos de senha atual e nova senha são apresentados, sem campo de confirmação de senha nova
