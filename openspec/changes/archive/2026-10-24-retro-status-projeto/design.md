# Design

## Context

A máquina de estados vive numa única RPC transacional, `alterar_status_projeto` (`banco.sql:143`), que hoje aceita apenas CADASTRADO→ENVIADO, ENVIADO→CADASTRADO (limpando `data_envio`) e cancelamento em CADASTRADO — qualquer outra transição cai no `else` genérico `'Transição manual não autorizada'`. O vínculo de OC (`vincular_ordem_compra`) grava `ordem_compra_id` e `centro_custo` no projeto (centro com unicidade global via índice único) e não há como desfazê-lo. A tela de detalhe (`projeto-detalhe.tsx`) renderiza ações por status; a reversão de envio existente (`DialogReverterEnvio`) é o padrão de diálogo a espelhar. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Permitir ao ADM reverter `OC_REGISTRADA → ENVIADO` desfazendo atomicamente o vínculo (status + `ordem_compra_id` + `centro_custo`), preservando `data_envio`, com evento na linha do tempo.
- Recusar transacionalmente qualquer outro retrocesso e qualquer chamada de não-ADM, com mensagens específicas do banco.
- Refletir a reversão imediatamente em detalhe, listagem, linha do tempo e dashboards, pelo mecanismo de invalidação existente.

**Non-Goals:**

- Retrocessos a partir de `AUTORIZADO_FATURAMENTO` (inclusive), saltos diretos (`OC_REGISTRADA → CADASTRADO`) e edições de dados da etapa fora do fluxo normal de reentrada (decisões 1–3 da exploração).
- Novos formulários, edição de OC/centro "no lugar", exclusão de registros de OC, mudanças em autorização/nota/recebimentos.

## Decisions

### D1 — Estender `alterar_status_projeto`, não criar RPC nova

A reversão de OC entra como ramo adicional da mesma RPC, mantendo a máquina de estados num único ponto e a assinatura invariada (`p_id`, `p_novo`, `p_data_envio`, `p_motivo`) — sem janela de incompatibilidade entre deploy do banco e do front. Alternativa considerada: RPC nova `retroceder_oc` com gate ADM isolado; descartada por fragmentar as transições de status em duas funções sem ganho real — o gate por ramo já é o padrão do código (permissões verificadas ramo a ramo).

Estrutura dos ramos novos, na ordem:

```sql
elsif p_novo = 'ENVIADO' and v.status = 'OC_REGISTRADA' then
  if not public.usuario_adm() then raise exception 'Apenas ADM pode reverter vínculo de OC' using errcode = '42501'; end if;
  update public.projeto set status = p_novo, ordem_compra_id = null, centro_custo = null where id = p_id;
elsif p_novo = 'ENVIADO' and v.status <> 'CADASTRADO' then
  raise exception 'Reversão de OC exige projeto em status OC_REGISTRADA';
```

O primeiro ramo é o happy path; o segundo dá mensagem específica (em vez do `else` genérico) para chamadas de `ENVIADO` a partir de qualquer outra origem. O envio normal (`CADASTRADO → ENVIADO`) segue ADM+OPER como hoje.

### D2 — Um único UPDATE, um evento, nada mais

O desfazimento é um `update` só (status, `ordem_compra_id`, `centro_custo`) seguido do `insert` de evento `ALTERACAO_STATUS` (`OC_REGISTRADA → ENVIADO`, sem motivo, sem detalhes), dentro da transação já aberta pela RPC — mesmo formato do evento da reversão de envio. Pontos verificados contra o schema: o `select ... for update` existente elimina corrida com `autorizar_faturamento`; o índice único de `centro_custo` aceita múltiplos `null` (o centro limpo libera o valor para outro projeto); o check `projeto_envio_por_status` exige `data_envio` mantida (não tocamos nela); o trigger `fn_proteger_projeto` não intercepta esses campos; o índice parcial `projeto_envio_sem_oc_idx` volta a incluir o projeto (contando em "Enviados sem OC") assim que `ordem_compra_id` fica `null`. O registro da OC em si não é tocado — permanece selecionável em "Vincular existente".

### D3 — Interface espelha a reversão de envio existente

Nova função `retrocederOc(id)` em `queries/fluxo.ts` chamando a mesma assinatura de RPC com `p_novo: 'ENVIADO'`, junto a um diálogo de confirmação idêntico em forma ao `DialogReverterEnvio`: botão "Cancelar vínculo de OC" (variante destructive) visível somente para `ehAdm && status === 'OC_REGISTRADA'`, posicionado à esquerda de "Autorizar faturamento"; descrição explicando que a OC é desvinculada, o centro de custo liberado e a data de envio preservada; `useAcaoFluxo` cuida da invalidação (projetos, detalhe, eventos, dashboards) e o erro do banco é exibido por `mensagemDeErro` sem mapeamento local — as mensagens específicas agora vêm do banco (D1), ao contrário da reversão de envio, que mapeia o erro genérico na interface.

## Risks / Trade-offs

- [Permissões misturadas numa RPC só (envio ADM+OPER, reversão de OC ADM)] → cada ramo verifica sua própria permissão antes de tocar o projeto; chamada de OPER é recusada com erro transacional e o botão nem é renderizado para OPER.
- [Retrocesso acidental desfaz vínculo correto] → diálogo de confirmação obrigatório com descrição do efeito; a linha do tempo acumula o evento, mantendo rastro de quem reverteu e quando.
- [Centro de custo liberado ser reivindicado por outro projeto antes da re-vinculação] → aceito por design: a unicidade global é o comportamento vigente; quem re-vincula depois pode precisar de centro diferente, e a falha transacional de duplicidade já existe e é exibida.
- [Deploy RPC antes do front expõe a transição via chamada direta] → irrelevante: a transição só é aceita para ADM ativo, exatamente o público autorizado; a ausência do botão não é o controle de acesso.

## Migration Plan

Pela regra do projeto, exclusivamente via MCP Supabase no remoto (nunca CLI/local; `banco.sql` é só referência declarativa):

1. Aplicar a nova definição de `alterar_status_projeto` (mesmo `create or replace function`) pelo MCP Supabase e validar com uma chamada de teste em projeto sandbox/retorno manual.
2. Atualizar `banco.sql` com o mesmo corpo da função para manter a referência versionada fiel.
3. Publicar o front (função em `fluxo.ts` + diálogo/botão no detalhe).

Rollback: restaurar o corpo anterior da função pelo MCP (o front novo passa a receber o erro genérico da transição recusada) e reverter os commits do front. Nenhum dado precisa de migração — o estado anterior é reconstruído re-vinculando a OC.
