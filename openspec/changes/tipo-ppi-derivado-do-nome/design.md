## Context

Hoje `tipo_projeto.is_ppi` é uma coluna booleana comum (`not null default false`), gravada pelo cliente a partir de um Switch no formulário, e a constraint `tipo_faixa_valida` ramifica a validação de faixa por esse valor. O formulário já possui o precedente de comportamento dirigido pelo nome: `Torre` (trim + lowercase exata) troca o campo de parcelas por um select 1–3, deliberadamente sem reset de valor. Verificado em 2026-09-08 via MCP Supabase: o banco tem somente `Torre` (1–200) e `Estrutural` (201–400) — nenhum tipo PPI existe, portanto nenhuma migração de dados é necessária. Nenhum consumidor além do formulário, da listagem e da constraint lê `is_ppi` (views usam `t.nome`).

## Goals / Non-Goals

**Goals:**
- Nome como fonte única da verdade do indicador PPI, tanto na UX quanto no banco.
- Migração do banco executada exclusivamente via MCP Supabase, com `banco.sql` atualizado como referência declarativa.

**Non-Goals:**
- Não alterar regras de faixa em si (PPI ≥ 1001 opcional; não PPI 0–1000 obrigatório) — só muda de onde o indicador vem.
- Não tocar em triggers, views, RLS, políticas ou no fluxo de numeração (`fn_proximo_automatico`, RPC de criação de projeto).
- Não generalizar o mecanismo "nome dirige formulário" além de `Torre` e `PPI`.

## Decisions

### D1 — `is_ppi` vira coluna gerada no banco
`is_ppi boolean generated always as (lower(nome) = 'ppi') stored`, sem default. O banco recalcula sozinho a todo insert/update de `nome`; divergência nome ↔ indicador torna-se impossível por construção.

Alternativas consideradas:
- *Check constraint* `(lower(nome) = 'ppi') = is_ppi`: manteria a coluna gravável com garantia equivalente, mas preserva um estado redundante e exige que todo escritor calcule o valor. Rejeitada — a coluna gerada elimina o campo em vez de vigiá-lo.
- *Apenas UI deriva e envia*: zero migração, mas o banco continuaria confiando no cliente. Rejeitada — decisão do usuário foi "gerar sempre como coluna".

PostgreSQL não converte coluna comum em gerada via `ALTER` (o `SET EXPRESSION` só reconfigura colunas já geradas), então a migração reconstrói a coluna: drop de `is_ppi` (que derruba `tipo_faixa_valida` automaticamente, por referenciá-la), re-adição como gerada e recriação idêntica da constraint. Tudo numa única migration atômica no MCP.

### D2 — Derivação duplicada: cliente para UX, banco como autoridade
O front calcula `ehPpi = nome.trim().toLowerCase() === "ppi"` para validação local, rótulo "(opcional)" da faixa final e auto-preenchimento — espelhando as constraints, como o resto do formulário já faz. O payload de insert/update deixa de conter `is_ppi` (coluna gerada não é gravável). `ValoresTipoProjeto` perde o campo e `validarTipo` deriva o indicador do nome recebido. A dupla derivação é o mesmo padrão já usado para faixa e Torre: regra local para resposta imediata, banco como barreira final.

### D3 — Auto-preenchimento na borda de subida (não-PPI → PPI)
No manipulador do campo nome, compara-se o PPI derivado do estado anterior com o do próximo; somente na transição `false → true` o formulário ajusta `faixa_inicial = 1001` e `faixa_final = null`. A transição inversa não restaura nada — validação local bloqueia faixa inconsistente com o novo nome (simétrico ao cenário "Renomeação para Torre" existente).

Alternativa: auto-preencher somente na criação (`edicao === null`). Rejeitada — renomear um tipo existente para PPI tem a mesma necessidade e a borda de subida cobre ambos os casos com uma regra só.

### D4 — Listagem sem coluna PPI
Remover `TableHead`/`TableCell` de PPI. A informação fica comunicada pelo nome e pela faixa (`1001+`), como o restante da tela. Sem coluna derivada redundante.

### D5 — Mensagem da constraint atualizada
`tipo_faixa_valida` em `src/lib/formato.ts` passa a citar a origem nominal: tipos chamados `PPI` usam faixa a partir de 1001; demais, 0–1000 com final obrigatório. A chave da constraint não muda.

## Risks / Trade-offs

- [Digitação transitória re-dispara o auto-preenchimento] → Ao editar o nome de um tipo já PPI passando por um estado não-PPI ("PPI" → "PP" → "PPI"), a borda de subida volta a preencher 1001/limpar o final. Aceito: os valores aplicados são exatamente os padrões canônicos de PPI, e o usuário vê o efeito no ato.
- [Coluna gerada rejeita qualquer payload que envie `is_ppi`] → A regeneração de `database.types.ts` via MCP remove o campo de Insert/Update e o TypeScript passa a marcar o envio como erro em tempo de compilação.
- [Drop da coluna derruba `tipo_faixa_valida` junto] → A migration recria a constraint na mesma operação; sem a constraint aplicada não há janela útil, pois tudo roda numa transação de DDL única.
- [Renomear um tipo PPI esbarra na validação sem aviso prévio] → Igual ao comportamento aceito para Torre: sem reset automático, mensagem de validação local explica a regra violada.
- [Tipos "PPI-like" futuros (ex.: "PPI Rodoviário") não terão faixa ≥ 1001] → Por design: a regra passa a ser propriedade do nome exato `PPI`. Se um dia precisar de outro nome PPI, é um novo change (coluna gerada teria que mudar de expressão).

## Migration Plan

1. Confirmar MCP Supabase conectado ao projeto correto.
2. Aplicar migration única: `alter table public.tipo_projeto drop column is_ppi;` → `add column is_ppi boolean generated always as (lower(nome) = 'ppi') stored;` → recriar `tipo_faixa_valida` com a definição atual.
3. Validar: schema resultante, constraint ativa, `insert` de teste com nome "PPI" produzindo `is_ppi = true` e faixa 1001 válida (e bloqueio de faixa 500), depois limpar o registro de teste.
4. Atualizar `banco.sql` (referência declarativa) com o mesmo estado.
5. Regenerar `src/types/database.types.ts` via MCP e seguir com o front.

Rollback: migration inversa — drop da coluna gerada e da constraint, re-adição de `is_ppi boolean not null default false` e da constraint original. Sem dado a preservar (nenhum tipo PPI existe hoje).
