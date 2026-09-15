## Purpose

Define o comportamento de carregamento do aplicativo web: o código de cada rota é baixado sob demanda, a primeira tela não depende de código exclusivo de rotas não acessadas e a navegação permanece íntegra (guarda de sessão, degradação por perfil e recarregamento direto) com o aplicativo dividido em múltiplos chunks.

## ADDED Requirements

### Requirement: Código de rota carregado sob demanda
O aplicativo MUST carregar o código de cada rota sob demanda, de modo que o carregamento inicial não dependa do código exclusivo de rotas ainda não acessadas. O comportamento de sessão, guarda de rota, redirecionamento e degradação por perfil MUST permanecer o definido em interface-web, mesmo com o código dividido em múltiplos chunks.

#### Scenario: Entrada em projetos não baixa código de gráficos
- **WHEN** o usuário autentica e a interface apresenta a listagem de projetos
- **THEN** o código exclusivo dos dashboards (gráficos) não é baixado até que uma rota de dashboard seja acessada

#### Scenario: Primeiro acesso a dashboard baixa e renderiza
- **WHEN** o usuário acessa um dashboard pela primeira vez na sessão
- **THEN** o código da rota é baixado e os gráficos são renderizados normalmente

#### Scenario: Guarda e recarregamento preservados
- **WHEN** um anônimo abre por URL uma rota interna com código ainda não baixado, ou um usuário recarrega o navegador em rota interna
- **THEN** o redirecionamento ao login com retorno à rota pretendida e o serviço da aplicação na própria rota ocorrem como definido em interface-web

### Requirement: Indicação de carregamento de rota
Enquanto o código de uma rota solicitada ainda não estiver baixado, a interface MUST apresentar estado de carregamento dentro do shell, em vez de tela em branco ou área vazia sem indicação. Quando o shell ainda não existe (ex.: login), a espera não MUST deixar a página sem conteúdo visível.

#### Scenario: Primeira navegação a rota ainda não baixada
- **WHEN** o usuário navega pela primeira vez na sessão a uma rota cujo código não foi baixado
- **THEN** o conteúdo da rota é precedido por indicação de carregamento visível, seguida pela rota renderizada

#### Scenario: Login não fica em branco
- **WHEN** a aplicação é aberta em /login
- **THEN** a tela de login é apresentada sem período de tela em branco além do carregamento inicial do próprio aplicativo

### Requirement: Payload inicial limitado
O JavaScript baixado até a primeira tela após autenticação estar interativa MUST NOT exceder 250 kB comprimido (gzip), e o build de produção MUST dividir a saída em múltiplos chunks de forma que o aviso de chunk grande do Vite não dispare na configuração resultante.

#### Scenario: Payload da primeira tela
- **WHEN** o usuário autentica e a listagem de projetos fica interativa
- **THEN** o total de JavaScript baixado na sessão até esse momento é de no máximo 250 kB gzip

#### Scenario: Aviso de build sob controle
- **WHEN** o build de produção é executado
- **THEN** nenhum aviso de chunk acima do limite configurado é emitido
