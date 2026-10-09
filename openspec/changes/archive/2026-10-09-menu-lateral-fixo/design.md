# Design

## Context

O `Shell` (src/components/shell.tsx) organiza a página num contêiner `flex min-h-svh md:flex-row`, cuja altura cresce com o conteúdo. O `<aside>` é flex item e se estica (`align-items: stretch`) até a altura total da linha; a rolagem é a do documento, então a sidebar sobe com a página. Internamente a sidebar já é um shell de aplicativo (logo no topo, `nav` com `flex-1 md:overflow-y-auto`, bloco de usuário no pé) — falta apenas dar a ela altura de viewport e fixá-la. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**
- Sidebar fixa em desktop durante toda a rolagem, com rolagem interna do menu quando necessário
- Mudança mínima e sem alterar o modelo de rolagem da aplicação

**Non-Goals:**
- Redesenho da sidebar, colapso/ícones, drawer mobile
- Migrar a rolagem da página para dentro do `<main>` (app shell completo)
- Alterar o comportamento do rodapé institucional sticky

## Decisions

**Opção A — `md:sticky md:top-0 md:h-svh` no `<aside>`, mantendo a rolagem no documento.**

O `md:h-svh` é a peça essencial, não cosmético: `align-items: stretch` só vale para altura `auto`, então uma altura explícita desativa o esticamento e dá ao sticky espaço para deslizar dentro da linha enquanto o documento rola. Sem ela, o aside esticado teria exatamente a altura do contêiner e o `sticky` não teria para onde mover o elemento.

Alternativa considerada — **Opção B, app shell com rolagem interna** (`md:h-svh md:overflow-hidden` no contêiner e `md:overflow-y-auto` no main): mesmo resultado visual, mas migra o scrollport do documento para o `<main>`, afetando restauração de rolagem do react-router, find-in-page do navegador e qualquer suposição futura sobre scroll de documento. Descartada por raio de impacto desproporcional ao ganho.

A Opção A preserva o mecanismo do rodapé institucional (`sticky bottom-0` no main, spec "linha institucional"), que depende do scrollport ser o documento. O comportamento dos três elementos internos da sidebar já está correto: com o aside em `h-svh`, o `nav` (`flex-1 md:overflow-y-auto`) rola internamente quando o menu excede a viewport, e o bloco de usuário fica ancorado no pé da viewport.

## Risks / Trade-offs

- [Menu ligeiramente mais estreito de área útil em telas muito baixas, pois logo e bloco de usuário passam a ocupar espaço fixo da viewport] → o `nav` já rola internamente; os itens cabem com folga em qualquer viewport desktop comum.
- [Navegadores muito antigos sem suporte a `svh`] → fallback: Tailwind v4 gera a unidade com `@supports`; sem suporte, o comportamento degrada para o atual (sidebar rola), sem quebrar.

## Migration Plan

Sem migração: alteração puramente visual de CSS no componente de shell. Rollback = reverter a linha de classes.

## Open Questions

(nenhuma)
