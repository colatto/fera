# Tasks

## 1. Seletor de data de emissão

- [x] 1.1 Adicionar estado de data escolhida ao `DialogLote` e estender o reset de abertura (efeito que hoje faz `setLinhas([])`) para limpar também a data; verificar reabrindo o diálogo que nem data nem linhas persistem entre aberturas
- [x] 1.2 Derivar as opções de data a partir de `notasDisponiveis` (datas de emissão distintas, da mais recente para a mais antiga) e apresentar o select de data quando "Adicionar item" for clicado sem data escolhida; verificar que apenas datas com notas pendentes aparecem como opções
- [x] 1.3 Substituir o select de datas pelo calendário nativo (`Input type="date"`, como no print do usuário): escolher data sem notas com saldo em aberto exibe o aviso "Nenhuma nota pendente nesta data de emissão" e impede a criação de linhas; verificar o aviso e o bloqueio no diálogo

## 2. Linhas filtradas e travamento da data

- [x] 2.1 Implementar o clique de "Adicionar item": sem data escolhida, exigir a seleção antes de criar qualquer linha; com data escolhida, criar a linha diretamente já restrita à data; verificar os dois fluxos no diálogo
- [x] 2.2 Filtrar o select de nota de cada linha por data de emissão igual à escolhida, mantendo desabilitada a nota já usada em outra linha; verificar que notas de outras datas não são exibidas nem selecionáveis
- [x] 2.3 Travar a data escolhida enquanto houver linhas (sem troca silenciosa) e liberar nova escolha quando a última linha for removida; verificar ambos os comportamentos clicando "Adicionar item" após remover a última linha

## 3. Regressão do fluxo existente

- [x] 3.1 Conferir inalterados o pre-fill de valor pelo saldo com erro inline de excedente, a `data_recebimento` por linha (default hoje, editável) e o payload enviado à RPC `confirmar_recebimentos_lote`; verificar com `npm run build` passando e lote confirmado manualmente refletindo em status, linha do tempo e dashboards
