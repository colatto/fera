# Spec Delta

## MODIFIED Requirements

### Requirement: Identidade visual Fera
A interface MUST aplicar identidade visual derivada do logotipo oficial (`feralogo.jpg`): tema escuro em navy profundo com o wordmark presente na tela de login e no shell, texto de destaque em branco e hierarquia tipográfica compatível com o logotipo (caixa alta com espaçamento largo nos rótulos). Na tela de login, o wordmark MUST ser exibido dentro da modal de acesso, acima do seu conteúdo, e a composição de cores MUST ser: fundo da modal `oklch(0.363 0.079 264.8)` e fundo da tela `oklch(0.322 0.054 268.8)` — modal mais clara que a tela. Essa composição é exclusiva da tela de login: as demais telas seguem os tokens do tema sem alteração.

#### Scenario: Wordmark e paleta presentes
- **WHEN** a aplicação é aberta em qualquer tela
- **THEN** o wordmark do logotipo é exibido na entrada e no shell e os componentes seguem a paleta navy/branco derivada do logotipo

#### Scenario: Wordmark dentro da modal de login
- **WHEN** a tela de login é aberta
- **THEN** o wordmark do logotipo aparece dentro da modal de acesso, acima do formulário de credenciais, e nenhum elemento do logotipo fica fora da modal

#### Scenario: Cores da tela de login
- **WHEN** a tela de login é aberta
- **THEN** o fundo da modal de acesso é `oklch(0.363 0.079 264.8)`, o fundo da tela é `oklch(0.322 0.054 268.8)` e o wordmark se funde com a modal, sem retângulo visível em volta do JPG

#### Scenario: Demais telas mantêm o tema
- **WHEN** qualquer tela que não seja a de login é aberta
- **THEN** o fundo e as superfícies dessas telas seguem os tokens do tema sem alteração
