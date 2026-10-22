# Proposal

## Why

O responsável interno do projeto é definido na criação (`criar_projeto`) e gravado em `projeto.responsavel_interno_id`, mas nunca é exibido: as views de projeção não o expõem e o detalhe não o mostra. Quem acessa um projeto não consegue saber quem responde por ele.

## What Changes

- Expor o nome do responsável interno nas duas projeções: `v_projetos_operacional` e `v_projetos_administrativo` passam a trazer `responsavel_interno` (nome de `usuario`, via left join em `responsavel_interno_id`).
- Exibir o campo "Responsável interno" no card "Dados do projeto" do detalhe, visível para ADM e OPER.
- Exibir a coluna "Responsável" na listagem de projetos, nas montagens operacional e administrativa, posicionada após "Operadora".
- Incluir a coluna "Responsável" no CSV exportado dos dois perfis, mantendo a exigência de que o CSV contém exatamente o subconjunto exibido na listagem.
- Regenerar `src/types/database.types.ts` para as novas colunas das views.
- Atualizar `banco.sql` como referência declarativa do novo estado das views (alteração real aplicada via MCP Supabase).
- Exibição apenas: o responsável continua definido exclusivamente na criação do projeto, sem edição posterior.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: a listagem por perfil e o detalhe do projeto passam a exibir o responsável interno (nome), presente na projeção dos dois perfis; a exportação da consulta corrente passa a incluir a coluna "Responsável" nos dois perfis.

## Impact

- **Banco (Supabase remoto, via MCP Supabase)**: recriação das views `v_projetos_operacional` e `v_projetos_administrativo` com `left join public.usuario` expondo `responsavel_interno`; `banco.sql` atualizado como referência.
- **Frontend**: `src/routes/projetos/projeto-detalhe.tsx` (novo campo no card "Dados do projeto"), `src/routes/projetos/projetos-listar.tsx` (colunas das duas montagens e colunas fixas do CSV), `src/types/database.types.ts` (regeneração).
- **Permissões**: nenhum grant novo — as views já são concedidas a `authenticated` e o join acontece dentro da view.
