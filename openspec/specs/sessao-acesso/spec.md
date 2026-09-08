## Purpose

Define as regras da sessão no Fera: autenticação exclusivamente pelo Supabase Auth, bloqueio imediato do usuário inativo mesmo com token residual, autorização por perfil garantida no banco (RLS, permissões e guardas das RPCs — nunca na interface) e comportamento de sessão anônima, expirada ou revogada.

## Requirements

### Requirement: Autenticação exclusiva pelo Supabase Auth
O sistema MUST autenticar exclusivamente pelas credenciais do Supabase Auth (e-mail/senha), e senha ou hash de senha MUST existir somente no Supabase Auth — nenhuma tabela ou coluna em `public` os contém. A sessão válida MUST ser o token emitido pelo Supabase a um `auth.users` existente.

#### Scenario: Login válido
- **WHEN** um usuário com perfil ativo autentica com e-mail e senha válidos
- **THEN** recebe sessão válida (token e refresh) e consegue ler a própria linha em `public.usuario`

#### Scenario: Credenciais inválidas
- **WHEN** a autenticação usa credenciais inválidas ou de usuário inexistente
- **THEN** o acesso é negado sem revelar se o e-mail existe

### Requirement: Bloqueio do usuário inativo
Usuário inativo (`ativo = false`) MUST NOT acessar dados nem executar operações, mesmo com token emitido antes da inativação. A proteção MUST estar no banco (RLS, permissões e guardas `usuario_ativo()`/`usuario_adm()` nas RPCs), NÃO na interface.

#### Scenario: Token residual de inativo
- **WHEN** uma requisição chega com token emitido antes da inativação do usuário
- **THEN** consultas de dados retornam conjunto vazio e RPCs do fluxo falham com negação de permissão

#### Scenario: Renovação de sessão de inativo
- **WHEN** o cliente de um usuário inativo tenta renovar a sessão
- **THEN** a renovação é negada e o acesso só volta a existir após reativação pelo ADM

### Requirement: Autorização por perfil no banco
A diferença entre `ADM` e `OPER` MUST ser aplicada por RLS, permissões e guardas das RPCs no banco. A interface MUST NOT ser mecanismo de proteção; ela lê o próprio perfil (`public.usuario` com `id = auth.uid()`) apenas para navegação. OPER MUST NOT ler nota fiscal, autorização, recebimentos, valores ou dashboard financeiro, mesmo por consulta direta ao banco.

#### Scenario: OPER consulta dado financeiro
- **WHEN** um OPER autenticado consulta diretamente tabelas financeiras ou views administrativas
- **THEN** recebe conjunto vazio ou erro, independentemente da interface em uso

#### Scenario: OPER executa RPC administrativa
- **WHEN** um OPER chama uma RPC exclusiva de ADM
- **THEN** a RPC falha com negação de permissão e nada é alterado

### Requirement: Leitura direta das tabelas de documentos pelo ADM
O papel `authenticated` MUST ter privilégio de leitura direta (`SELECT`) nas tabelas de documentos financeiros `public.autorizacao_faturamento`, `public.nota_fiscal` e `public.recebimento`, complementar às policies RLS de leitura dessas tabelas, que permanecem como único mecanismo de filtragem por perfil. O grant MUST ser apenas de leitura: escrita continua exclusiva das RPCs do fluxo. O papel `anon` MUST NOT ter qualquer privilégio nessas tabelas.

#### Scenario: ADM lê documentos por consulta direta
- **WHEN** um usuário ADM autenticado consulta diretamente `autorizacao_faturamento`, `nota_fiscal` ou `recebimento`
- **THEN** as linhas são retornadas conforme a RLS, sem erro de privilégio, e o detalhe do projeto exibe a Linha do tempo com os documentos

#### Scenario: OPER consulta tabela de documentos por acesso direto
- **WHEN** um usuário OPER autenticado consulta diretamente as mesmas tabelas
- **THEN** recebe conjunto vazio (a RLS filtra todas as linhas), sem erro de privilégio e sem expor dados financeiros

#### Scenario: Anônimo consulta tabela de documentos
- **WHEN** uma requisição sem sessão válida consulta diretamente as mesmas tabelas
- **THEN** o acesso é negado (sem grant para `anon`), nada é retornado e nenhuma operação é executada

### Requirement: Sessão anônima, expirada ou revogada
Requisições sem sessão válida (anônimas ou com token expirado/revogado) MUST NOT obter dados da aplicação nem executar operações. O cliente MUST reautenticar pelo Supabase Auth para obter nova sessão.

#### Scenario: Anônimo consulta
- **WHEN** uma requisição sem token consulta dados da aplicação
- **THEN** nada é retornado (conjunto vazio ou erro de permissão) e nenhuma operação é executada

#### Scenario: Token expirado durante o uso
- **WHEN** a sessão expira durante o uso
- **THEN** o cliente renova via refresh token ou reautentica; sem isso, as respostas continuam negadas
