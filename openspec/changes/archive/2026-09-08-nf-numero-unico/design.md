## Context

A regra "uma nota por projeto" já é imposta por `nota_fiscal_projeto_id_key` (UNIQUE em `projeto_id`) no banco remoto; o que falta é unicidade do `numero` entre projetos — hoje a NF "100" existe nos projetos 2 e 3. A OC já resolveu o mesmo problema (constraints `ordem_compra_numero_unico` e `ordem_compra_numero_normalizada` + entradas em `MENSAGENS_CONSTRAINT` de `src/lib/formato.ts`), e o comentário do código indica que esse mapa foi desenhado exatamente para receber novos constraints. O usuário decidiu: unicidade global do número de NF, as duas notas "100" são lixo de teste a excluir, e o tratamento amigável deve cobrir OC e NF de uma vez.

## Goals / Non-Goals

**Goals:**
- Impedir, transacionalmente, registro de NF com número já existente em qualquer projeto.
- Impedir números com espaços nas pontas, espelhando a normalização da OC.
- Mensagens amigáveis em português para duplicidade e número com espaços, tanto na NF quanto na OC (a OC já as tem; a NF completa o mapa).
- `banco.sql` refletindo o estado esperado da tabela `nota_fiscal`.

**Non-Goals:**
- Mudar a RPC `registrar_nota_fiscal` (ela não precisa validar unicidade nem normalizar: os constraints fazem isso e a UI já faz `trim` antes de enviar).
- Unicidade case-insensitive ou por ano/cliente/emitente.
- Revisão do estado `CANCELADO com nota` do projeto 2 além da exclusão da nota de teste.
- Rewriting de eventos históricos de `evento_projeto` (permanecem como auditoria).

## Decisions

**D1 — UNIQUE global em `numero`, espelhando a OC.** `nota_fiscal_numero_unico UNIQUE (numero)` e `nota_fiscal_numero_normalizada CHECK (numero = btrim(numero))`, com exatamente esses nomes: `mensagemDeErro` traduz por nome de constraint, então o padrão de nomenclatura da OC é o que conecta banco e UI. Alternativas descartadas: unicidade por ano ou case-insensitive (a OC adotou unicidade simples e case-sensitive; NF segue o mesmo critério para manter um único padrão no sistema).

**D2 — Limpeza de dado antes do constraint, nesta ordem.** Excluir as duas notas "100" (nenhuma tem recebimentos — verificado, então o `ON DELETE RESTRICT` de `recebimento` não bloqueia), depois verificar que não resta `numero <> btrim(numero)`, e só então criar os constraints (criar antes falharia com a duplicata existente). Como o projeto 3 fica em `NOTA_EMITIDA` sem nota, repor seu status para `AUTORIZADO_FATURAMENTO` via MCP — o estado consistente anterior ao registro de teste. O projeto 2, `CANCELADO`, fica consistente sem nota.

**D3 — Mensagens via mapa existente, sem novo mecanismo.** Duas entradas em `MENSAGENS_CONSTRAINT`: `nota_fiscal_numero_unico` ("Já existe uma nota fiscal com o número X.") e `nota_fiscal_numero_normalizada` ("O número da nota fiscal não pode começar ou terminar com espaços."), no formato `{comValor, semValor}` já usado pela OC. `valorDuplicado` extrai o número de `details`; sem `details`, degrada para a forma sem valor, que já é amigável. Nenhum formulário muda: `DialogNotaFiscal` e o diálogo de OC já usam `mensagemDeErro` e já fazem `numero.trim()`.

**D4 — Deploy 100% via MCP Supabase.** `ALTER TABLE public.nota_fiscal ADD CONSTRAINT ...` no remoto, e o mesmo estado refletido em `banco.sql` como referência declarativa. Nada de migração local ou CLI.

## Risks / Trade-offs

- [PostgREST pode omitir `code`/`details` em erro de constraint dentro de RPC] → o mesmo caminho (RPC + `mensagemDeErro`) já está em produção para a OC; validação manual do toast cobre o caso, e a degradação para a mensagem sem valor é aceitável.
- [UNIQUE case-sensitive deixa "NF-100" e "nf-100" coexistirem] → aceito por alinhamento com a OC; se virar problema real, vira change própria.
- [Eventos de teste permanecem na linha do tempo dos projetos 2 e 3] → auditoria histórica intacta; os projetos são de teste, e reescrever eventos não é escopo.

## Migration Plan

1. Excluir as duas notas de teste (MCP).
2. Repor status do projeto 3 para `AUTORIZADO_FATURAMENTO` (MCP).
3. Verificar inexistência de números com espaços nas pontas e criar os dois constraints (MCP).
4. Atualizar `banco.sql` e `src/lib/formato.ts`.
5. Validação manual: registrar NF com número duplicado (toast amigável com o número), com espaços (bloqueado no banco com mensagem amigável; a UI já envia trimado), e OC duplicada (mensagem já existente).
6. Rollback: `ALTER TABLE ... DROP CONSTRAINT` dos dois nomes; exclusões de dado não são revertíveis.
