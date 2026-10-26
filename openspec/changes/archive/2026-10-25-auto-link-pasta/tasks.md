# Tasks

## 1. Função no Supabase

- [x] 1.1 Aplicar migration pelo MCP Supabase (`apply_migration`) recriando `public.criar_projeto` com a montagem da pasta local no INSERT — `format('P:\_OBRAS_%s\%s', v_ano, <código>)`, reutilizando o mesmo `v_ano` e o mesmo código gerado na transação — e reemitindo na mesma migration o `grant execute on function public.criar_projeto(...) to authenticated`. Verificação: consulta somente-leitura confirmando que o corpo vigor da função (`pg_get_functiondef`) contém a base `P:\_OBRAS_` e que `information_schema.routine_privileges` registra o grant para `authenticated`.

## 2. Referência declarativa

- [x] 2.1 Atualizar `banco.sql` com o novo corpo de `criar_projeto`, idêntico ao implantado. Verificação: o trecho da função em `banco.sql` contém a montagem `P:\_OBRAS_` e o conteúdo foi conferido contra a migration aplicada.

## 3. Verificação de comportamento

- [x] 3.1 Antes do deploy, extrair pelo MCP snapshot somente-leitura (`id`, `codigo_pasta`, `pasta_local`) dos projetos existentes; após o deploy, reextrair e conferir que permanece idêntico — nenhum projeto existente foi alterado pelo deploy.
- [x] 3.2 Verificar somente-leitura a montagem e a constraint com valores de exemplo do ano corrente e de virada de ano: `format('P:\_OBRAS_%s\%s', 2026, 'F-2026-0042')` produz `P:\_OBRAS_2026\F-2026-0042` (e o análogo para 2027), e o resultado satisfaz a regex da constraint `projeto_pasta_local_caminho` e o limite de 500 caracteres.
- [x] 3.3 Executar teste transacional com rollback pelo MCP: em `BEGIN`, simular os claims JWT de um ADM ativo (`set_config('request.jwt.claims', ...)`) com cadastros ativos existentes, chamar `criar_projeto`, conferir que o projeto nasce com `pasta_local = 'P:\_OBRAS_<ano>\<código>'` coerente com o `codigo_pasta` gerado e com o evento `CRIACAO` sem detalhes da pasta, e então `ROLLBACK` — nada persistido, sequência não consumida. Se a simulação de claims não for viável pela conexão do MCP, validar acompanhando a primeira criação real pela interface e conferindo a pasta exibida no detalhe com a ação "Abrir pasta" disponível.

## Workflow follow-up

- Revisar os artefatos e, com o trabalho concluído, arquivar a change (`/opsx:archive`) — o arquivamento sincroniza o delta em `openspec/specs/fluxo-projetos/spec.md`.
