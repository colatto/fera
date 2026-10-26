# Design

## Context

A RPC `criar_projeto` (Supabase, Postgres) já computa `v_ano := extract(year from current_date)` e reserva o número sequencial na `sequencia_projeto` dentro da mesma transação que monta o `codigo_pasta` (`format('F-%s-%s', v_ano, lpad(...))`). A coluna `projeto.pasta_local` existe, é opcional, nasce NULL e hoje só é preenchida por edição manual (`editar_identificadores_projeto`, `editar_pasta_local`). O formulário "Novo projeto" não conhece o código antes da confirmação — o número só existe dentro da RPC. A coluna tem a constraint `projeto_pasta_local_caminho` (caminho Windows absoluto por letra de unidade, sem caracteres de controle).

## Goals / Non-Goals

**Goals:**

- Todo projeto novo nasce com `pasta_local = 'P:\_OBRAS_' || <ano> || '\' || <código F-AAAA-NNNN>`.
- O ano da pasta é sempre o mesmo ano do código — garantia estrutural, não coincidência.
- Virada de ano (2026 → 2027) automática, sem manutenção nem config anual.

**Non-Goals:**

- Sem backfill: projetos existentes não são tocados.
- Sem contato com o sistema de arquivos: o sistema só registra o caminho; a pasta física em `P:` continua criada externamente.
- Sem mudança de frontend, sem campo novo no formulário, sem tabela de configuração, sem alteração nas RPCs de edição nem na linha do tempo.

## Decisions

**1. Montagem dentro de `criar_projeto`, na mesma transação, a partir das mesmas variáveis.**
O caminho depende do `codigo_pasta`, que só existe dentro da transação (número reservado ali). Alternativas rejeitadas: pré-preenchimento na interface (impossível — o código ainda não existe; exigiria uma segunda chamada RPC pós-criação, duas transações); trigger sobre INSERT (indireção desnecessária, quebra do padrão da casa de concentrar regra nas RPCs); coluna gerada (a pasta precisa continuar editável). A montagem usa `format('P:\_OBRAS_%s\%s', v_ano, <código>)`, no mesmo estilo do `format` que já gera o código.

**2. O ano vem da variável `v_ano` já existente — nunca recalculado.**
Pasta e código derivam da mesma variável na mesma transação, então os anos nunca divergem. Isso absorve inclusive a borda de fuso: `current_date` no Supabase usa o fuso do banco (UTC), pelo qual o ano pode "virar" entre 21h e meia-noite de 31/12 no Brasil — comportamento que já vale para o código hoje e que a pasta apenas acompanha. Recalcular o ano em outro ponto (relógio do cliente, `now()` separado) criaria a possibilidade de pasta `2027` com código `2026`.

**3. Base `P:\_OBRAS_` hardcoded no corpo da função.**
Decisão do usuário. Não há infraestrutura de configuração no projeto e nenhuma regra de negócio vive fora das RPCs; se a base mudar um dia (letra da unidade, prefixo), é uma migration pequena via MCP. Uma config com o ano escrito (`P:\_OBRAS_2026`) foi explicitamente rejeitada: exigiria manutenção anual e abriria espaço para divergência — o ano é sempre calculado, nunca armazenado.

**4. Nenhuma mudança de constraint ou de edição.**
O caminho gerado (`P:\_OBRAS_2026\F-2026-0042`, ~27 caracteres) satisfaz a `projeto_pasta_local_caminho` vigente e o limite de 500. As RPCs de edição seguem valendo sem alteração: o valor automático é apenas o inicial, e a partir dele o ADM edita ou limpa como faz hoje. O evento `CRIACAO` permanece como está (`origem: cadastro`), sem detalhes da pasta — a pasta faz parte da criação, não é uma alteração cadastral.

**5. Deploy: recriar função + reemitir grant.**
`create or replace function` derruba o grant de execute; a migration reemite `grant execute on function public.criar_projeto(...) to authenticated` na mesma operação (padrão já adotado em changes anteriores). `banco.sql` é atualizado como referência declarativa, não como mecanismo de deploy.

## Risks / Trade-offs

- [Mudança futura da base `P:\_OBRAS_`] → exige migration da função via MCP. Aceito na decisão 3; o impacto é pequeno e localizado.
- [Recriação da função derruba grant] → grant reemitido na mesma migration; verificação pós-deploy inclui checar `information_schema.routine_privileges`.
- [Pasta física inexistente ao clicar "Abrir pasta"] → já coberto pela spec `abertura-pasta-local`: falha de abertura não gera erro de aplicação. Nada a fazer aqui.
- [Validação sem poluir produção] → a RPC exige ADM via `auth.uid()`, então não é executável diretamente pela conexão MCP. A validação é em duas partes: (a) verificação somente-leitura da expressão de montagem e da constraint com valores de exemplo; (b) confirmação na primeira criação real pela interface, observando `pasta_local` no detalhe. Não criar projeto de teste: consumiria número real da sequência.

## Migration Plan

1. Migration única via MCP Supabase: `create or replace function public.criar_projeto(...)` com a montagem da pasta no INSERT + reemissão do grant.
2. Atualizar `banco.sql` (referência declarativa) no mesmo commit.
3. Rollback: recriar a função com o corpo anterior (sem `pasta_local` no INSERT) e reemitir o grant. Sem dados para reverter — a mudança não toca projetos existentes.
