## Why

O conceito de substituição de projeto (predecessor cancelado → sucessor) não faz mais parte do negócio: o usuário confirmou que o conceito morreu, e o campo "Projeto predecessor (opcional)" no formulário de novo projeto é ruído para toda criação comum. O banco remoto não possui nenhum dado do conceito (0 eventos `SUBSTITUICAO`, 0 projetos com predecessor), então a remoção pode ser total e limpa.

## What Changes

- **BREAKING** Remoção do conceito de predecessor/substituição de ponta a ponta:
  - Formulário de novo projeto: remove o campo "Projeto predecessor (opcional)", o estado `predecessorId`, a constante `SEM_PREDECESSOR`, a consulta de projetos `CANCELADO` que o alimentava e o envio de `p_anterior_id`.
  - RPC `criar_projeto`: remove o parâmetro `p_anterior_id`, a validação "Projeto anterior deve estar cancelado" e o registro do evento `SUBSTITUICAO`.
  - Banco: remove a coluna `projeto.projeto_anterior_id`, as FK/relações associadas e a constraint `projeto_anterior_distinto`; remove o valor `SUBSTITUICAO` do enum `project_event_type`.
  - Frontend: remove `SUBSTITUICAO` de `ROTULOS_EVENTO` (exaustividade de `TipoEvento` após regenerar tipos).
  - Tipos gerados (`database.types.ts`) são regenerados a partir do banco pós-migração.
- Documentação de requisitos (`requisitos.md`) deixa de mencionar predecessor.
- Nenhum dado histórico é perdido: verificado que não existem linhas referenciando o conceito.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: a criação de projeto deixa de incluir predecessor opcional — o requisito de criação passa a cobrir apenas tipo, cliente e identificador, operadora e identificador, cidade, UF, valor e responsável, sem parâmetro de predecessor na RPC `criar_projeto`.
- `consulta-projetos`: a linha do tempo deixa de tratar eventos de substituição — a exigência de não exibir identificadores internos e a lista de tipos humanizados deixam de mencionar substituição.

## Impact

- **Banco (Supabase remoto, via MCP — migração)**: `projeto.projeto_anterior_id` (coluna, FK autorreferenciada, constraint `projeto_anterior_distinto`), enum `project_event_type` (valor `SUBSTITUICAO`), função `criar_projeto`. Migração destrutiva em coluna, porém sem perda real (nenhuma linha usa o conceito). `banco.sql` é atualizado como referência declarativa, não como mecanismo de deploy.
- **Frontend**: `src/routes/projetos/projeto-novo.tsx`, `src/queries/fluxo.ts` (`ParametrosCriacao`), `src/lib/constantes.ts` (`ROTULOS_EVENTO`), `src/types/database.types.ts` (regeneração via MCP).
- **Docs**: `requisitos.md` (descrição da entidade projeto).
- **Specs**: deltas de `fluxo-projetos` e `consulta-projetos`.
