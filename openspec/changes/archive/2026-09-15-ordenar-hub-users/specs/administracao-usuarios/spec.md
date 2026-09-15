## MODIFIED Requirements

### Requirement: Listagem de manutenção
A interface MUST oferecer ao ADM a listagem de usuários conforme `v_usuarios_manutencao`, com ativos e inativos, perfil, nome e e-mail; a tela MUST ser exclusiva da navegação de ADM. A listagem MUST ordenar os usuários com os ativos antes dos inativos e, dentro de cada grupo, em ordem alfabética por nome.

#### Scenario: ADM lista usuários
- **WHEN** o ADM abre a administração de usuários
- **THEN** retornam usuários ativos e inativos com perfil, nome e e-mail

#### Scenario: Ordenação por situação
- **WHEN** a listagem é exibida
- **THEN** todos os usuários ativos aparecem antes dos inativos e, dentro de cada grupo, em ordem alfabética por nome

### Requirement: Inativação e reativação
A interface MUST permitir ao ADM inativar e reativar usuários pelas ações `inativar` e `reativar`; a inativação revoga imediatamente as sessões do usuário-alvo, e a negação da salvaguarda de último ADM ativo MUST ser exibida sem efeito. A interface MUST oferecer essas ações somente a partir da modal de edição do usuário, cujo rótulo varia conforme o status atual (`Inativar` para ativo, `Reativar` para inativo) e que executa em um clique, sem etapa adicional de confirmação; a tabela MUST exibir apenas a ação `Editar`. Após a ação, a modal MUST refletir o status atualizado sem exigir fechamento e reabertura.

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

### Requirement: Redefinição de senha pelo ADM
A interface MUST permitir ao ADM redefinir a senha de qualquer usuário pela ação `redefinir_senha`, informando a nova senha com no mínimo 6 caracteres; a redefinição revoga as sessões do usuário-alvo e não restaura o acesso de usuário inativo. A interface MUST oferecer a redefinição a partir da modal de edição do usuário, que revela o campo de nova senha na própria modal para confirmar a operação. A interface MUST usar exclusivamente a sessão ADM autenticada — a credencial de serviço MUST NOT existir no cliente.

#### Scenario: Redefinição em usuário ativo
- **WHEN** o ADM redefine a senha de um usuário ativo
- **THEN** as sessões do alvo são revogadas e o login passa a valer somente com a senha nova

#### Scenario: Redefinição não reativa inativo
- **WHEN** o ADM redefine a senha de um usuário inativo
- **THEN** a senha nova é gravada e o usuário continua sem acessar enquanto estiver inativo

#### Scenario: Redefinição a partir da edição
- **WHEN** o ADM aciona `Redefinir senha` na modal de edição
- **THEN** o campo de nova senha é revelado na própria modal para confirmar a operação
