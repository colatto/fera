# Design

## Context

A máquina de estados vive na RPC transacional `alterar_status_projeto` (`banco.sql:143`), que hoje aceita CADASTRADO→ENVIADO, ENVIADO→CADASTRADO, a reversão de OC (`OC_REGISTRADA → ENVIADO`, da change anterior), cancelamento em CADASTRADO — qualquer outra transição cai no `else` genérico `'Transição manual não autorizada'`. Diferente das reversões existentes, `autorizar_faturamento` (`banco.sql:181`) grava em duas partes: status do projeto e um registro na tabela `autorizacao_faturamento` (`banco.sql:56`, `projeto_id` único), que alimenta a exibição "autorizado por/em" em `v_projetos_administrativo` (`banco.sql:356`) e o item "Autorização de faturamento" da linha do tempo de documentos (`projetos.ts:139`). O detalhe (`projeto-detalhe.tsx`) renderiza em `AUTORIZADO_FATURAMENTO` apenas "Registrar nota fiscal" (`projeto-detalhe.tsx:1017`); o diálogo `DialogReverterOc` (`projeto-detalhe.tsx:311`) é o padrão de reversão a espelhar. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Permitir ao ADM reverter `AUTORIZADO_FATURAMENTO → OC_REGISTRADA` desfazendo atomicamente a autorização (status + exclusão do registro em `autorizacao_faturamento`), preservando OC vinculada, centro de custo, `data_envio` e valor, com evento na linha do tempo.
- Recusar transacionalmente qualquer outra origem de destino `OC_REGISTRADA` e qualquer chamada de não-ADM, com mensagens específicas do banco.
- Refletir a reversão imediatamente em detalhe, listagem, linha do tempo e dashboards, pelo mecanismo de invalidação existente.

**Non-Goals:**

- Retrocessos a partir de `NOTA_EMITIDA` (inclusive) — exigiriam apagar a nota fiscal e recebimentos, outra ordem de destrutividade.
- Alterar a RPC `autorizar_faturamento` ou a tabela `autorizacao_faturamento` (schema, RLS, policies).
- Edições de dados da etapa fora da reentrada normal; novos formulários.

## Decisions

### D1 — Estender `alterar_status_projeto`, não criar RPC nova

Mesma razão da change anterior: manter a máquina de estados num único ponto e a assinatura invariada (`p_id`, `p_novo`, `p_data_envio`, `p_motivo`), sem janela de incompatibilidade entre deploy do banco e do front. Alternativa considerada: RPC dedicada `retroceder_autorizacao`; descartada por fragmentar as transições em duas funções sem ganho — o gate por ramo já é o padrão do código.

Ramos novos, na ordem (após o ramo de reversão de OC existente):

```sql
elsif p_novo = 'OC_REGISTRADA' and v.status = 'AUTORIZADO_FATURAMENTO' then
  if not public.usuario_adm() then raise exception 'Apenas ADM pode reverter autorização de faturamento' using errcode = '42501'; end if;
  delete from public.autorizacao_faturamento where projeto_id = p_id;
  update public.projeto set status = p_novo where id = p_id;
elsif p_novo = 'OC_REGISTRADA' then
  raise exception 'Reversão da autorização exige projeto em status AUTORIZADO_FATURAMENTO';
```

O primeiro ramo é o happy path; o segundo dá mensagem específica para qualquer chamada de destino `OC_REGISTRADA` vindo de outra origem — o caminho normal para `OC_REGISTRADA` é a RPC `vincular_ordem_compra`, nunca `alterar_status_projeto`, então toda chamada com esse destino é reversão ou erro.

### D2 — Um delete, um update, um evento

O desfazimento é `delete` do registro de autorização seguido do `update` de status e do `insert` de evento `ALTERACAO_STATUS` (`AUTORIZADO_FATURAMENTO → OC_REGISTRADA`, sem motivo, sem detalhes), dentro da transação já aberta pela RPC — mesmo formato do evento das outras reversões. Pontos verificados contra o schema: o `select ... for update` existente elimina corrida com `registrar_nota_fiscal` (que exige `AUTORIZADO_FATURAMENTO`) e com re-autorização — nenhuma nota pode nascer entre a checagem e o delete; a FK de `autorizacao_faturamento.projeto_id` não é tocada (apagamos o registro, não o projeto); a RPC é `security definer`, então o delete não depende da policy de select da tabela; `data_envio` permanece (o check `projeto_envio_por_status` exige `data_envio` em status ativo — não tocamos nela). Com o registro apagado, `v_projetos_administrativo` deixa de produzir `autorizado_por`/`autorizado_em` e o item "Autorização de faturamento" sai da linha do tempo de documentos — sem alteração de view nem de query. O dashboard financeiro não muda (não existe nota em `AUTORIZADO_FATURAMENTO`) e o operacional reflete a transição pelos eventos, mecanismo existente.

### D3 — Interface espelha a reversão de OC

Nova função `retrocederAutorizacao(id)` em `queries/fluxo.ts` chamando a mesma assinatura de RPC com `p_novo: 'OC_REGISTRADA'`, junto a um diálogo de confirmação idêntico em forma ao `DialogReverterOc`: botão "Cancelar autorização de faturamento" (variante destructive) visível somente para `ehAdm && status === 'AUTORIZADO_FATURAMENTO'`, posicionado à esquerda de "Registrar nota fiscal"; descrição explicando que o status volta a `OC_REGISTRADA` com a autorização cancelada, mantendo a OC e o centro de custo; `useAcaoFluxo` cuida da invalidação (projetos, detalhe, eventos, dashboards) e o erro do banco é exibido por `mensagemDeErro` sem mapeamento local — as mensagens específicas vêm do banco (D1), como na reversão de OC.

## Risks / Trade-offs

- [Exclusão do registro perde da exibição quem autorizou primeiro e quando] → aceito por decisão: o rastro de autor e datas fica nos eventos `ALTERACAO_STATUS` da linha do tempo, que acumulam todas as transições; a re-autorização cria registro novo com autor e data novos.
- [Retrocesso acidental cancela autorização correta] → diálogo de confirmação obrigatório com descrição do efeito; re-autorizar restaura o estado com um clique (a RPC `autorizar_faturamento` está intocada e o `unique(projeto_id)` volta a aceitar porque o registro foi apagado).
- [Deploy RPC antes do front expõe a transição via chamada direta] → irrelevante: a transição só é aceita para ADM ativo, exatamente o público autorizado; a ausência do botão não é o controle de acesso.
- [Ordem delete → update dentro da transação] → irrelevante para o resultado: qualquer falha posterior aborta a transação inteira e nada é aplicado.

## Migration Plan

Pela regra do projeto, exclusivamente via MCP Supabase no remoto (nunca CLI/local; `banco.sql` é só referência declarativa):

1. Aplicar a nova definição de `alterar_status_projeto` (mesmo `create or replace function`) pelo MCP Supabase e validar com uma chamada de teste em projeto sandbox/retorno manual.
2. Atualizar `banco.sql` com o mesmo corpo da função para manter a referência versionada fiel.
3. Publicar o front (função em `fluxo.ts` + diálogo/botão no detalhe).

Rollback: restaurar o corpo anterior da função pelo MCP (o front novo passa a receber o erro genérico da transição recusada) e reverter os commits do front. Nenhum dado precisa de migração — o estado anterior é reconstruído re-autorizando o projeto.
