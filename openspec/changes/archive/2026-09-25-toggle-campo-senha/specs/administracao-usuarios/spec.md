## MODIFIED Requirements

### Requirement: Criação de usuário com senha inicial
A interface MUST permitir ao ADM criar usuário informando perfil (`ADM`/`OPER`), nome, e-mail e senha inicial de no mínimo 6 caracteres, enviando a ação `criar`; a senha inicial transita somente na chamada autenticada da Edge Function e a interface MUST NOT retê-la após a operação. O campo de senha inicial MUST oferecer um controle de alternância de exibição que revele e oculte o texto digitado, para que o ADM confira o que foi digitado antes de criar o usuário. Erros retornados — e-mail duplicado, validação — MUST ser exibidos com a mensagem da função.

#### Scenario: Criação válida
- **WHEN** o ADM cria usuário com dados válidos
- **THEN** o usuário aparece na listagem como ativo e consegue autenticar-se com a senha inicial

#### Scenario: E-mail duplicado
- **WHEN** o ADM cria usuário com e-mail já cadastrado
- **THEN** a interface exibe a mensagem de conflito retornada e nenhum usuário é criado

#### Scenario: Conferência da senha inicial
- **WHEN** o ADM aciona a alternância de exibição no campo de senha inicial
- **THEN** o texto digitado fica visível para conferência e o controle permite ocultá-lo novamente

### Requirement: Redefinição de senha pelo ADM
A interface MUST permitir ao ADM redefinir a senha de qualquer usuário pela ação `redefinir_senha`, informando a nova senha com no mínimo 6 caracteres; a redefinição revoga as sessões do usuário-alvo e não restaura o acesso de usuário inativo. A interface MUST oferecer a redefinição a partir da modal de edição do usuário, que revela o campo de nova senha na própria modal para confirmar a operação. O campo de nova senha MUST oferecer um controle de alternância de exibição que revele e oculte o texto digitado, para que o ADM confira a senha antes de confirmar. Enquanto o campo de nova senha estiver revelado, a modal MUST operar em modo exclusivo de redefinição: os botões de ação (`Redefinir senha` e `Inativar`/`Reativar`) e o rodapé da modal (`Voltar`/`Salvar`) MUST ficar ocultos, e os campos de perfil, nome e e-mail MUST ficar desabilitados. Ao cancelar ou confirmar a redefinição, a modal MUST restaurar esses elementos ao estado normal, preservando os dados de perfil, nome e e-mail informados antes da revelação. A interface MUST usar exclusivamente a sessão ADM autenticada — a credencial de serviço MUST NOT existir no cliente.

#### Scenario: Redefinição em usuário ativo
- **WHEN** o ADM redefine a senha de um usuário ativo
- **THEN** as sessões do alvo são revogadas e o login passa a valer somente com a senha nova

#### Scenario: Redefinição não reativa inativo
- **WHEN** o ADM redefine a senha de um usuário inativo
- **THEN** a senha nova é gravada e o usuário continua sem acessar enquanto estiver inativo

#### Scenario: Redefinição a partir da edição
- **WHEN** o ADM aciona `Redefinir senha` na modal de edição
- **THEN** o campo de nova senha é revelado na própria modal para confirmar a operação

#### Scenario: Modo exclusivo durante a redefinição
- **WHEN** o campo de nova senha está revelado na modal de edição
- **THEN** os botões `Redefinir senha` e `Inativar`/`Reativar` e o rodapé `Voltar`/`Salvar` não são exibidos, e os campos de perfil, nome e e-mail estão desabilitados

#### Scenario: Conferência da senha nova
- **WHEN** o ADM aciona a alternância de exibição no campo de nova senha durante a redefinição
- **THEN** o texto digitado fica visível para conferência e o controle permite ocultá-lo novamente

#### Scenario: Restauração ao sair do modo exclusivo
- **WHEN** o ADM cancela ou confirma a redefinição de senha
- **THEN** os botões de ação e o rodapé voltam a ser exibidos, os campos de perfil, nome e e-mail voltam a habilitar e os valores informados antes da revelação permanecem

### Requirement: Troca da própria senha
A interface MUST permitir ao usuário autenticado ativo alterar a própria senha pelo Supabase Auth, informando a credencial atual; a troca MUST NOT alterar perfil, nome, e-mail ou status em `public.usuario`, e a recusa por credencial atual não comprovada MUST ser exibida. O campo de nova senha MUST oferecer um controle de alternância de exibição que revele e oculte o texto digitado, e a conferência do que foi digitado MUST ser feita por essa alternância: a interface MUST NOT apresentar campo de confirmação de senha nova.

#### Scenario: Troca válida
- **WHEN** o usuário ativo altera a própria senha informando a credencial atual correta
- **THEN** o login passa a valer com a senha nova e seus dados de perfil permanecem inalterados

#### Scenario: Credencial atual incorreta
- **WHEN** a troca é tentada sem comprovar a credencial atual
- **THEN** a operação é negada e a interface exibe a falha, mantendo a senha anterior

#### Scenario: Conferência da senha nova
- **WHEN** o usuário aciona a alternância de exibição no campo de nova senha
- **THEN** o texto digitado fica visível para conferência e o controle permite ocultá-lo novamente

#### Scenario: Sem campo de confirmação
- **WHEN** a tela de troca da própria senha é exibida
- **THEN** apenas os campos de senha atual e nova senha são apresentados, sem campo de confirmação de senha nova
