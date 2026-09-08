## ADDED Requirements

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
