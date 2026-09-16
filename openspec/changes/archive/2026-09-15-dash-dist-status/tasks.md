## 1. Tooltip compartilhado

- [x] 1.1 Em `src/routes/dashboards/dashboard-operacional.tsx`, criar componente de conteúdo de tooltip que, com hover ativo e payload presente, renderiza a linha `nome : valor` colorida com `CORES_GRAFICO[payload[0].payload.status]` (fallback `entry.color` da pizza; cor neutra `#E8ECF5` se status sem cor mapeada) e retorna `null` fora de hover ativo
- [x] 1.2 Migrar o estilo escuro atual do tooltip (fundo `#232C47`, borda `rgba(255,255,255,0.12)`, raio 8) para dentro do componente compartilhado e remover os `contentStyle` dos dois `<Tooltip>`

## 2. Aplicação nos gráficos

- [x] 2.1 No gráfico "Distribuição por status" (barras), usar o componente compartilhado como `content` do `<Tooltip>`, preservando o `cursor` atual e o rótulo "quantidade : N" sem formatação de número
- [x] 2.2 No gráfico "Proporção por status" (pizza), usar o mesmo componente como `content` do `<Tooltip>`, preservando o rótulo do status

## 3. Verificação

- [x] 3.1 Conferir no dashboard operacional: hover na barra de cada status exibe "quantidade : N" na cor da barra; hover na fatia exibe a linha na cor da fatia; mesma cor por status nos dois gráficos; tooltip some ao sair do hover
- [x] 3.2 Rodar lint/build e confirmar ausência de erros de TypeScript no arquivo alterado
