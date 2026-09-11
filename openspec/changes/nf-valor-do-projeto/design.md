## Context

A RPC `registrar_nota_fiscal(p_projeto, p_numero, p_data, p_valor)` hoje grava em `nota_fiscal.valor` o valor recebido do cliente. O diálogo "Registrar nota fiscal" (`DialogNotaFiscal`, em `projeto-detalhe.tsx`) recebe apenas `projetoId` e começa com valor vazio para digitação manual. O valor do projeto (`projeto.valor`) já está carregado na página para ADM via `v_projetos_administrativo` e é exibido no detalhe. Toda alteração de banco deve ser aplicada via MCP Supabase no projeto remoto; `banco.sql` é referência declarativa. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**
- Tornar "nota fiscal = valor do projeto" uma invariante garantida pelo banco, não uma convenção de UI.
- Eliminar a digitação do valor no registro da nota.

**Non-Goals:**
- Não alterar o fluxo de recebimentos (o limite contra `nota.valor` já existe e passa a valer o valor do projeto como consequência).
- Não alterar `criar_projeto` nem a imutabilidade de `projeto.valor`.
- Não alterar dashboards nem views.
- Não oferecer qualquer forma de nota com valor diferente do projeto.

## Decisions

### 1. Banco deriva o valor (opção B2) em vez de UI somente leitura enviando o valor (B1)
A regra passa a valer na fonte: sem parâmetro de valor, não há chamada — nem direta ao RPC — que registre nota divergente. Efeito cascata desejado: `registrar_recebimento` valida total recebido ≤ `nota.valor`, então os recebimentos ficam limitados ao valor do projeto. Alternativa B1 descartada por manter a convenção apenas no formulário.

### 2. Nova assinatura: `registrar_nota_fiscal(p_projeto bigint, p_numero varchar, p_data date) returns bigint`
Mesmo corpo da função atual, com duas diferenças: o INSERT passa a usar `(select valor from public.projeto where id = p_projeto)` para `valor`, e o parâmetro `p_valor` desaparece. Checagens de ADM, status `AUTORIZADO_FATURAMENTO`, `for update`, transição para `NOTA_EMITIDA` e evento permanecem idênticas.

### 3. Migração por overloads, sem janela de incompatibilidade
O front e o banco são deployados em momentos distintos; uma troca dura da assinatura quebraria o app na janela entre eles. Plano:
1. Via MCP, `create or replace function registrar_nota_fiscal(bigint, varchar, date)` — a versão antiga de 4 args continua existindo como overload e o app atual segue funcionando.
2. Publicar o front chamando a de 3 args.
3. Via MCP, `drop function registrar_nota_fiscal(bigint, varchar, date, numeric)` — remove a assinatura que permitia valor divergente.
Rollback: recriar a função de 4 args e reverter o front.

### 4. Front: valor como prop, texto formatado, sem input
`DialogNotaFiscal` passa a receber `valorProjeto` (de `adm.valor` no pai) e renderiza `formatarMoeda(valorProjeto)` como texto no lugar do `Input` de valor; `registrarNotaFiscal` em `queries/projetos.ts` deixa de enviar valor; validação local vira `numero !== "" && data !== ""`. O diálogo é montado junto à página, que só renderiza após carregar o projeto, então `adm.valor` já existe no primeiro render — sem necessidade de efeito de sincronização. Exibição defensiva "—" caso venha nulo (não deve ocorrer: a criação exige valor positivo).

### 5. Tipos regenerados a partir do remoto
`src/types/database.types.ts` é atualizado (Args da RPC perdem `p_valor`) a partir do estado do projeto remoto via MCP Supabase, e `banco.sql` recebe a nova definição como referência declarativa.

## Risks / Trade-offs

- [Overload de 4 args esquecido após o deploy] → o drop da assinatura antiga é tarefa explícita do plano; sem ela, a rota de valor divergente continua existindo.
- [Chamador da RPC de 4 args durante a janela] → único chamador é o próprio app; durante a janela ele usa a versão antiga, que mantém o comportamento de hoje até o front atualizar.
- [`projeto.valor` nulo em dados antigos] → criação sempre exigiu valor positivo; exibição defensiva "—" no diálogo como rede de segurança, sem tratamento especial no banco.
