## Why

É possível registrar uma nova Ordem de Compra com um `numero` que já existe: a tabela `ordem_compra` não tem constraint unique em `numero`, a RPC `registrar_ordem_compra` insere sem checagem e o front não valida. O banco remoto já tem duplicatas reais ("103" nos ids 1 e 2; "202" nos ids 4 e 5), o que gera OCs fantasmas na lista de vinculação e risco de rastreabilidade financeira.

## What Changes

- **BREAKING** (dados): deduplicar `ordem_compra.numero` no Supabase remoto via MCP Supabase — pré-requisito para criar a constraint:
  - Reapontar o projeto 8 (F-2026-0005) da OC id 5 para a OC id 4 e deletar a OC id 5 (mesma OC registrada duas vezes por dois projetos).
  - Deletar a OC órfã id 2 (duplicata órfã do numero "103", sem nenhum projeto vinculado).
- Adicionar na tabela `ordem_compra`:
  - `ordem_compra_numero_unico unique (numero)` — impede nova OC com número já existente, à prova de corrida.
  - `ordem_compra_numero_normalizada check (numero = btrim(numero))` — blinda contra chamadas diretas ao RPC com espaços nas pontas.
- Front (`src/lib/formato.ts`): adicionar ao `MENSAGENS_CONSTRAINT` as traduções das duas constraints novas, para o toast exibir mensagem amigável.
- Atualizar `banco.sql` (referência declarativa versionada) com as constraints novas.
- A RPC `registrar_ordem_compra` permanece inalterada: o insert passa a violar a constraint e o erro flui pelo tratamento de erro existente do dialog.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: registrar nova OC com número já existente passa a falhar transacionalmente (unique + check de normalização), e a interface exibe mensagem amigável informando o número duplicado; dados existentes são deduplicados.

## Impact

- Banco (Supabase remoto, exclusivamente via MCP Supabase): `ordem_compra` (2 constraints novas), dados de `ordem_compra` (delete das ids 2 e 5) e `projeto` (update de `ordem_compra_id` do projeto 8).
- Front: `src/lib/formato.ts` (mapa `MENSAGENS_CONSTRAINT`).
- Referência: `banco.sql`.
- Comportamento visível: dialog "Ordem de compra" passa a recusar número duplicado com toast claro; lista de vinculação deixa de exibir OCs duplicadas.
