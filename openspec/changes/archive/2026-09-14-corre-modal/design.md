# Design — Correção da modal de lote de recebimentos

## Context

Ver "proposal.md — Why". Diagnóstico medido no DOM (viewport 1280px, projeto `F-2026-5001`):

- `DialogContent` computa `max-width: 384px`, embora `DialogLote` declare `max-w-2xl` (672px).
- A linha do item (`grid-cols-[1fr_auto_auto_auto]`) mede 545px de min-content após a seleção de uma nota: o trigger do `Select` tem `w-fit` + `whitespace-nowrap` (`src/components/ui/select.tsx:46`) e o rótulo "F-2026-5001 — nota 1 — saldo R$ 500,00" tem 315px de min-content; data (149px), valor (29px) e ✕ (28px) somam o resto.
- Faixa de grid `1fr` equivale a `minmax(auto, 1fr)`: o piso de min-content do rótulo impede o encolhimento da coluna e a linha transborda a modal.
- Como `DialogContent` é ele próprio `display: grid` com coluna implícita (`src/components/ui/dialog.tsx:64`), a coluna adota o min-content da linha e arrasta descrição e rodapé para fora da caixa.

## Goals / Non-Goals

**Goals:**

- Modal do lote integralmente contida: campos, ✕ e rodapé dentro da caixa, com o rótulo da nota truncando em vez de transbordar.
- Largura ampliada (2xl) efetivamente aplicada à modal do lote, conforme a nova requirement de `interface-web`.
- Correção local no ponto de uso, sem alterar os componentes base `dialog.tsx`/`select.tsx` usados por todas as outras modais.

**Non-Goals:**

- Mudar o comportamento, validações, RPC ou dados do lote (spec `fluxo-projetos` intocada).
- Redesenhar rótulos do seletor ou trocar o componente de `Select`.
- Auditoria das demais modais (nenhuma outra combina `Select` + linha larga; ficam na largura padrão).

## Decisions

1. **`sm:max-w-2xl` no `DialogContent` do `DialogLote`** (em vez de `max-w-2xl`).
   O base declara `max-w-[calc(100%-2rem)] sm:max-w-sm`; na cascata do Tailwind a variante `sm:` vem depois da utilidade sem prefixo e vence com mesma especificidade — por isso o 384px foi computado. Prefixar com `sm:` iguala o formato e restaura a largura pretendida.
   *Alternativa descartada:* mudar o base (`sm:max-w-sm` → outro valor ou reordenar classes) — afetaria todas as modais do sistema, que hoje dependem da largura padrão.

2. **Faixa `minmax(0, 1fr)` para a coluna da nota + `min-w-0` no wrapper** (em vez de `1fr`).
   `minmax(0, 1fr)` remove o piso de min-content da faixa; o `min-w-0` no `div` flex do campo zera o mínimo automático do item de grid. Juntos, permitem a coluna encolher de verdade.
   *Alternativa descartada:* encurtar o rótulo do item (ex.: só número da nota) — perde informação que o ADM usa para escolher a nota certa (pasta e saldo).

3. **`SelectTrigger className="w-full"`** (em vez de `w-fit` herdado).
   Com a faixa controlada, o trigger preenche a coluna e o `SelectValue` trunca: o próprio base do trigger já aplica `line-clamp-1` ao `select-value` (`select.tsx:46`), e `overflow` não-visível zera o mínimo automático do span — o corte com reticências funciona sem CSS adicional.
   *Alternativa descartada:* `position="popper"` no `SelectContent` — ortogonal ao problema (é o posicionamento do dropdown aberto, não o layout da linha).

## Risks / Trade-offs

- [Rótulo truncado esconde parte da informação (saldo/pasta)] → O texto completo permanece acessível no dropdown aberto e via `title`/foco, se necessário; a linha continua mostrando o início do rótulo (pasta + nota).
- [`auto` das colunas Data/Valor continua intrínseco (~178px)] → Suficiente e estável; `minmax(0,1fr)` garante que qualquer excesso seja absorvido pela coluna da nota, não pelas demais.
- [Correção só na modal do lote] → Deliberado: é a única modal com esse padrão; generalizar cedo seria speculative. A nova requirement de `interface-web` cobre o caso geral se outras modais surgirem.

## Migration Plan

Sem banco, sem deploy de servidor: mudança só de classes CSS no bundle estático (Vercel). Rollback = reverter o commit.

## Open Questions

Nenhuma.
