## Why

Depois de cadastrado, o projeto não oferece forma de corrigir os identificadores do cliente e da operadora — erros de digitação ou de apontamento só poderiam ser resolvidos fora do sistema. O banco já reserva o evento `ALTERACAO_CADASTRAL` para esse tipo de alteração, mas nenhuma função o utiliza.

## What Changes

- Novo botão "Editar" na tela de detalhe do projeto, visível somente quando o status é `CADASTRADO`.
- Novo diálogo de edição com os campos "Identificador do cliente" e "Identificador da operadora" pré-preenchidos (somente o texto; cliente e operadora selecionadas permanecem imutáveis).
- Nova RPC `editar_identificadores_projeto` no banco: restrita a ADM, exige status `CADASTRADO`, grava evento `ALTERACAO_CADASTRAL` (registro de quem alterou e quando, sem detalhes) e não grava evento quando nada mudou.
- Atualização de `banco.sql` como referência declarativa e regeneração de `src/types/database.types.ts`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `fluxo-projetos`: novo requisito de edição dos identificadores em status `CADASTRADO` — permissão ADM, RPC transacional, evento `ALTERACAO_CADASTRAL` na linha do tempo e comportamento quando os valores não mudam.

## Impact

- **Banco (via MCP Supabase, apenas):** nova função `public.editar_identificadores_projeto`; `banco.sql` atualizado como referência versionada. Sem mudança de schema de tabelas, policies ou views.
- **Frontend:** `src/routes/projetos/projeto-detalhe.tsx` (botão + diálogo), `src/queries/fluxo.ts` (RPC e invalidações via `useAcaoFluxo`), `src/types/database.types.ts` (regeneração).
- **Sem impacto:** listagem, filtros, dashboards, perfis e fluxos existentes — os campos editados já aparecem nas views e são refletidos pela invalidação de cache padrão.
