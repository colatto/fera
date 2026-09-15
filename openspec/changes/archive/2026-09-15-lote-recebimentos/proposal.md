## Why

O botão "Lote de recebimentos" vive no detalhe de um projeto específico, mas a operação que ele abre é transversal: o diálogo lista notas de todos os projetos com saldo em aberto e ignora o projeto da página em que aparece. Além disso, o botão só é exibido quando o projeto aberto está exatamente em `NOTA_EMITIDA`, o que esconde a funcionalidade (e pode deixá-la inacessível) em função de uma condição alheia à operação. A entrada do lote deve morar onde a operação faz sentido: na página inicial de Projetos.

## What Changes

- Mover o botão "Lote de recebimentos" do detalhe do projeto para o cabeçalho da página de listagem de projetos (`/projetos`), ao lado de "Exportar CSV" e "Novo projeto".
- Tornar o botão sempre visível para o perfil ADM, sem condicionamento a status de projeto; o botão deixa de existir no detalhe do projeto.
- Novo comportamento de clique sem notas pendentes: se não houver notas com saldo em aberto, o clique exibe o aviso "Nenhuma nota pendente de recebimento" e não abre o diálogo.
- O diálogo em si (transacional, largura ampliada, truncamento de rótulos, data local como default) permanece inalterado, assim como a RPC `confirmar_recebimentos_lote`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `fluxo-projetos`: o requisito "Recebimentos em lote" passa a fixar a localização da entrada — botão "Lote de recebimentos" no cabeçalho da listagem de projetos, visível apenas para ADM e sempre presente nessa página, sem vínculo a projeto específico — e passa a exigir o aviso "Nenhuma nota pendente de recebimento" no clique quando não há notas com saldo em aberto.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx`: remoção do botão, do estado `loteAberto` e do componente `DialogLote` (extraído daqui).
- Novo arquivo de componente compartilhado para `DialogLote` (extraído de `projeto-detalhe.tsx`), importado pela listagem.
- `src/routes/projetos/projetos-listar.tsx`: botão novo no cabeçalho + decisão de clique (abrir diálogo ou avisar).
- Sem mudanças de banco, RPC, RLS ou dependências: `confirmar_recebimentos_lote` e as queries de projetos seguem como estão.
