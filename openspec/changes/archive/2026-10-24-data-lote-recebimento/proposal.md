# Proposal

## Why

O diálogo "Lote de recebimentos" atualmente lista todas as notas pendentes de
uma vez e deixa cada linha do lote com sua própria data, permitindo montar
lotes que misturam notas de emissões de datas diferentes. O lançamento real
acontece por data de emissão: o ADM confirma de uma vez as notas emitidas em
um determinado dia, e a lista única sem agrupamento obriga a procurar as notas
da data manualmente.

## What Changes

- O clique em "Adicionar item" no diálogo de lote passa a exigir, primeiro, a
  seleção de uma data de emissão, por meio de um calendário (campo de data
  nativo); datas de emissão sem notas pendentes de recebimento exibem aviso
  inline e não permitem a criação de linhas.
- Após a escolha da data, o select de nota de cada linha exibe somente as
  notas pendentes cuja data de emissão é a data escolhida.
- O lote torna-se unidatário por emissão: só é possível adicionar ao lote
  notas de uma mesma data de emissão.
- A data escolhida fica travada enquanto houver linhas no lote; remover a
  última linha libera nova escolha de data.
- A `data_recebimento` de cada linha permanece como hoje: default no dia
  corrente, editável por linha — a data de emissão é somente critério de
  lista, não é gravada.
- Comportamentos preservados: pre-fill do valor pelo saldo da nota, erro
  inline de excedente, nota já usada em outra linha desabilitada (agora
  dentro da lista filtrada), linhas reiniciadas a cada abertura.
- Nenhuma alteração na RPC `confirmar_recebimentos_lote`, nas views ou no
  banco: a mudança é exclusivamente de interface.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o requisito "Recebimentos em lote" passa a exigir a
  seleção prévia de data de emissão e a lista de notas filtrada por essa
  data; o requisito "Nota única por linha do lote" passa a restringir o lote
  a notas de uma mesma data de emissão, com a data travada enquanto houver
  linhas.

## Impact

- `src/routes/projetos/dialog-lote.tsx`: todo o fluxo de seleção de data,
  filtro das notas por data de emissão e travamento da data.
- `src/routes/projetos/projetos-listar.tsx`: sem mudança estrutural — segue
  fornecendo `notasDisponiveis`; o agrupamento por data deriva dessa lista.
- Sem impacto em RPCs, views, banco ou perfis de acesso.
