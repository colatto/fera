# Proposal

## Why

O Security Advisor do Supabase acusa WARNs acionáveis que o projeto pode zerar com correções de baixo risco: 3 funções de trigger com `search_path` mutável (lint 0011) e 3 funções `SECURITY DEFINER` administrativas executáveis pelo papel `anon` via API REST (lint 0028). Aproveita-se para remover a view morta `v_dashboard_operacional` (um dos 7 ERRORs de view definer) e documentar as demais como exceção aceita, encerrando a discussão recorrente sobre o painel.

## What Changes

- Fixar `SET search_path = ''` nas funções de trigger `fn_atualizar_timestamp`, `fn_impedir_edicao_evento` e `fn_proteger_projeto` — os corpos não referenciam nenhum objeto por nome, logo não há impacto funcional.
- **BREAKING** para chamadores anônimos (não existem no app): revogar `EXECUTE` de `PUBLIC` e `anon` nas RPCs administrativas `registrar_nota_fiscal(bigint,varchar,date)`, `registrar_ordem_compra(varchar,date)` e `vincular_ordem_compra(bigint,bigint,varchar)`. A ACL passa a ser idêntica à de `usuario_adm()`/`usuario_ativo()` (postgres, authenticated, service_role — authenticated e service_role já têm grant explícito).
- Derrubar a view `v_dashboard_operacional`: sem dependências no banco, sem referência em spec viva e sem uso no frontend (o painel operacional usa a RPC `dashboard_operacional(date,date)`).
- Documentar como padrão aceito as views de leitura `SECURITY DEFINER` com guarda interna (`usuario_adm()`/`usuario_ativo()`), por meio da nova capability `seguranca-banco`; permanecem 6 views, todas já guardadas.
- Espelhar o estado esperado em `banco.sql`: definições das 3 funções de trigger com `set search_path = ''`, remoção do bloco da view derrubada e de sua menção no `grant select`, e inclusão dos `revoke execute` das RPCs administrativas.

## Capabilities

### New Capabilities

- `seguranca-banco`: convenções de segurança do banco de dados — funções com `search_path` fixado, RPCs administrativas não executáveis por `anon`, e views de leitura `SECURITY DEFINER` com guarda interna como exceção documentada do modelo de acesso.

### Modified Capabilities

- Nenhuma: a view derrubada não é referenciada por nenhuma spec viva e as demais mudanças não alteram requisitos de capabilities existentes.

## Impact

- **Banco remoto Supabase (via MCP)**: 3 `ALTER FUNCTION ... SET search_path`, 3 `REVOKE EXECUTE`, 1 `DROP VIEW`. Nenhum dado é tocado.
- **`banco.sql`**: atualização das 3 declarações de função de trigger, remoção do bloco `create view` da `v_dashboard_operacional` e de sua entrada no `grant select` a authenticated, e inclusão dos `revoke execute` das 3 RPCs.
- **Frontend**: nenhuma mudança — as RPCs com revoke são chamadas somente por usuários autenticados (ADM) e as views mantêm nome e colunas.
- **Advisor após o change**: ERROR 7 → 6 (as 6 restantes são a exceção documentada), WARN 0011 zera (3 → 0), WARN 0028 zera (3 → 0). Permanecem, aceitos ou fora de escopo: WARN 0029 (15 funções executáveis por authenticated — funções de negócio do app), WARN de leaked password protection (toggle do dashboard, fora deste change) e INFO de 3 tabelas com RLS sem políticas.
- **Fora do escopo**: migração das views para `security_invoker` com RLS puro — avaliada e rejeitada porque a separação ADM/OPER é por coluna (ex.: `valor` ausente da projeção operacional) e os grants do Postgres são por role, não por usuário.
