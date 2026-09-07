## Purpose

Define o shell da aplicação web do Fera: autenticação na interface, sessão no cliente, guarda de rotas como experiência (não como proteção), navegação orientada por perfil, identidade visual derivada do logotipo oficial e comportamento de recarregamento direto de rotas.

## Requirements

### Requirement: Login na interface
A interface MUST autenticar por e-mail e senha exclusivamente pelo Supabase Auth. Falha de credencial MUST produzir mensagem única, sem revelar se o e-mail existe. Após autenticar, a interface MUST carregar a própria linha de `public.usuario` para montar a navegação; autenticado cuja linha não exista ou esteja inativa MUST ter a sessão encerrada pela interface e ser mantido fora do shell com mensagem de acesso indisponível.

#### Scenario: Login válido
- **WHEN** um usuário ativo autentica com e-mail e senha válidos
- **THEN** entra no shell e a navegação é montada conforme o perfil da própria linha em `public.usuario`

#### Scenario: Credenciais inválidas
- **WHEN** a autenticação usa credenciais inválidas
- **THEN** a interface exibe mensagem única de falha e permanece na tela de login

#### Scenario: Autenticado sem perfil ativo
- **WHEN** a autenticação é aceita mas a linha do usuário em `public.usuario` não existe ou está inativa
- **THEN** a interface encerra a sessão, exibe mensagem de acesso indisponível e retorna ao login

### Requirement: Logout
A interface MUST permitir encerrar a sessão a qualquer momento, retornando à tela de login; após o logout, consultas MUST exigir nova autenticação e o estado de sessão local MUST estar limpo.

#### Scenario: Logout encerra acesso
- **WHEN** o usuário autenticado encerra a sessão
- **THEN** a interface volta ao login e nenhum dado da aplicação é obtido sem nova autenticação

### Requirement: Guarda de rota como experiência
Rotas internas sem sessão válida MUST redirecionar à tela de login. A guarda de rota é experiência de uso, não proteção: a interface MUST NOT apresentar-se como mecanismo de autorização, e o acesso forçado a rota administrativa por URL MUST degradar para estado sem dados quando o banco negar a leitura, sem quebrar a aplicação.

#### Scenario: Anônimo acessa rota interna
- **WHEN** um visitante sem sessão abre uma rota interna
- **THEN** é redirecionado ao login e, após autenticar, retorna à rota pretendida

#### Scenario: OPER força URL administrativa
- **WHEN** um usuário OPER navega diretamente a uma rota de conteúdo administrativo
- **THEN** a interface não obtém os dados protegidos e apresenta estado de dados indisponíveis, permanecendo utilizável

### Requirement: Sessão inválida durante o uso
Quando a sessão perde validade durante o uso (expiração, renovação negada ou revogação por inativação), a interface MUST redirecionar ao login com mensagem de sessão encerrada, sem repetir indefinidamente tentativas de renovação e sem exibir dados obtidos com a sessão anterior.

#### Scenario: Sessão revogada por inativação
- **WHEN** o ADM inativa um usuário que está com a aplicação aberta
- **THEN** a interface da vítima passa a redirecionar ao login e o acesso só retorna após reativação e nova autenticação

### Requirement: Navegação orientada por perfil
A navegação MUST refletir o perfil do próprio usuário: ADM alcança projetos, dashboards operacional e financeiro, cadastros, fluxo financeiro e administração de usuários; OPER alcança projetos, dashboard operacional e eventos. Entradas administrativas MUST NOT ser oferecidas a OPER na navegação.

#### Scenario: Menu por perfil
- **WHEN** ADM e OPER autenticam
- **THEN** o menu do ADM inclui as áreas administrativas e financeiras e o do OPER inclui somente as áreas operacionais

### Requirement: Identidade visual Fera
A interface MUST aplicar identidade visual derivada do logotipo oficial (`feralogo.jpg`): tema escuro em navy profundo com o wordmark presente na tela de login e no shell, texto de destaque em branco e hierarquia tipográfica compatível com o logotipo (caixa alta com espaçamento largo nos rótulos).

#### Scenario: Wordmark e paleta presentes
- **WHEN** a aplicação é aberta em qualquer tela
- **THEN** o wordmark do logotipo é exibido na entrada e no shell e os componentes seguem a paleta navy/branco derivada do logotipo

### Requirement: Recarregamento direto de rota
A aplicação MUST servir o próprio aplicativo quando qualquer rota interna for recarregada ou aberta diretamente por URL, aplicando a guarda de sessão normalmente, em vez de retornar erro de endereço inexistente.

#### Scenario: Refresh em rota interna
- **WHEN** o usuário recarrega o navegador em uma rota interna
- **THEN** a aplicação é servida naquela rota, com sessão verificada, sem página de erro

### Requirement: Estados padronizados de consulta
Toda consulta da interface MUST apresentar estado de carregamento, estado vazio explícito quando o retorno não tem dados e mensagem do erro quando a leitura falha; conjunto vazio MUST NOT ser apresentado como erro.

#### Scenario: Consulta sem dados
- **WHEN** uma listagem retorna conjunto vazio
- **THEN** a interface exibe estado vazio explícito, distinto de erro
