## Why

Na página do projeto, o gatilho "Cancelar envio" usa a variante `secondary` (cinza) enquanto o gatilho "Cancelar projeto" usa `destructive` (vermelho); no diálogo de confirmação, o botão de execução de "Cancelar envio" fica na variante padrão (cor primária, destaque máximo), enquanto o de "Cancelar projeto" usa `destructive`. A ação de cancelamento fica sem a sinalização visual negativa que o app já adota (ex.: "Inativar" usuário), e os dois botões "Cancelar envio" nem combinam entre si.

## What Changes

- Gatilho "Cancelar envio" na página do projeto passa a usar a variante `destructive`, igual ao gatilho "Cancelar projeto".
- Botão de confirmação do diálogo "Cancelar envio" passa a usar a variante `destructive`, igual ao botão "Cancelar projeto" do seu diálogo.
- Novo requisito no spec `interface-web` estabelecendo a convenção: ações de cancelamento usam o estilo destructive tanto no gatilho quanto no botão de confirmação do diálogo.

## Capabilities

### New Capabilities

### Modified Capabilities

- `interface-web`: adiciona requisito de padronização visual de ações de cancelamento (estilo destructive no gatilho e no diálogo de confirmação).

## Impact

- `src/routes/projetos/projeto-detalhe.tsx`: duas linhas (variante do gatilho "Cancelar envio" e do botão de confirmação do diálogo "Cancelar envio").
- Sem alteração de comportamento, RPCs, dados ou dependências; nenhum teste referencia esses botões.
