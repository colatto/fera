# Tasks

## 1. Pré-requisitos

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto antes de qualquer alteração (conferir URL/ref do projeto retornado pelo MCP) e que `banco.sql` está limpo no git, de modo que o espelhamento do change fique isolado no diff

## 2. search_path fixado nas funções de trigger

- [x] 2.1 No remoto, via MCP `execute_sql`, fixar o search_path das três funções: `alter function public.fn_atualizar_timestamp() set search_path = '';`, `alter function public.fn_impedir_edicao_evento() set search_path = '';` e `alter function public.fn_proteger_projeto() set search_path = '';` — verificar consultando `pg_proc.proconfig` das três e conferindo que cada uma traz `search_path=''`
- [x] 2.2 Espelhar em `banco.sql` (linhas 88-90): acrescentar `set search_path = ''` às declarações de `fn_atualizar_timestamp`, `fn_impedir_edicao_evento` e `fn_proteger_projeto` — verificar com `rg "fn_(atualizar_timestamp|impedir_edicao_evento|proteger_projeto)" banco.sql` mostrando as três com `set search_path = ''`
- [x] 2.3 Smoke das triggers via MCP `execute_sql`: um `update public.projeto set atualizado_em = atualizado_em where id = (select min(id) from projeto)` dispara a trigger e redefine o timestamp, e um `update` tentando alterar `numero` de uma linha é recusado com a exceção de proteção (nenhum dado alterado) — verificar pelos resultados das duas execuções

## 3. EXECUTE das RPCs administrativas restrito a autenticados

- [x] 3.1 No remoto, via MCP `execute_sql`: `revoke execute on function public.registrar_nota_fiscal(bigint,varchar,date), public.registrar_ordem_compra(varchar,date), public.vincular_ordem_compra(bigint,bigint,varchar) from anon, public;` — verificar consultando `proacl` das três funções e conferindo que as entradas `=X` (PUBLIC) e `anon=X` sumiram, permanecendo `postgres`, `authenticated` e `service_role` (mesma ACL de `usuario_adm`)
- [x] 3.2 Provar o acesso via MCP `execute_sql` com troca de papel: `set role anon;` seguido de chamada a `public.registrar_ordem_compra('x', current_date)` falha com permissão negada, e `set role authenticated;` seguido da mesma chamada atinge a guarda interna (exceção "Apenas ADM", e não erro de privilégio) — executar `reset role;` ao final
- [x] 3.3 Espelhar em `banco.sql`: incluir junto aos grants de execute (após a linha 360) a revogação das mesmas três funções `from anon,public`, no estilo one-line do arquivo — verificar com `rg "revoke execute" banco.sql` listando as três funções

## 4. Drop da view morta

- [x] 4.1 No remoto, via MCP `execute_sql`: `drop view public.v_dashboard_operacional;` (sem CASCADE, não há dependentes) — verificar que a view não consta mais em `pg_class` com `relnamespace = 'public'`
- [x] 4.2 Espelhar em `banco.sql`: remover o bloco `create view public.v_dashboard_operacional` (linhas 334-335) e tirar `public.v_dashboard_operacional` do `grant select` a authenticated (linha 356) — verificar com `rg -c "v_dashboard_operacional" banco.sql` retornando zero

## 5. Validação integrada

- [x] 5.1 Reexecutar o Security Advisor via MCP (`get_advisors` type security): ERROR `security_definer_view` cai de 7 para 6 (apenas as views documentadas como exceção), WARN `function_search_path_mutable` zerado e WARN `anon_security_definer_function_executable` zerado
- [x] 5.2 Smoke no frontend com o banco real: login ADM e OPER listam projetos (`v_projetos_administrativo` / `v_projetos_operacional`), OPER vê a linha do tempo com `detalhes` nulo, dashboard financeiro carrega, e ADM registra OC e nota fiscal normalmente
