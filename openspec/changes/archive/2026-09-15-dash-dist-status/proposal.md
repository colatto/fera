## Why

No dashboard operacional, a legenda do tooltip dos gráficos "Distribuição por status" (barras) e "Proporção por status" (pizza) não acompanha a cor do elemento sob o mouse: na pizza a linha já surge na cor da fatia, mas nas barras o recharts usa o `fill` do `<Bar>` (não definido) e cai em preto sobre o fundo escuro do tooltip, ficando ilegível e destoando da cor da barra hoverada.

## What Changes

- A linha do tooltip do gráfico de barras ("quantidade : N") passa a ser exibida na cor do status correspondente à barra sob o mouse (mesma cor do `<Cell>`, conforme `CORES_GRAFICO`).
- A linha do tooltip do gráfico de pizza ("Rotulo : N") passa a usar a mesma fonte de cor por status, garantindo comportamento idêntico nos dois gráficos.
- Um único componente de conteúdo de tooltip é compartilhado pelos dois `<Tooltip>` do dashboard operacional, substituindo os `contentStyle` duplicados atuais.
- Rótulos e valores do tooltip permanecem como estão: mantém-se "quantidade : N" nas barras, o rótulo do status na pizza e o valor numérico sem formatação adicional.

## Capabilities

### New Capabilities

### Modified Capabilities

- `painel-dashboards`: o tooltip dos gráficos de distribuição por status do dashboard operacional passa a exigir que a legenda ("quantidade : N" / rótulo do status) seja exibida na cor do status do elemento sob o mouse, de forma consistente entre os gráficos de barras e de pizza.

## Impact

- Código: `src/routes/dashboards/dashboard-operacional.tsx` (componente de conteúdo de tooltip compartilhado pelos dois gráficos; remoção dos `contentStyle` duplicados).
- Sem mudanças em banco de dados, queries (`src/queries/dashboards`), rotas ou dependências.
- Nenhum impacto no dashboard financeiro.
