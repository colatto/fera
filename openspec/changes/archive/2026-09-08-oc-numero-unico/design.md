## Context

Ver exploração e proposal.md. Estado confirmado no banco remoto (via MCP Supabase):

- `ordem_compra` só tem PK e FK `registrado_por` — nenhum controle sobre `numero`.
- RPC `registrar_ordem_compra` faz insert direto, sem checagem (idêntica ao `banco.sql`).
- Duplicatas reais: numero "103" (ids 1 e 2) e "202" (ids 4 e 5). A OC id 2 é órfã; as ids 4 e 5 estão vinculadas aos projetos 5 (F-2026-0201) e 8 (F-2026-0005), respectivamente, ambos em `OC_REGISTRADA`.
- Uma OC já pode ser vinculada a vários projetos (projeto referencia a OC, não o contrário) — reuso legítimo acontece por `vincular_ordem_compra`.
- O front já tem infraestrutura de tradução de constraints (`MENSAGENS_CONSTRAINT`, `CODIGOS_CONSTRAINT` em `src/lib/formato.ts`, códigos 23505/23P01/23514) e o dialog de OC exibe erros via `mensagemDeErro`.

## Goals / Non-Goals

**Goals:**
- Impedir, no banco, nova OC com `numero` já existente (à prova de corrida).
- Rejeitar números com espaços nas pontas vindos de qualquer chamada (front sempre trima; a blindagem é contra chamadas diretas ao RPC).
- Mensagem amigável no toast para as duas falhas.
- Dados existentes coerentes com a nova regra.

**Non-Goals:**
- Não alterar `registrar_ordem_compra` nem `vincular_ordem_compra`.
- Não normalizar caixa (case-insensitive) nem alterar tipo/tamanho de `numero`.
- Não criar validação preventiva no front (consulta de duplicidade antes de enviar) — o erro transacional traduzido é suficiente para o volume da operação.

## Decisions

- **D1 — Unique constraint no banco, não checagem na RPC nem no front.** Um pre-check (`SELECT` antes do `INSERT`) dentro da RPC tem race condition (duas chamadas concorrentes passam juntas); validação só no front é contornável. Constraint `ordem_compra_numero_unico unique (numero)` é definitiva e segue o padrão do schema (`projeto.numero`, `codigo_pasta`, `cliente_cnpj_unico`, `tipo_projeto_nome_key`).
- **D2 — Check de normalização em vez de unique sobre expressão.** Alternativa `unique (btrim(numero))` toleraria espaços (normalizaria na comparação), mas o usuário decidiu **rejeitar** espaços, não tolerá-los: `ordem_compra_numero_normalizada check (numero = btrim(numero))` + unique exato. Mantém o dado armazenado limpo e as mensagens simples.
- **D3 — Deduplicação definida pelo usuário:** projeto 8 (F-2026-0005) é reapontado para a OC id 4; OC id 5 é deletada (mesma OC registrada por dois projetos — mesma data, sem centro de custo); OC órfã id 2 (duplicata de "103" sem vínculo) é deletada. A deduplicação precede a criação das constraints (que falhariam com as duplicatas presentes). Valores das linhas deletadas, para eventual recriação manual: id 2 → numero "103", data_oc 2026-09-04, centro null; id 5 → numero "202", data_oc 2026-09-08, centro null.
- **D4 — Mensagens via mapa existente.** Duas entradas novas em `MENSAGENS_CONSTRAINT`: `ordem_compra_numero_unico` ("Já existe uma ordem de compra com o número X." / forma sem valor equivalente) e `ordem_compra_numero_normalizada` ("O número da ordem de compra não pode começar ou terminar com espaços."). Se o PostgREST não repassar `details` no erro da RPC, o helper já degrada para a forma sem valor — nenhum outro ajuste.
- **D5 — `banco.sql` atualizado como referência declarativa.** Deploy é exclusivamente via MCP Supabase; o arquivo versiona o estado esperado.

## Risks / Trade-offs

- [MCP Supabase indisponível] → bloquear a operação remota e reportar, conforme contexto do projeto; nenhuma alternativa local é aceita.
- [Delete de OC id 5 com FK restrict se algo ainda apontar para ela] → reapontar o projeto 8 antes; nenhuma outra tabela referencia `ordem_compra` (verificado: `projeto.ordem_compra_id` é a única FK).
- [Unique com lock de escrita breve na tabela] → tabela pequena (poucas dezenas de linhas), impacto desprezível.
- [Erro da RPC sem `details`] → mensagem degrada para a forma sem valor; continua amigável.

## Migration Plan

Ordem rígida, todas as etapas de banco via MCP Supabase no projeto remoto (cada chamada é autônoma; a ordem garante que cada uma succeeds isoladamente):

1. `update projeto set ordem_compra_id = 4 where id = 8 and ordem_compra_id = 5`
2. `delete from ordem_compra where id = 5` (guarda: `and not exists (select 1 from projeto where ordem_compra_id = 5)`)
3. `delete from ordem_compra where id = 2` (mesma guarda)
4. `alter table ordem_compra add constraint ordem_compra_numero_normalizada check (numero = btrim(numero))`
5. `alter table ordem_compra add constraint ordem_compra_numero_unico unique (numero)`
6. Validar: `pg_constraint` traz as duas constraints; `group by numero having count(*) > 1` vazio; projeto 8 apontando para OC 4.

Rollback: constraints são removíveis com `drop constraint`; linhas deletadas têm valores documentados em D3 para recriação manual se necessário.

## Open Questions

(nenhuma — decisões de dados tomadas pelo usuário na exploração)
