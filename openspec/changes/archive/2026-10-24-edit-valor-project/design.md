# Design

## Context

O botão "Editar" do detalhe (`src/routes/projetos/projeto-detalhe.tsx`) já abre um diálogo restrito a `CADASTRADO` + ADM, atendido pela RPC transacional `editar_identificadores_projeto` (`banco.sql:206`), que valida perfil e status, trava a linha com `for update` e grava evento `ALTERACAO_CADASTRAL`. O valor do projeto (`numeric(15,2)`, check `> 0`) só é lido pelo fluxo financeiro na emissão da nota (`registrar_nota_fiscal` copia `projeto.valor` para `nota_fiscal.valor`) e vive nas views de consulta/dashboard — em `CADASTRADO` nenhuma dessas superfícies dependeu dele ainda. Deploy de banco é exclusivamente via MCP Supabase; `banco.sql` é a referência declarativa versionada. Ver proposal.md para a motivação e specs/fluxo-projetos para os requisitos.

## Goals / Non-Goals

**Goals:**

- Permitir ao ADM corrigir o valor na janela `CADASTRADO` pelo diálogo "Editar" existente, com rastro na linha do tempo.
- Manter compatibilidade de chamadas antigas da RPC durante o deploy (front antigo rodando contra banco novo).

**Non-Goals:**

- Editar valor fora de `CADASTRADO` (imutabilidade permanece, ver spec "Imutabilidade do valor do projeto").
- Registrar montantes (antes/depois) no evento — decisão de produto: rótulo apenas, sem detalhes para qualquer perfil.
- Tocar em projeções de consulta, dashboards, nota fiscal ou recebimentos: leitura do valor é sempre do estado vivo; a nota continua fotografando o valor na emissão.

## Decisions

**1. Campo dobrado no diálogo e RPC existentes, não ação separada.** Mesma janela de status, mesmo público e mesmos guardiões (ADM + `CADASTRADO` + lock) da edição cadastral; uma segunda ação/RPC duplicaria diálogo, permissão e evento sem ganho. Alternativa (ação dedicada "Editar valor") rejeitada na exploração.

**2. Parâmetro `p_valor numeric default null` na RPC; ausente preserva o vigente.** Espelha o padrão já usado por `p_pasta_local` para manter compatíveis as chamadas de 4 parâmetros durante a janela de deploy. Não há semântica de "limpar" (valor é obrigatoriamente positivo), então só dois estados: ausente = preserva; informado = estado final. Alternativa (exigir o valor em toda chamada) rejeitada por quebrar o front antigo no deploy.

**3. Drop + create da função, não overload.** Em Postgres, `create or replace` com assinatura nova (5 parâmetros) cria um *overload* e mantém a função antiga ativa — duas versões com grants e lógica divergentes. A migração deve `drop function editar_identificadores_projeto(bigint,varchar,varchar,varchar)` e recriar com a assinatura nova (o default mantém as chamadas antigas válidas), reaplicando o `grant execute` — o drop remove o grant vigente, então a linha de grant em `banco.sql:362` precisa da assinatura nova de qualquer forma.

**4. Novo valor de enum `ALTERACAO_VALOR` com rótulo "Alteração do valor", sem `detalhes`.** Evento dedicado por natureza da mudança: identificadores/pasta mudaram → `ALTERACAO_CADASTRAL`; valor mudou → `ALTERACAO_VALOR`; ambos → um evento de cada, na mesma transação. Alternativa (reusar `ALTERACAO_CADASTRAL` com `detalhes` de antes→depois, mascarados para OPER pela view) rejeitada por decisão de produto: nenhum montante na linha do tempo. A separação por natureza preserva o requisito vigente de evento cadastral, que seria violado se o evento de valor o suprimisse.

**5. Sem filtro novo para OPER.** `v_eventos_operacionais` já repassa todo tipo de evento e mascara `detalhes` para não-ADM; o evento de valor não carrega `detalhes`, então a OPER vê apenas o rótulo — mesmo nível de exposição do evento cadastral que já vê hoje. Alternativa (filtrar o tipo para OPER) rejeitada na exploração.

**6. Validação em duas camadas, reutilizando a da criação.** Local: o diálogo valida valor monetário e positivo com o mesmo parsing da criação (`Number(valor.replace(",", "."))`), bloqueando antes da RPC. Banco: `p_valor is not null and p_valor <= 0` é recusado pela RPC, e o check `projeto_valor_positivo` da coluna é a última linha de defesa.

**7. No-op estendido a quatro entradas.** Identificadores, pasta **e** valor idênticos aos vigentes → `return` sem update e sem eventos. Casos parciais seguem a regra por natureza: só o valor mudou → apenas evento de valor; só identificadores → apenas cadastral.

## Risks / Trade-offs

- [Enum novo em migração separada] `alter type ... add value` não pode ser usado na mesma transação em que é referenciado → aplicar em passo anterior à recriação da função, dentro do mesmo fluxo de migração via MCP.
- [Grant perdido no drop da função] → a migração recria e re-concede `execute` a `authenticated` na mesma etapa; validar permissão após aplicar.
- [Front desatualizado contra banco novo] → o default `p_valor = null` preserva o comportamento antigo; banco novo contra front antigo é seguro, o inverso não ocorre (deploy único via MCP).
- [Rótulo ausente em `ROTULOS_EVENTO`] → `Record<TipoEvento, string>` obriga a chave nova em tempo de compilação; incluir "Alteração do valor" na mesma mudança.
- [Métrica "Projetos" do dashboard muda com a correção] → comportamento desejado: dashboards leem o valor vivo; a correção em `CADASTRADO` propaga.

## Migration Plan

Via MCP Supabase, na ordem: (1) `alter type project_event_type add value 'ALTERACAO_VALOR'`; (2) drop da função antiga + create da nova com `p_valor numeric default null` + `grant execute` com a assinatura nova; (3) atualizar `banco.sql` (enum, função, grant) como referência versionada. Rollback: recriar a função com a assinatura anterior e re-grantar; o valor de enum residual é inócuo (nenhum evento o referencia).
