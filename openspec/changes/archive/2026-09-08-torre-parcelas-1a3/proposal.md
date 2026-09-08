## Why

A regra atual fixa o limite de parcelas do tipo `Torre` em exatamente 3 (`tipo_torre_limite_parcelas`), mas o negócio permite que uma Torre receba de 1 a 3 parcelas. O campo hoje também é um input numérico livre, que não comunica as opções válidas ao usuário.

## What Changes

- **Regra da Torre**: o limite de parcelas deixa de ser obrigatoriamente `3` e passa a ser selecionável entre `1`, `2` ou `3`. A constraint do banco `tipo_torre_limite_parcelas` muda de `limite_parcelas = 3` para `limite_parcelas between 1 and 3`, mantendo o mesmo nome de constraint.
- **Formulário de tipo de projeto**: quando o nome do tipo for `Torre` (case-insensitive), o campo "Limite de parcelas" renderiza um `Select` com as opções 1, 2 e 3 em vez do input numérico livre.
- **Demais tipos permanecem inalterados**: regra `limite_parcelas > 0` no banco e input numérico livre na UI continuam como estão.
- **Mensagens**: validação local e a tradução da constraint passam a dizer "entre 1 e 3" em vez de "igual a 3"; a descrição do diálogo é atualizada.
- **Decisão de UX**: ao renomear um tipo para `Torre` com valor fora de 1..3 no campo, o valor NÃO é resetado — o Select fica sem opção visível e a validação local bloqueia o salvamento com mensagem amigável.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: a regra de formulário do tipo `Torre` muda de "limite de parcelas diferente de 3 é inválido" para "limite de parcelas fora de 1 a 3 é inválido", e o campo passa a ser um select restrito a 1, 2 ou 3 quando o nome do tipo é `Torre`.

## Impact

- **Banco (via MCP Supabase)**: dropar e recriar a check constraint `tipo_torre_limite_parcelas` em `public.tipo_projeto` com a nova condição. Dados existentes (Estrutural=1, Torre=3) permanecem válidos; nenhuma migração de dados é necessária.
- **`banco.sql`**: atualizado como referência declarativa do estado esperado (não é mecanismo de deploy).
- **`src/routes/cadastros/cadastros-tipos.tsx`**: validação local (`!== 3` → fora de 1..3), renderização condicional do Select para Torre, descrição do diálogo e comentário de regras.
- **`src/lib/formato.ts`**: mensagem traduzida de `tipo_torre_limite_parcelas` ("igual a 3" → "entre 1 e 3").
- **`requisitos.md`**: texto da regra do tipo `Torre` atualizado.
- **Fluxo de recebimentos**: sem alteração — a RPC `registrar_recebimento` lê `limite_parcelas` da tabela em tempo de execução.
