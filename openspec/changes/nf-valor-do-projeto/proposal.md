## Why

Ao registrar a nota fiscal, o ADM precisa digitar o valor manualmente, embora todo projeto já tenha valor gravado e imutável desde a criação. A digitação é trabalho redundante e abre espaço para a nota divergir do valor do projeto — divergência que o schema tolera, mas a regra de negócio não deseja: a nota é uma por projeto e representa o faturamento daquele valor.

## What Changes

- **BREAKING**: a RPC `registrar_nota_fiscal` perde o parâmetro `p_valor` e passa a derivar o valor da nota de `projeto.valor` internamente, garantindo na fonte que a nota é sempre pelo valor do projeto.
- O diálogo "Registrar nota fiscal" deixa de ter campo de valor editável e passa a exibir o valor do projeto como texto somente leitura (formatado em moeda).
- A validação local do diálogo passa a exigir apenas número e data de emissão.
- O cliente (`registrarNotaFiscal`) deixa de enviar valor à RPC.
- `banco.sql` (referência declarativa) e `src/types/database.types.ts` são atualizados para a nova assinatura.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o registro de nota fiscal deixa de aceitar valor informado pelo cliente — a RPC `registrar_nota_fiscal` MUST derivar o valor de `projeto.valor`, e o diálogo MUST exibir o valor do projeto como somente leitura em vez de campo editável.

## Impact

- **Supabase (projeto remoto, via MCP)**: reescrita da função `registrar_nota_fiscal` sem `p_valor`, lendo `projeto.valor` no INSERT. Chamadas existentes com 4 argumentos passam a falhar — único chamador é o próprio app.
- **Front**: `src/queries/projetos.ts` (wrapper da RPC), `src/routes/projetos/projeto-detalhe.tsx` (`DialogNotaFiscal`).
- **Tipos**: regeneração de `src/types/database.types.ts` (Args da RPC mudam).
- **Referência declarativa**: `banco.sql`.
- **Efeito indireto desejado**: como `registrar_recebimento` já valida total recebido ≤ `nota.valor`, limitar a nota ao valor do projeto também limita os recebimentos ao valor do projeto.
