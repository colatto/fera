## 1. Frontend sem predecessor (antes da migração, decisão 1 do design)

- [x] 1.1 Em `src/routes/projetos/projeto-novo.tsx`, remover o campo "Projeto predecessor (opcional)", o estado `predecessorId`, a constante `SEM_PREDECESSOR`, a consulta `cancelados` (listagem de `CANCELADO` que só o alimentava), o envio de `p_anterior_id` em `submeter()` e imports/linhas que ficarem sem uso
- [x] 1.2 Em `src/queries/fluxo.ts`, remover `p_anterior_id` de `ParametrosCriacao`
- [x] 1.3 Rodar `npm run build` e confirmar compilação contra o banco atual (a RPC antiga aceita a ausência do parâmetro)

## 2. Migração do banco via MCP Supabase

- [x] 2.1 Aplicar migração única com: `DROP FUNCTION public.criar_projeto(bigint, bigint, varchar, bigint, varchar, varchar, char(2), numeric, uuid, bigint)` e recriação de `criar_projeto` sem `p_anterior_id` (sem validação de predecessor e sem evento `SUBSTITUICAO`); `ALTER TABLE public.projeto DROP CONSTRAINT projeto_anterior_distinto` e `DROP COLUMN projeto_anterior_id`; enum `project_event_type` sem `SUBSTITUICAO` — via recriação do tipo (PostgreSQL não implementa `ALTER TYPE ... DROP VALUE`; ver decisão 2 do design), incluindo drop/recriação da view `v_eventos_operacionais` e grant `SELECT` a `authenticated`
- [x] 2.2 Ler de volta via MCP: `projeto_anterior_id` ausente em `projeto`, enum `project_event_type` sem `SUBSTITUICAO` e nova assinatura de `criar_projeto` em `pg_proc`

## 3. Tipos e referência declarativa

- [x] 3.1 Regenerar `src/types/database.types.ts` com `generate_typescript_types` (MCP), substituindo o arquivo por inteiro
- [x] 3.2 Em `src/lib/constantes.ts`, remover a chave `SUBSTITUICAO` de `ROTULOS_EVENTO` (compilação exaustiva de `Record<TipoEvento, string>` passa a exigir)
- [x] 3.3 Atualizar `banco.sql` como referência declarativa: enum `project_event_type` sem `SUBSTITUICAO`, tabela `projeto` sem coluna/constraint e função `criar_projeto` sem `p_anterior_id`

## 4. Documentação de requisitos

- [x] 4.1 Em `requisitos.md`, remover "predecessor opcional" da descrição da entidade projeto e a sentença "O predecessor deve estar cancelado e só pode ter um sucessor."

## 5. Verificação final

- [x] 5.1 Rodar `npm run build` (o `tsc -b` pega referências sobreviventes ao conceito) e exercitar o formulário de novo projeto no dev server para confirmar a criação sem o campo
- [x] 5.2 Rodar `openspec validate --change delete-predecessor` e conferir status completo dos artefatos
