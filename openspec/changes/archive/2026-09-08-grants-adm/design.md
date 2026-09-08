## Context

Verificado no banco remoto via MCP Supabase: `autorizacao_faturamento`, `nota_fiscal` e `recebimento` têm privilégios apenas para `postgres` (dono) e `service_role`; `authenticated` não tem nenhum grant. As policies RLS de leitura (`autorizacao_adm`, `nota_adm`, `recebimento_adm`, todas via `usuario_adm()`, que é `SECURITY DEFINER` owned by `postgres`) existem, mas o Postgres avalia o grant antes da RLS — sem grant, a consulta falha com `42501 permission denied` e a policy nunca chega a rodar. O restante do schema já segue o modelo "grant de SELECT a `authenticated` + RLS por perfil" para `usuario`, `cliente`, `operadora` e `tipo_projeto`; as tabelas financeiras ficaram fora do bloco de grants de `banco.sql`. As views administrativas funcionam porque executam com os privilégios do dono (`postgres`), não do chamador — o problema é exclusivo do acesso direto às tabelas, que a interface usa conforme o spec `consulta-projetos` ("lidos das próprias tabelas").

## Goals / Non-Goals

**Goals:**
- Restaurar a leitura direta das três tabelas de documentos para `authenticated`, com filtragem por perfil mantida integralmente na RLS.
- Espelhar o estado corrigido na referência declarativa `banco.sql`.
- Registrar o requisito de acesso direto no spec `sessao-acesso` (lado ADM hoje não especificado), prevenindo regressão.

**Non-Goals:**
- Nenhuma mudança de código de aplicação (`src/`), views, funções, policies RLS ou triggers.
- Nenhum grant de escrita (`INSERT`/`UPDATE`/`DELETE`), que permanece exclusivo das RPCs `SECURITY DEFINER`.
- Nenhum grant para `anon` ou mudança no modelo geral de privilégios.

## Decisions

1. **Grant SELECT a `authenticated` nas três tabelas (Opção A), em vez de view de documentos (Opção B) ou leitura via projeção de view existente.** A Opção B (`v_documentos_administrativo` + grant na view) contradiz o texto do spec `consulta-projetos` ("lidas das próprias tabelas"), exigiria mudança de código e de spec, e a projeção de `v_projetos_administrativo` não cobre a lista de recebimentos (só o agregado). A Opção A usa policies RLS já escritas para exatamente esse acesso, segue o padrão de grant+RLS já usado nas tabelas de cadastro e não altera código. Decisivo: menor diff e alinhamento com specs existentes.
2. **Escopo do grant: apenas `SELECT`, apenas `authenticated`.** Toda escrita nas três tabelas já passa por RPCs `SECURITY DEFINER` com guardas próprias; conceder mais seria ampliar superfície sem uso. `anon` continua sem privilégios, conforme `sessao-acesso`.
3. **Filtragem permanece na RLS, não no grant.** O grant é binário (tem ou não tem); a distinção ADM/OPER continua garantida pelas policies `using (public.usuario_adm())`. Com o grant, OPER passa de "erro de privilégio" para "conjunto vazio" — comportamento que `sessao-acesso` já aceita explicitamente.
4. **Aplicação exclusivamente via MCP Supabase** (migration DDL no projeto remoto), sem alternativa local — restrição do projeto. `banco.sql` é atualizado apenas como referência declarativa, nunca executado.

## Risks / Trade-offs

- [`authenticated` passa a ter privilégio de leitura sobre tabelas financeiras] → Mitigado por RLS: sem policy que atenda ao chamador, o resultado é conjunto vazio, mesmo com o grant. É o mesmo modelo já vigente para as tabelas de cadastro.
- [Reexecução futura do bloco `revoke all on all tables` ou cópia parcial de `banco.sql` pode remover o grant de novo] → Mitigado espelhando o grant em `banco.sql` e registrando o requisito no spec `sessao-acesso`; tarefa de validação confere os grants após aplicar.
- [Advisor de segurança do Supabase pode sinalizar grants amplos] → Verificar advisors após aplicar; se sinalizado, documentar a justificativa (RLS cobre a filtragem) em vez de reverter.

## Migration Plan

1. Aplicar via MCP uma migration DDL no projeto remoto com os três `GRANT SELECT ... TO authenticated`.
2. Verificar grants via `information_schema.role_table_grants` e advisors de segurança.
3. Rollback, se necessário: `REVOKE SELECT ... FROM authenticated` nas três tabelas (retorna ao estado atual, sem risco de dados).
