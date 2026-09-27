# Design

## Context

A tela de login (`src/routes/login.tsx`) hoje renderiza o `<img>` do wordmark fora da `Card`, sobre o fundo da página. O tema tem `--background: oklch(0.363 0.079 264.8)` e `--card: oklch(0.322 0.054 268.8)` (`src/index.css`) — o fundo navy embutido do JPG coincide com o `--background`, e é por isso que o logo "some" na página. Ver proposal.md para a motivação.

Dois fatos do design system pesam na abordagem:

- O `Card` (`src/components/ui/card.tsx`) já trata imagem como primeiro filho: `has-[>img:first-child]:pt-0` remove o padding superior e `*:[img:first-child]:rounded-t-xl` arredonda os cantos superiores da imagem.
- O `Card` é `flex flex-col` e tem `ring-1 ring-foreground/10`.

## Goals / Non-Goals

**Goals:**

- Composição e cores da tela de login conforme a spec delta, mudando apenas `login.tsx`.
- Wordmark se fundindo com a modal (sem costura visível em volta do JPG).

**Non-Goals:**

- Alterar tokens do tema (`--background`, `--card`, `--sidebar`) ou qualquer outro ponto do `index.css`.
- Alterar o shell, o rodapé institucional, o asset `feralogo.jpg` ou o comportamento do formulário.

## Decisions

1. **Cores como override local com valores arbitrários** (`bg-[oklch(0.322_0.054_268.8)]` no container e `bg-[oklch(0.363_0.079_264.8)]` na `Card`), não como tokens. Alternativas descartadas: trocar os tokens no `index.css` (mudaria o app inteiro — escopo global rejeitado pelo usuário) e criar utilidades nomeadas (desnecessário para um uso único).
2. **Logo como primeiro filho da `Card`**, reaproveitando o suporte nativo do componente (padding superior zero, cantos superiores arredondados). Alternativa descartada: colocar o `<img>` dentro do `CardHeader` (exigiria ajustes manuais de espaçamento sem benefício).
3. **Manter `w-56` e centralizar horizontalmente** (`mx-auto`, funciona em flex-col). Alternativa descartada: largura total da card (`max-w-sm` ≈ 384 px) — esticaria demais o wordmark. Manter `rounded-lg` no `<img>`: invisível enquanto o fundo do JPG coincide com a modal, inofensivo caso diverja.
4. **Não tocar no `gap-8` do container**: com o logo dentro da card, o espaçamento passa a valer apenas entre card e rodapé — que já é o espaçamento atual do rodapé. O `ring-1` da `Card` permanece: agora é a modal clara se destacando do fundo escuro.

## Risks / Trade-offs

- [Fundo do JPG não coincidir exatamente com a nova cor da modal] → validar visualmente após aplicar; se surgir costura, o caminho é tratar o asset (PNG com transparência) — fora do escopo deste change.
- [Login com paleta invertida em relação ao resto do app] → intencional e confirmado com o usuário; fixado no requisito modificado da spec.
- [Duplo arredondamento do logo (`rounded-lg` atual + `rounded-t-xl` do design system)] → sem efeito visível enquanto as cores se fundem; sem ação.

## Migration Plan

Mudança puramente visual de frontend, sem dados nem deploy adicional. Rollback = reverter o commit.

## Open Questions

(nenhuma)
