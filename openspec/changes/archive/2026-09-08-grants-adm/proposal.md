## Why

Ao acessar um projeto como ADM, a Linha do tempo falha com `permission denied for table autorizacao_faturamento`. A consulta de documentos do detalhe (spec consulta-projetos: "lidos das próprias tabelas") usa SELECT direto em `autorizacao_faturamento`, `nota_fiscal` e `recebimento`, mas o papel `authenticated` não tem grant SELECT nessas tabelas — o Postgres nega o acesso antes mesmo de avaliar as policies RLS `*_adm`, que existem justamente para esse acesso. O spec `sessao-acesso` especifica o comportamento de acesso direto para OPER (não lê), mas nunca especificou o lado ADM (lê), e o grant necessário se perdeu.

## What Changes

- Conceder `SELECT` em `public.autorizacao_faturamento`, `public.nota_fiscal` e `public.recebimento` ao papel `authenticated` no banco remoto (via MCP Supabase), deixando a filtragem por perfil a cargo das policies RLS existentes (`autorizacao_adm`, `nota_adm`, `recebimento_adm` via `usuario_adm()`).
- Espelhar o grant na referência declarativa `banco.sql`.
- Nenhuma mudança de código de aplicação, views, funções ou policies: o comportamento esperado já está especificado e implementado; o banco fica aquém dele.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `sessao-acesso`: explicita o lado ADM do acesso direto a tabelas financeiras — `authenticated` MUST ter grant de leitura direta nas tabelas de documentos (`autorizacao_faturamento`, `nota_fiscal`, `recebimento`), sujeito a RLS por perfil (ADM lê; OPER recebe conjunto vazio), complementando a regra existente que já cobre o lado OPER.

## Impact

- **Banco remoto (Supabase via MCP):** três statements `GRANT SELECT`; efeito imediato na página de detalhe ADM, sem deploy de aplicação.
- **`banco.sql`:** linha de grant adicionada à seção de concessões.
- **Sem impacto:** código frontend/queries (`src/queries/projetos.ts` permanece como está), views, funções, policies RLS, perfis OPER (continuam recebendo conjunto vazio nas tabelas financeiras, conforme `sessao-acesso`).
