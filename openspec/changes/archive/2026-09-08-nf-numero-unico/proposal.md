## Why

O sistema permite registrar o mesmo número de nota fiscal em projetos diferentes — hoje a nota "100" existe nos projetos 2 e 3. Como cada projeto tem exatamente uma nota (já garantido por `UNIQUE (projeto_id)`), a duplicação visível na listagem vem do número, que não tem nenhuma restrição. A OC já resolveu o mesmo problema com número único; a NF precisa do tratamento equivalente.

## What Changes

- **BREAKING (dados)**: exclusão das notas fiscais de teste duplicadas (NF "100" dos projetos 2 e 3), decidido como limpeza de lixo de teste; nenhuma delas tem recebimentos vinculados.
- Novos constraints em `public.nota_fiscal`, espelhando os da OC: `nota_fiscal_numero_unico` (UNIQUE em `numero`) e `nota_fiscal_numero_normalizada` (CHECK `numero = btrim(numero)`).
- Atualização da referência declarativa `banco.sql` para refletir os novos constraints.
- Entradas de mensagem amigável em `MENSAGENS_CONSTRAINT` (`src/lib/formato.ts`) para as duas novas constraints da NF, completando o tratamento que a OC já possui — formulários de OC e NF passam a traduzir duplicidade e número com espaços em mensagens em português, com o valor duplicado quando disponível.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: novo requisito de unicidade do número da nota fiscal — registro com número já existente ou com espaços nas pontas falha transacionalmente, com mensagem amigável na interface que identifique o número duplicado.

## Impact

- **Banco remoto (Supabase via MCP)**: `ALTER TABLE public.nota_fiscal` para os dois constraints, após exclusão das notas de teste e verificação de que não há números com espaços nas pontas.
- **`banco.sql`**: espelho declarativo da tabela `nota_fiscal`.
- **Front-end**: `src/lib/formato.ts` (mapa `MENSAGENS_CONSTRAINT`); nenhum formulário muda, pois ambos já usam `mensagemDeErro` e fazem `trim` do número.
- **Fluxo**: nenhuma mudança de status ou de RPC; `registrar_nota_fiscal` passa apenas a falhar via constraint quando o número já existir.
