## Context

No dashboard operacional (`src/routes/dashboards/dashboard-operacional.tsx`), os dois gráficos de distribuição por status são compostos com `<Cell fill={CORES_GRAFICO[status]}>` por entrada, e cada `<Tooltip>` repete o mesmo `contentStyle` escuro. No recharts 3.10.1, a cor da entrada do tooltip do `Bar` vem do `fill` do próprio `<Bar>` (`SetBarTooltipEntrySettings`: `color: fill`), que não está definido — o `DefaultTooltipContent` então cai no fallback `#000` (`itemStyle.color`), que pinta o texto da linha sobre o fundo escuro do tooltip. No `Pie`, o payload do tooltip já recebe `color` do `fill` de cada `Cell` (`Pie.js`, `sectorColor`), motivo pelo qual a pizza já colore corretamente. O `<Bar>` não expõe cor por entrada ao tooltip, e `itemStyle` do `Tooltip` é estático, sem acesso à entrada hoverada.

## Goals / Non-Goals

**Goals:**

- Legenda do tooltip ("quantidade : N" nas barras; rótulo do status na pizza) na cor do status do elemento sob o cursor, nos dois gráficos, a partir de uma única fonte de cor (`CORES_GRAFICO`).
- Eliminar a duplicação dos `contentStyle` entre os dois `<Tooltip>`.

**Non-Goals:**

- Alterar rótulos, valores ou formatação do tooltip (mantém "quantidade : N", valor numérico cru, sem `formatarNumero`).
- Adicionar componente `<Legend />` tradicional ou colorir rótulos do eixo X.
- Mudanças no dashboard financeiro ou em qualquer outro gráfico do sistema.

## Decisions

- **Componente de conteúdo de tooltip compartilhado, definido no próprio `dashboard-operacional.tsx`.** Um único componente recebe os props do recharts (`active`, `payload`) e resolve a cor por `CORES_GRAFICO[entrada.payload.status]`, com fallback para `entry.color` (que a pizza já fornece) quando o status não estiver no mapa. Os dois `<Tooltip>` passam a usar `content={<... />}` e os `contentStyle` duplicados são removidos — o estilo escuro do tooltip (fundo `#232C47`, borda translúcida, raio 8) migra para o componente.
  - Alternativa considerada: setar `fill` por status no `<Bar>` — inviável, pois `fill` é uma cor única para a série inteira; as cores por entrada vivem nos `Cell`, invisíveis ao tooltip.
  - Alternativa considerada: `itemStyle`/`formatter` no `Tooltip` — estáticos ou limitados a valor/nome, sem acesso à entrada hoverada para derivar cor.
  - Alternativa considerada: customizar só o tooltip das barras e manter o default da pizza — rejeitada por manter duas aparências de tooltip no mesmo painel; o componente compartilhado garante consistência visual.
- **Cor resolvida pela chave `status` (lookup em `CORES_GRAFICO`) como regra primária nos dois gráficos**, em vez de confiar em `entry.color` só da pizza: `CORES_GRAFICO` é a fonte única de verdade das cores por status e o payload de ambos os gráficos carrega `payload.status` (objeto montado por `montarDistribuicao`).
- **Sem um `defaultProps` de cor nova**: se um status futuro não estiver em `CORES_GRAFICO`, o componente usa uma cor neutra legível (`#E8ECF5`) em vez de quebrar — evita regressão do tipo "texto preto em fundo escuro".

## Risks / Trade-offs

- [Componente custom substitui o `DefaultTooltipContent`, perdendo comportamentos default gratuitos (ex.: `accessibilityLayer`, ordenação de itens)] → O payload tem uma única entrada por gráfico; o componente reproduz apenas o necessário (rótulo, separador " : ", valor). Qualquer recurso default ausente seria perceptível imediatamente nos dois gráficos.
- [Payload vazio ou `active` falso entre barras] → O componente retorna `null` fora de hover ativo, replicando o comportamento default e evitando um retângulo vazio flutuante.
- [Acoplamento do componente ao formato de `payload[0].payload.status`] → Mitigado por já ser o formato estável montado por `montarDistribuicao` e consumido pelos `Cell` atuais; fallback via `entry.color` cobre divergência da pizza.
