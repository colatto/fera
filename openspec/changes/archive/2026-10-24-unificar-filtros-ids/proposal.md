# Proposal

## Why

A listagem de projetos oferece dois filtros de texto separados, "ID. cliente" e
"ID. operadora", que na prática nunca são combinados: um projeto é localizado
por um identificador ou pelo outro. Os dois campos ocupam espaço na barra de
filtros e fragmentam a busca, obrigando o usuário a saber de antemão qual
identificador procurar.

## What Changes

- Substituir os dois filtros de texto "ID. cliente" e "ID. operadora" por um
  único campo **"ID cliente/oper."** na listagem de projetos.
- O termo digitado casa com `identificador_cliente` **ou**
  `identificador_operadora` (busca por substring, sem diferenciar
  maiúsculas), combinado por AND com os demais filtros ativos.
- Deixa de ser possível exigir os dois identificadores na mesma consulta
  (combinação AND entre eles, hoje tecnicamente possível e sem uso real).
- Colunas da tabela e exportação CSV mantêm "ID cliente" e "ID operadora"
  como colunas distintas, sem alteração.
- Grade de filtros passa de 9 para 8 campos no breakpoint largo.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Filtros combináveis" passa a descrever um
  único filtro de identificador "ID cliente/oper." com semântica OR entre os
  identificadores de cliente e de operadora, em vez dos dois filtros
  independentes atuais.

## Impact

- `src/queries/projetos.ts`: `FiltrosProjetos` perde `identificadorCliente` e
  `identificadorOperadora` e ganha um campo único; `filtrosVazios` e
  `montarConsulta` acompanham (condição OR via PostgREST `.or()`).
- `src/routes/projetos/projetos-listar.tsx`: dois `FiltroTexto` viram um;
  grade de filtros ajustada de 9 para 8 colunas no breakpoint largo.
- Sem mudança em banco, views, RLS ou backend: os filtros continuam sendo
  aplicados pelo cliente Supabase sobre as views existentes.
- Chaves de cache do React Query mudam de forma natural (o objeto de filtros
  muda de forma), sem efeito além de novas entradas de cache.
