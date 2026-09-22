## ADDED Requirements

### Requirement: Ações de cancelamento em estilo destructive
As ações de cancelamento da interface MUST usar o estilo visual de ação destrutiva do design system (fundo avermelhado com texto na cor de destruição) tanto no botão-gatilho oferecido na tela quanto no botão que confirma a ação dentro do diálogo de confirmação. Os gatilhos e botões de confirmação de "Cancelar projeto" e "Cancelar envio" no detalhe do projeto MUST seguir essa convenção, de modo que botões correspondentes da mesma ação tenham cores idênticas entre si.

#### Scenario: Gatilho "Cancelar envio" igual ao gatilho "Cancelar projeto"
- **WHEN** o usuário visualiza um projeto em status `ENVIADO` na página do projeto
- **THEN** o botão "Cancelar envio" é apresentado no mesmo estilo destructive do gatilho "Cancelar projeto", distinto dos botões neutros de ações de fluxo como "Ordem de compra"

#### Scenario: Confirmação do diálogo "Cancelar envio" igual à do diálogo "Cancelar projeto"
- **WHEN** o usuário abre o diálogo de confirmação "Cancelar envio"
- **THEN** o botão de confirmação é apresentado no mesmo estilo destructive do botão de confirmação do diálogo "Cancelar projeto", sem usar o estilo de ação primária
