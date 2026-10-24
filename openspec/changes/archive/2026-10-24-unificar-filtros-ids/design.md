# Design

## Context

Os filtros da listagem de projetos são montados no cliente e aplicados pelo
Supabase (PostgREST) diretamente nas views `v_projetos_administrativo` /
`v_projetos_operacional`, em `montarConsulta` (`src/queries/projetos.ts`).
Hoje `identificadorCliente` e `identificadorOperadora` viram dois `.ilike()`
encadeados (AND). A motivação e o escopo estão em `proposal.md`; a semântica
OR do campo único foi confirmada em exploração com o usuário.

## Goals / Non-Goals

**Goals:**

- Um campo "ID cliente/oper." que casa o termo com `identificador_cliente`
  OR `identificador_operadora`, AND com os demais filtros, em uma única
  requisição PostgREST.

**Non-Goals:**

- Unificar as colunas "ID. cliente" / "ID. operadora" da tabela ou do CSV
  (seguem distintas).
- Tocar em banco, views, RLS ou no detalhe/cadastro de projeto (os campos de
  mesmo nome ali são estados locais independentes da listagem).

## Decisions

**1. OR no servidor via `.or()` do PostgREST, não mescla no cliente.**
`montarConsulta` troca os dois `.ilike()` por
`.or("identificador_cliente.ilike.%X%,identificador_operadora.ilike.%X%")`.
Alternativa considerada: duas consultas mescladas no cliente — rejeitada por
duplicar requisições, exigir deduplicação e reinventar o que o PostgREST já
resolve; a condição OR também continua combinada por AND com os demais
filtros automaticamente.

**2. Campo único `identificador` em `FiltrosProjetos`.**
`identificadorCliente` e `identificadorOperadora` saem da interface, de
`filtrosVazios` e do grid de filtros; entra `identificador: string`.
`filtrosAtivos` é genérico sobre os valores e não muda. As chaves de cache
do React Query serializam o objeto de filtros, então mudam de forma
naturalmente, sem trabalho extra.

**3. Termo sanitizado: `trim()` e remoção de vírgulas.**
A string do `.or()` usa vírgula como separador de condições; um termo com
vírgula seria interpretado como duas condições. Como identificadores são
alfanuméricos, a decisão é remover vírgulas do termo (comportamento simples
e previsível). Alternativa considerada: sintaxe com valor entre aspas do
PostgREST (`ilike."%a,b%"`) — rejeitada por trocar um caso de borda por
outro (aspas no termo) sem ganho real.

**4. UI: um `FiltroTexto` no lugar do primeiro, grade 9→8.**
O campo "ID cliente/oper." ocupa a posição do antigo "ID. cliente" (entre
Cliente e Operadora). A grade de filtros passa de `lg:grid-cols-9` para
`lg:grid-cols-8` para não sobrar célula vazia.

## Risks / Trade-offs

- [Vírgula removida do termo pode surpreender quem cola texto com vírgula]
  → Mitigação: identificadores não contêm vírgula; limitação documentada
  aqui e na spec (busca por substring).
- [String do `.or()` montada à mão; erro de digitação em nome de coluna só
  aparece em runtime] → Mitigação: nomes copiados das colunas já usadas em
  `.ilike()` hoje; verificação manual no apply com a página aberta.
- [Perde-se a combinação AND entre os dois identificadores] → Aceito em
  exploração: um projeto é localizado por um ID ou pelo outro, nunca pelos
  dois simultaneamente.

## Migration Plan

Mudança somente de frontend: publicar é o deploy; rollback é reverter o
commit. Sem migração de dados ou de cache (chaves antigas apenas deixam de
ser consultadas).
