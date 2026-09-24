## Context

Ver proposal.md — Why. Estado atual do banco (referência declarativa em `banco.sql`, estado real no Supabase remoto via MCP):

- `tipo_projeto` carrega `faixa_inicial`, `faixa_final`, a coluna gerada `faixa` (int4range), a coluna gerada `is_ppi`, `proximo_numero`, as constraints `tipo_faixa_valida` / `tipo_proximo_valido` / `tipo_torre_limite_parcelas` / `tipo_faixas_sem_sobreposicao` (EXCLUDE USING gist) e o trigger `tipo_proximo_automatico` (`fn_proximo_automatico`).
- `criar_projeto` trava a linha do tipo (`for update`), verifica faixa esgotada, toma `proximo_numero`, incrementa o contador e grava `projeto.numero` + `codigo_pasta = format('F-%s-%s', ano, lpad(numero, 4, '0'))`.
- `projeto.numero` tem unicidade global (`unique`) e `check (numero >= 0)`; `codigo_pasta` tem regex `^F-[0-9]{4}-[0-9]{4,}$` e é imutável (`fn_proteger_projeto`).
- Views, RLS e grants apenas leem `numero`/`ano`/`codigo_pasta` — nada ali conhece faixas.
- Todos os projetos são dados de teste e serão apagados (decisão do usuário): não há histórico a preservar nem renumeração.

## Goals / Non-Goals

**Goals:**

- Alocação sequencial global por ano, iniciando em 0001, transacional e segura sob concorrência (mesmo padrão de lock de linha usado hoje).
- `tipo_projeto` reduzido a nome, limite de parcelas e situação (regra Torre 1–3 preservada).
- Limpeza completa dos dados de teste de projetos e dependentes.
- `banco.sql` atualizado como referência declarativa do novo estado.

**Non-Goals:**

- Preservar ou renumerar códigos existentes (dados de teste; serão apagados).
- Qualquer mudança em views, RLS, grants de leitura, autenticação ou nos demais fluxos (OC, notas, recebimentos).
- Manter o indicador PPI para uso futuro — só existia para validar faixas.

## Decisions

### 1. Contador anual em tabela própria `sequencia_projeto`

```sql
create table public.sequencia_projeto (
  ano smallint primary key check (ano between 2000 and 9999),
  proximo_numero integer not null default 1 check (proximo_numero >= 1),
  atualizado_em timestamptz not null default now()
);
```

Uma linha por ano. Alternativas consideradas e rejeitadas:

- **`SEQUENCE` do Postgres**: não reinicia por ano automaticamente (exigiria `setval` agendado) e `nextval` não é transacional — rollback cria lacunas.
- **`MAX(numero)+1` sobre `projeto`**: corrida sob concorrência; exigiria advisory lock e acoplaria a alocação à tabela de projetos.
- **Contador em tabela de configuração única**: não modela o reinício anual.

A tabela com lock de linha espelha o padrão já usado (`for update` no tipo hoje) e o incremento participa da transação da criação: rollback devolve o número.

### 2. Alocação atômica em uma única instrução, dentro da RPC

```sql
select proximo_numero into v_numero
from (
  insert into public.sequencia_projeto(ano, proximo_numero)
  values (v_ano, 1)
  on conflict (ano) do update
    set proximo_numero = sequencia_projeto.proximo_numero + 1, atualizado_em = now()
  returning proximo_numero
) s;
```

O `insert ... on conflict do update ... returning` cobre os dois casos: primeiro projeto do ano (insert puro devolve 1) e anos já iniciados (update devolve o número corrente e deixa o contador no seguinte). O `do update` serializa concorrência no lock da linha — dois ADMs no primeiro projeto do ano não duplicam 0001. O `v_ano` continua sendo `extract(year from current_date)`.

### 3. Unicidade de `projeto` passa a ser por ano e número

- `unique (numero)` → `unique (ano, numero)` (o número reinicia a cada ano, então `numero` sozinho não é mais único).
- `check (numero >= 0)` → `check (numero >= 1)` (a sequência começa em 0001).
- Regex de `codigo_pasta` e `fn_proteger_projeto` (imutabilidade de `numero`/`codigo_pasta`) permanecem inalterados — o formato `F-AAAA-NNNN` já casa com `^F-[0-9]{4}-[0-9]{4,}$`.
- O `lpad(..., 4, '0')` na `criar_projeto` permanece: acima de 9999 o código cresce para 5 dígitos, aceito pelo regex.

### 4. Remoção completa da mecânica de faixas de `tipo_projeto`

Ordem de remoção (respeita dependências):

1. Constraint `tipo_faixas_sem_sobreposicao` (usa a coluna gerada `faixa`);
2. Constraints `tipo_faixa_valida` (referencia `is_ppi`) e `tipo_proximo_valido`;
3. Trigger `tipo_proximo_automatico` e função `fn_proximo_automatico`;
4. Colunas geradas `faixa` → depois `faixa_inicial`, `faixa_final`;
5. Colunas `is_ppi` e `proximo_numero`.

A constraint `tipo_torre_limite_parcelas` (Torre 1–3) permanece. Manter `is_ppi` "por precaução" foi considerado e rejeitado: coluna gerada sem nenhum uso restante.

### 5. Reescrita do bloco de alocação da `criar_projeto`

O `select * from tipo_projeto ... for update` + verificação de faixa + incremento de `proximo_numero` saem; entra a alocação da decisão 2. O tipo passa a ser apenas validado (existente e ativo, sem `for update`, pois deixa de ser mutado pela criação). Validações de cliente, operadora, responsável, evento de criação e o resto da RPC permanecem.

### 6. Limpeza de dados antes das alterações de schema

Ordem única de execução via MCP Supabase:

1. **Apagar dados de teste** numa transação, respeitando as FKs restrict: `delete from recebimento; delete from nota_fiscal; delete from autorizacao_faturamento; delete from evento_projeto; delete from projeto;` — ordens de compra permanecem (a FK aponta de `projeto` para `ordem_compra`; nada impede) e tipos/clientes/operadoras/usuários permanecem.
2. **Alterações de schema e RPC** (decisões 1, 3, 4, 5) — sem risco de violação com a tabela vazia.
3. **Atualizar `banco.sql`** para o novo estado esperado.

Apagar dados primeiro dispensa qualquer cuidado de transição de constraints (o `check numero >= 1` não encontraria um `numero = 0` antigo).

### 7. Frontend: remoção guiada, sem nova lógica

- `cadastros-tipos.tsx`: remover campos de faixa do diálogo, `ehNomePpi`, auto-preenchimento de 5001, validações de faixa em `validarTipo`, colunas "Faixa" e "Próximo nº" da tabela e o texto de descrição sobre faixas; o diálogo fica com Nome e Limite de parcelas.
- `projeto-novo.tsx`: remover o sufixo `— próximo número {tipo.proximo_numero}` da opção do seletor; nada mais muda (o código continua exibido após a criação, vindo do banco).
- `queries/cadastros.ts`: `ValoresTipoProjeto` perde `faixa_inicial` e `faixa_final`.
- `lib/formato.ts`: remover as entradas `tipo_faixas_sem_sobreposicao`, `tipo_faixa_valida` e `tipo_proximo_valido` do mapa de erros.
- `types/database.types.ts`: regenerar (ou editar em espelho) a partir do schema remoto pós-migração.

## Risks / Trade-offs

- [Janela de incompatibilidade frontend × banco durante o deploy: frontend novo não envia faixas (falha no banco antigo por `faixa_inicial` not null) e frontend antigo envia colunas inexistentes (falha no banco novo)] → aplicar migração e publicar frontend na mesma janela; ambiente de teste, volume trivial.
- [Lacunas na sequência por deleção manual de projeto no banco] → aceito: a deleção pelo banco é operação de suporte, não de fluxo; a alocação transacional garante ausência de lacunas no fluxo normal.
- [Falha de escrita em `sequencia_projeto` bloqueia criações] → tabela mínima (uma linha/ano) sem dependências; RLS não aplicada (acesso só via `security definer`), sem risco de bloqueio por policy.
- [`requisitos.md` desatualizado sobre faixas] → atualizar a descrição de `tipo_projeto` e a nota de concorrência no mesmo change.

## Migration Plan

Execução única via MCP Supabase no projeto remoto (nada local, ver config do projeto):

1. Transação de limpeza (decisão 6.1) e verificação de tabelas vazias;
2. `create table sequencia_projeto` (decisão 1);
3. Swap de constraints em `projeto` (decisão 3);
4. `create or replace function criar_projeto` (decisões 2 e 5);
5. Remoção da mecânica de faixas de `tipo_projeto` na ordem da decisão 4;
6. Atualização de `banco.sql`, `requisitos.md` e do frontend (decisão 7);
7. Validação ponta a ponta: criar tipo, criar projetos do mesmo ano (códigos 0001, 0002…) e conferir listagens/dashboards.

Rollback: ambiente de teste sem histórico a preservar — reversão significaria recriar a mecânica de faixas a partir do `banco.sql` anterior; não é planejada.
