## Context

O design system (`src/components/ui/button.tsx`) define `destructive` como fundo vermelho translúcido com texto vermelho; `secondary` é cinza neutro e `default` usa a cor primária do tema. No detalhe do projeto (`src/routes/projetos/projeto-detalhe.tsx`), "Cancelar projeto" já usa `destructive` no gatilho e no diálogo; "Cancelar envio" usa `secondary` no gatilho e `default` no diálogo. O spec `fluxo-projetos` não trata de cores; a convenção visual de cancelamento entra no spec `interface-web` (ver specs/ delta).

## Goals / Non-Goals

**Goals:**
- Tornar "Cancelar envio" visualmente idêntico a "Cancelar projeto" em gatilho e diálogo, aplicando `destructive`.

**Non-Goals:**
- Não auditar nem alterar outros botões do app (ex.: confirmações de "Ordem de compra", "Nota fiscal", "Recebimentos", que permanecem no padrão atual).
- Não alterar comportamento, texto, posição ou fluxo das ações.

## Decisions

- **D1 — "Cancelar envio" usa `destructive` mesmo sendo reversível.** Alternativa considerada: manter a diferenciação cinza/vermelho como codificação de "reversível vs. final". Rejeitada porque o app já aplica `destructive` a ação reversível ("Inativar" usuário tem "Reativar"), então a linguagem visual vigente é "destructive = ação de retirada/cancelamento", e é essa convenção que o spec passa a documentar.
- **D2 — Convenção registrada no spec `interface-web` (requisito ADDED), não no `fluxo-projetos`.** A regra vale para a interface como um todo (assim como o requisito de integridade de modais), não apenas para o fluxo de projetos.

## Risks / Trade-offs

- [Destaque maior pode chamar atenção para ação reversível] → O estilo `destructive` do design system é de baixa intensidade (fundo translúcido, não sólido), e a ação continua atrás de diálogo de confirmação.
