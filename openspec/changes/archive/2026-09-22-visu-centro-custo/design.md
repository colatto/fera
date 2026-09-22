## Context

O card "Financeiro" do detalhe do projeto (`src/routes/projetos/projeto-detalhe.tsx`) é alimentado pela projeção administrativa, que já expõe `centro_custo` (o SELECT de ADM já o traz; `banco.sql` é a referência). O centro de custo é gravado no projeto pela RPC `vincular_ordem_compra` junto com a OC, portanto centro de custo informado implica OC registrada. Motivação: ver proposal.md — Why; requisitos: specs/consulta-projetos/spec.md.

## Goals / Non-Goals

**Goals:**
- Exibir o centro de custo no resumo financeiro do ADM, abaixo de "Ordem de compra", quando informado.

**Non-Goals:**
- Alterar banco, queries, tipos ou CSV; exibir centro de custo para OPER; permitir edição do centro de custo no detalhe.

## Decisions

- **Linha própria no card em vez de embutir no valor da OC** — o card é um resumo estruturado de linhas rotuladas (`LinhaFinanceira`); embutir (`OC … — CC …`) misturaria dados de rótulos distintos, e a linha do tempo já cobre o formato embutido. Alternativa descartada: concatenar ao valor de "Ordem de compra".
- **Condição sobre `centro_custo`, não sobre `numero_oc`** — o requisito é "quando houver centro de custo". Hoje o dado só nasce com a OC (`vincular_ordem_compra` grava ambos no mesmo UPDATE), então na prática a linha surge sempre abaixo da OC; se o modelo um dia permitir CC sem OC, a linha continua correta. Alternativa descartada: condicionar a exibição à existência da OC.
- **Sem alteração de dados** — `adm.centro_custo` já está disponível no objeto que alimenta o card; nenhuma query ou tipo muda.

## Risks / Trade-offs

- [Linha "Centro de custo" sem a "Ordem de compra" acima em caso hipotético de CC sem OC] → Hoje impossível pela RPC; a linha simplesmente apareceria no fim do card, sem quebra de layout.
