## MODIFIED Requirements

### Requirement: Redefinição de senha pelo ADM
A interface MUST permitir ao ADM redefinir a senha de qualquer usuário pela ação `redefinir_senha`, informando a nova senha com no mínimo 6 caracteres; a redefinição revoga as sessões do usuário-alvo e não restaura o acesso de usuário inativo. A interface MUST oferecer a redefinição a partir da modal de edição do usuário, que revela o campo de nova senha na própria modal para confirmar a operação. Enquanto o campo de nova senha estiver revelado, a modal MUST operar em modo exclusivo de redefinição: os botões de ação (`Redefinir senha` e `Inativar`/`Reativar`) e o rodapé da modal (`Voltar`/`Salvar`) MUST ficar ocultos, e os campos de perfil, nome e e-mail MUST ficar desabilitados. Ao cancelar ou confirmar a redefinição, a modal MUST restaurar esses elementos ao estado normal, preservando os dados de perfil, nome e e-mail informados antes da revelação. A interface MUST usar exclusivamente a sessão ADM autenticada — a credencial de serviço MUST NOT existir no cliente.

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

#### Scenario: Restauração ao sair do modo exclusivo
- **WHEN** o ADM cancela ou confirma a redefinição de senha
- **THEN** os botões de ação e o rodapé voltam a ser exibidos, os campos de perfil, nome e e-mail voltam a habilitar e os valores informados antes da revelação permanecem
