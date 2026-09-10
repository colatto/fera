# Design — Valor do projeto

## Context

O formulário "Novo projeto" (`src/routes/projetos/projeto-novo.tsx`) cria projetos exclusivamente pela RPC `criar_projeto` (`src/queries/fluxo.ts`), que grava a tabela `public.projeto` e o evento `CRIACAO`. A projeção do ADM vem de `v_projetos_administrativo`; a do OPER, de `v_projetos_operacional`; o dashboard financeiro lê `v_dashboard_financeiro`, hoje agregada só sobre `nota_fiscal`. O banco remoto possui **14 projetos** (12 não cancelados), todos sem valor — o deploy precisa de backfill. Toda alteração de banco é feita pelo MCP Supabase; `banco.sql` é apenas a referência declarativa versionada do estado final.

## Goals / Non-Goals

**Goals:**

- Coluna de valor monetária obrigatória e positiva em `public.projeto`, preenchida na criação e nunca mais alterada.
- Exposição exclusiva na projeção administrativa: listagem, detalhe ("Dados do projeto"), CSV e dashboard financeiro ("Projetos").

**Non-Goals:**

- Edição/correção do valor pós-criação (nenhuma RPC de alteração será criada).
- Filtro por valor na listagem; métricas de valor no dashboard operacional ou por período.
- Mudança na linha do tempo: o evento de criação continua sem valor (a constraint `evento_detalhes_sem_financeiro` já proíbe a chave `valor` em `detalhes`).

## Decisions

### D1 — Coluna `valor numeric(15,2) not null` com check de positividade
Segue a convenção de `nota_fiscal.valor` e `recebimento.valor_recebido` (`numeric(15,2)` + `check > 0`, requisitos.md). Obrigatória (`not null`) porque o valor é exigido na criação e imutável. Alternativa considerada: coluna anulável para acomodar legado — rejeitada porque enfraquece a regra de negócio e desloca a obrigação para a interface; o legado é resolvido com backfill na migração (ver plano).

### D2 — RPC `criar_projeto` ganha `p_valor numeric` sem default
Parâmetro sem `default` torna o valor obrigatório na chamada — a exigência vive no contrato da função, não só na interface. A validação de positividade fica por conta do check da tabela. O `insert` passa a gravar `valor`; o evento `CRIACAO` permanece exatamente `jsonb_build_object('origem','cadastro')`.

**Atenção à troca de assinatura:** adicionar parâmetro muda a assinatura da função (nome + tipos). `create or replace` cria uma *nova* função; a antiga de 9 parâmetros continuaria existindo e concedida. A migração MUST criar a nova função, conceder `grant execute` com a nova assinatura e **dropar a função antiga**.

### D3 — Views: coluna no fim da lista do select
`v_projetos_administrativo` ganha `p.valor` (anexada ao final da lista) — `create or replace view` exige que colunas novas venham após as existentes; grants são preservados. `v_projetos_operacional` permanece intocada: o OPER não obtém a coluna em nenhuma superfície, e o acesso continua governado pela view, não pela interface.

### D4 — `v_dashboard_financeiro` ganha `valor_projetos` por subconsulta escalar
A view é um agregado de linha única sobre `nota_fiscal`; a métrica de carteira entra como subconsulta escalar independente do agregado:

```sql
coalesce((select sum(p.valor) from public.projeto p
          where p.status <> 'CANCELADO'), 0::numeric(15,2)) valor_projetos
```

Exclui cancelados, em linha com `v_dashboard_operacional`. A subconsulta roda como dono da view, mesmo modelo das leituras atuais de `nota_fiscal`; a visibilidade continua garantida pelo predicado `usuario_adm()` já presente. Alternativa considerada: `join lateral` com `projeto` — rejeitada por multiplicar linhas do agregado ou exigir subselect dedicado equivalente.

### D5 — Entrada monetária no formulário segue o padrão da nota fiscal
State string + `Number(valor.replace(",", "."))` + validação local `> 0` no `valido` — exatamente o padrão do diálogo de NF em `projeto-detalhe.tsx`. `ParametrosCriacao` ganha `p_valor: number` (propriedade obrigatória). Sem máscara/masked input: consistente com o resto do app.

### D6 — Exibição: coluna e CSV de ADM, linha no detalhe, card no dashboard
- Listagem: coluna "Valor" em `colunasAdministrativas()` com `formatarMoeda`; CSV de ADM ganha a coluna.
- Detalhe: `Campo rotulo="Valor"` no card "Dados do projeto" somente quando `ehAdm`, lendo `adm.valor` (a projeção operacional não tem a coluna).
- Dashboard: `DashboardFinanceiro` ganha `projetos`; select adiciona `valor_projetos`; novo card "Projetos" (grid passa a `md:grid-cols-4`).

### D7 — Tipos regenerados pelo MCP
`src/types/database.types.ts` é regenerado com `generate_typescript_types` após o schema mudar; como views são consultadas com `select("*")`, a coluna nova flui para `ProjetoAdministrativo` sem mudança de query.

## Risks / Trade-offs

- [Backfill dos 14 projetos exige valores reais] → o valor é imutável, placeholder ficaria permanente e distorceria a métrica "Projetos". A aplicação pausa para o usuário informar os valores por projeto antes de aplicar `not null`.
- [Troca de assinatura da RPC quebra a versão publicada do front] → única chamadora é este app; deploy ordenado: banco primeiro (nova função concedida e antiga dropada), front na sequência. Janela de incompatibilidade aceita e curta.
- [Função antiga não dropada deixa RPC órfã concedida] → drop explícito na migração + verificação consultando `pg_proc` pela assinatura antiga.
- [Métrica "Projetos" pode ser muito maior que "Faturado"] → esperado: carteira contratada vs. faturado; descrição do card explicita "não cancelados".

## Migration Plan

Pelo MCP Supabase, nesta ordem:

1. `alter table public.projeto add column valor numeric(15,2)` (anulável, transitório).
2. **Pausa para backfill:** listar os 14 projetos (`id`, `codigo_pasta`) e aplicar `update` com os valores reais fornecidos pelo usuário.
3. `alter table public.projeto alter column valor set not null` + `add constraint projeto_valor_positivo check (valor > 0)`.
4. `create or replace function criar_projeto(...)` com `p_valor`; `grant execute` com a nova assinatura; `drop function` da assinatura antiga de 9 parâmetros.
5. `create or replace view v_projetos_administrativo` (+ `valor`) e `v_dashboard_financeiro` (+ `valor_projetos`).
6. Regenerar `database.types.ts` e atualizar o front (formulário, listagem, CSV, detalhe, dashboard).
7. Atualizar `banco.sql` para o mesmo estado final (referência declarativa).

Rollback: recriar views sem as colunas novas, recriar/dropar função conforme estado anterior, `drop column valor` (perde o backfill — dados colhidos manualmente devem ser guardados antes, se necessário reverter).
