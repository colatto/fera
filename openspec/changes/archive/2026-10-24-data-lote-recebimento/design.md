# Design

## Context

O diálogo de lote (`src/routes/projetos/dialog-lote.tsx`) recebe
`notasDisponiveis` da listagem (`projetos-listar.tsx:296`): projetos com
`nota_fiscal_id` e `saldo_receber > 0`. A view `v_projetos_administrativo`
já expõe `data_emissao` de cada nota, portanto o agrupamento por data de
emissão resolve-se no front, sem alteração de RPC, view ou banco. Hoje o
select de nota lista todas as pendentes e cada linha carrega sua própria
`data_recebimento` (default `dataLocalHoje()`).

## Goals / Non-Goals

**Goals:**

- Exigir data de emissão antes de qualquer seleção de nota.
- Restringir o select de nota às pendentes da data escolhida.
- Lote unidatário por emissão, com data travada enquanto houver linhas.

**Non-Goals:**

- Não alterar a RPC `confirmar_recebimentos_lote`, o payload por item
  (`nota_fiscal_id`, `data_recebimento`, `valor_recebido`) nem o banco.
- Não unificar a `data_recebimento` do lote: permanece por linha (decisão
  "Opção B" da exploração — a data de emissão é só critério de lista).
- Não filtrar por `previsao_recebimento`: o agrupamento é pela emissão.

## Decisions

**D1 — Estado de data é do lote, não da linha.** Novo estado `dataEmissao`
(`string | ""`) no `DialogLote`; as linhas não carregam a data de emissão.
"Adicionar item" com `dataEmissao` vazio apresenta o seletor de data; com
data escolhida (e linhas existentes) cria a linha direto, já filtrada.
Alternativa considerada: data por linha derivada da nota escolhida —
rejeitada porque permitiria lote misto, exatamente o que o change proíbe.

**D2 — Calendário nativo para a data de emissão.** O clique em "Adicionar
item" sem data apresenta o campo de data nativo (`Input type="date"`), cujo
calendário do navegador (grade mensal com "Limpar"/"Hoje") substitui um
select de datas. Datas sem pendentes tornam-se selecionáveis: o diálogo
exibe o aviso inline "Nenhuma nota pendente nesta data de emissão" e o
"Adicionar item" não cria linha enquanto a data escolhida não tiver notas
com saldo em aberto — a restrição de negócio migra da composição da lista
para a validação na criação de linhas. Revisão da decisão original (select
de datas distintas, que rejeitava o calendário livre por levar a listas
vazias): a pedido do usuário, o calendário é preferível à lista; o aviso
inline elimina o problema das listas vazias.

**D3 — Travamento decorre do estado, sem confirmação extra.** A data não é
editável enquanto `linhas.length > 0`; quando a última linha é removida, a
próxima ação "Adicionar item" volta a exigir seleção (a data pode ser
zerada junto à remoção da última linha ou verificada no clique — detalhe de
implementação; o comportamento observável é o da spec). Alternativa
considerada: troca de data limpando as linhas silenciosamente — rejeitada
pela perda de dados sem aviso.

**D4 — Reset a cada abertura inclui a data.** O efeito existente
`if (aberto) setLinhas([])` passa também a limpar `dataEmissao`, mantendo a
regra de diálogo sempre renascido (design D2 do change arquivado
`2026-09-07-add-frontend`).

**D5 — `data_recebimento` intacta.** O campo por linha, seu default
(`dataLocalHoje()`, spec "Datas de negócio com default no fuso local") e a
edição permanecem como hoje; o submit monta `ItemRecebimentoLote[]`
exatamente como agora.

## Risks / Trade-offs

- [Refetch do cache durante o diálogo muda `notasDisponiveis`] → as linhas
  já criadas preservam a nota escolhida e o filtro aplica-se apenas ao
  select; comportamento preexistente, sem agravamento neste change.
- [Data escolhida perde todas as pendentes após refetch] → o ADM remove as
  linhas e reabre o diálogo; cenário raro, sem tratamento especial.
- [Calendário permite escolher datas sem pendentes] → aviso inline junto ao
  campo e bloqueio da criação de linhas; nenhuma linha nasce sem notas
  disponíveis.

## Migration Plan

Mudança exclusivamente de front, em um componente. Deploy único; rollback
pelo revert do commit. Sem dados, schema ou migração envolvidos.
