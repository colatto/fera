# Spec Delta

## ADDED Requirements

### Requirement: Rodapé institucional
A interface MUST exibir a linha institucional `R3 © {ano} F.E.R.A. Projetos e Engenharia · v{versão} · Solicitar suporte` de forma discreta, em texto pequeno e esmaecido, na tela de login e no shell. Na tela de login, a linha MUST aparecer imediatamente abaixo da modal de acesso. No shell, a linha MUST aparecer fora da sidebar, no canto inferior direito da área de conteúdo, em linha única e sempre visível durante a rolagem. O termo `R3` MUST ser um link para `https://ruatrez.com` e `Solicitar suporte` MUST ser um link para `https://calendly.com/suporter3/agenda`, ambos abertos em nova aba do navegador. O ano exibido MUST ser o ano corrente, obtido automaticamente, sem ajuste manual. Em viewports estreitos a linha MUST ser encurtada para `R3 © {ano} · v{versão} · Suporte`, preservando os mesmos links.

#### Scenario: Linha abaixo da modal no login
- **WHEN** a tela de login é aberta
- **THEN** a linha institucional completa aparece imediatamente abaixo da modal de acesso, discreta, sem deslocar a modal do centro

#### Scenario: Linha no canto inferior direito do shell
- **WHEN** um usuário autenticado navega no shell em janela de computador
- **THEN** a linha institucional completa aparece fora da sidebar, no canto inferior direito da área de conteúdo, permanecendo visível enquanto o conteúdo rola

#### Scenario: Linha encurtada em viewport estreito
- **WHEN** o sistema é aberto em viewport estreito
- **THEN** a linha aparece encurtada (`R3 © {ano} · v{versão} · Suporte`) no mesmo canto, mantendo os links

#### Scenario: Link R3 abre o site institucional
- **WHEN** o usuário aciona o termo `R3` na linha
- **THEN** `https://ruatrez.com` é aberto em nova aba do navegador, sem sair da aplicação

#### Scenario: Link de suporte abre a agenda
- **WHEN** o usuário aciona `Solicitar suporte` (ou `Suporte` na forma encurtada) na linha
- **THEN** `https://calendly.com/suporter3/agenda` é aberto em nova aba do navegador, sem sair da aplicação

#### Scenario: Ano corrente sem manutenção
- **WHEN** a linha é renderizada em qualquer data
- **THEN** exibe o ano corrente daquele momento, sem necessidade de alteração no código

### Requirement: Versão exibida
A versão exibida no rodapé MUST ser a versão registrada no `package.json` do commit a partir do qual a aplicação foi construída, iniciando em `0.1.0`. A cada novo commit o contador da versão MUST avançar exatamente 1, sem considerar o histórico de commits anterior, com carry de dígito a cada 9: vencido o dígito 9, o dígito seguinte avança (v0.1.9 → v0.2.0; v0.9.9 → v1.0.0; v1.9.9 → v2.0.0). A versão MUST ser a mesma em todas as exibições da linha institucional.

#### Scenario: Versão corresponde ao commit construído
- **WHEN** a aplicação construída a partir de um commit é aberta em qualquer tela com rodapé
- **THEN** a versão exibida é a registrada no `package.json` daquele commit, igual no login e no shell

#### Scenario: Cada commit soma 1
- **WHEN** commits sucessivos são construídos e publicados
- **THEN** a versão avança 1 por commit (v0.1.0 → v0.1.1 → v0.1.2 …), independentemente do total de commits do repositório

#### Scenario: Carry de dígito a cada 9
- **WHEN** o contador atinge o dígito 9 e um novo commit é feito
- **THEN** a versão avança com carry (v0.1.9 → v0.2.0, v0.9.9 → v1.0.0, v1.9.9 → v2.0.0)
