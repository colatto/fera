# Spec Delta

## ADDED Requirements

### Requirement: Menu fixo no desktop
A sidebar do shell MUST permanecer fixa na tela durante a rolagem da página em viewports largos, com o menu de navegação, o bloco de usuário e o encerramento de sessão sempre acessíveis sem rolar até o topo. Quando o conteúdo do menu exceder a altura da viewport, o menu MUST rolar internamente, sem mover a sidebar. Em viewports estreitos, onde a sidebar fica empilhada acima do conteúdo, esse comportamento de fixação MUST NOT se aplicar.

#### Scenario: Sidebar permanece visível na rolagem
- **WHEN** o usuário rola uma página longa (ex.: listagem extensa de projetos) em viewport largo
- **THEN** a sidebar permanece fixa na tela, com logo, menu e bloco de usuário acessíveis durante toda a rolagem

#### Scenario: Menu mais alto que a viewport rola internamente
- **WHEN** o menu de navegação excede a altura da viewport em viewport largo
- **THEN** o menu rola internamente dentro da sidebar, que permanece fixa

#### Scenario: Bloco de usuário sempre acessível
- **WHEN** o usuário está em qualquer posição de rolagem de uma página longa em viewport largo
- **THEN** o bloco de usuário com o encerramento de sessão permanece visível no pé da sidebar

#### Scenario: Mobile mantém o comportamento empilhado
- **WHEN** o sistema é aberto em viewport estreito
- **THEN** a sidebar permanece empilhada acima do conteúdo, rolando com a página como atualmente
