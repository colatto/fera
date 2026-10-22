# Tasks

## 1. Banco (MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto antes de qualquer alteração
- [x] 1.2 Recriar `v_projetos_operacional` e `v_projetos_administrativo` no remoto com `left join public.usuario u on u.id = p.responsavel_interno_id` expondo `u.nome as responsavel_interno`, mantendo `security_barrier`, e reaplicar `grant select ... to authenticated` em seguida; verificar no remoto que ambas as views retornam a coluna `responsavel_interno` e que os grants de `select` a `authenticated` estão ativos
- [x] 1.3 Atualizar `banco.sql` com as novas definições das duas views (incluindo o join) e conferir que o arquivo reflete exatamente o remoto; verificação: diff visual das seções das views e dos grants

## 2. Tipos e frontend

- [x] 2.1 Adicionar `responsavel_interno: string | null` em `v_projetos_operacional` e `v_projetos_administrativo` em `src/types/database.types.ts`; verificação: `npm run build` compila sem erro
- [x] 2.2 Em `src/routes/projetos/projeto-detalhe.tsx`, adicionar no card "Dados do projeto" o campo `<Campo rotulo="Responsável interno" valor={p.responsavel_interno ?? "—"} />` após "Operadora", visível para ADM e OPER; verificação: abrir o detalhe com usuário OPER e ADM e ver o nome do responsável
- [x] 2.3 Em `src/routes/projetos/projetos-listar.tsx`, adicionar `colunaTexto((l) => l.responsavel_interno, "Responsável")` após "Operadora" em `colunasOperacionais()` e `colunasAdministrativas()`; verificação: abrir a listagem nos dois perfis e ver a coluna posicionada após "Operadora"
- [x] 2.4 Em `exportarConsulta` de `projetos-listar.tsx`, incluir "Responsável" nas listas de colunas dos dois perfis e o valor correspondente em `linhaToCsvAdm` e `linhaToCsvOper`; verificação: exportar CSV nos dois perfis e conferir a coluna com os nomes

## 3. Validação integrada

- [x] 3.1 Validar o fluxo completo com um projeto recém-criado: criar projeto com responsável via `criar_projeto`, conferir nome na listagem (ADM e OPER), no detalhe (ADM e OPER) e no CSV exportado dos dois perfis; verificação: os três pontos exibem o mesmo nome definido na criação e nenhuma superfície oferece edição do responsável
- [x] 3.2 Rodar `openspec validate add-responsa-project` e `npm run build` sem erros
