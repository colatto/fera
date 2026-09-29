# Spec Delta

## MODIFIED Requirements

### Requirement: Inativação e reativação
A interface MUST permitir ao ADM inativar e reativar outro usuário pelas ações `inativar` e `reativar`; a inativação revoga imediatamente as sessões do usuário-alvo, e a negação da salvaguarda de último ADM ativo MUST ser exibida sem efeito. A interface MUST oferecer essas ações somente a partir da modal de edição do usuário, cujo rótulo varia conforme o status atual (`Inativar` para ativo, `Reativar` para inativo) e que executa em um clique, sem etapa adicional de confirmação; a tabela MUST exibir apenas a ação `Editar`. Quando o usuário em edição é o próprio usuário logado, a modal MUST NOT oferecer inativação nem reativação. Após a ação, a modal MUST refletir o status atualizado sem exigir fechamento e reabertura.

#### Scenario: Inativação derruba sessão
- **WHEN** o ADM inativa um usuário autenticado
- **THEN** a aplicação do usuário-alvo perde a sessão e volta ao login, e ele retorna à listagem como inativo

#### Scenario: Inativação do último ADM negada
- **WHEN** o ADM inativa a si mesmo sendo o único ADM ativo
- **THEN** a função nega a operação e a interface exibe o motivo, mantendo-o ativo

#### Scenario: Ações concentradas na edição
- **WHEN** o ADM visualiza a coluna Ações da listagem
- **THEN** apenas a ação `Editar` é exibida, e as ações de inativação e reativação são oferecidas somente dentro da modal de edição do usuário

#### Scenario: Modal reflete status após ação
- **WHEN** o ADM inativa ou reativa o usuário a partir da modal de edição
- **THEN** a modal passa a refletir o status atualizado sem exigir fechamento e reabertura

#### Scenario: Sem ações sobre o próprio registro
- **WHEN** o ADM abre a modal de edição do próprio usuário logado
- **THEN** a seção `Ações do usuário` não é exibida e a modal oferece apenas a alteração de perfil, nome e e-mail com `Voltar`/`Salvar`

### Requirement: Redefinição de senha pelo ADM
A interface MUST permitir ao ADM redefinir a senha de outro usuário pela ação `redefinir_senha`, informando a nova senha com no mínimo 6 caracteres; a redefinição revoga as sessões do usuário-alvo e não restaura o acesso de usuário inativo. A interface MUST oferecer a redefinição a partir da modal de edição do usuário, que revela o campo de nova senha na própria modal para confirmar a operação. O campo de nova senha MUST oferecer um controle de alternância de exibição que revele e oculte o texto digitado, para que o ADM confira a senha antes de confirmar. O formulário de redefinição MUST anunciar a política de senha vigente: mínimo de 6 caracteres e ao menos uma letra minúscula, uma maiúscula, um dígito e um símbolo. Enquanto o campo de nova senha estiver revelado, a modal MUST operar em modo exclusivo de redefinição: os botões de ação (`Redefinir senha` e `Inativar`/`Reativar`) e o rodapé da modal (`Voltar`/`Salvar`) MUST ficar ocultos, e os campos de perfil, nome e e-mail MUST ficar desabilitados. Ao cancelar ou confirmar a redefinição, a modal MUST restaurar esses elementos ao estado normal, preservando os dados de perfil, nome e e-mail informados antes da revelação. A interface MUST usar exclusivamente a sessão ADM autenticada — a credencial de serviço MUST NOT existir no cliente. A recusa por senha nova fora da política de força MUST ser exibida com mensagem amigável em português, sem a mensagem bruta do servidor. A interface MUST NOT oferecer a redefinição para o próprio registro do usuário logado, que dispõe da troca da própria senha pelo Supabase Auth exigindo a credencial atual.

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

#### Scenario: Senha nova fora da política
- **WHEN** o ADM informa senha nova que não atende à política de força de senha
- **THEN** a redefinição é negada e a interface exibe mensagem amigável declarando a política, sem a mensagem bruta do servidor, e a senha anterior permanece

#### Scenario: Sem redefinição sobre o próprio registro
- **WHEN** o ADM abre a modal de edição do próprio usuário logado
- **THEN** a ação `Redefinir senha` não é oferecida, e a troca da própria senha permanece exclusiva da tela de troca da própria senha
