# Tasks

## 1. Implementação no Shell

- [x] 1.1 Adicionar `md:sticky md:top-0 md:h-svh` ao `<aside>` em `src/components/shell.tsx` e atualizar o comentário do shell para registrar a fixação; verificar que `npm run build` conclui sem erro de tipo
- [x] 1.2 Ajustar comentários internos do `aside`/`nav` se necessário para refletir a nova geometria (altura de viewport, rolagem interna do menu); verificar que nenhum comentário contradiz o comportamento novo

## 2. Verificação de comportamento

- [x] 2.1 Com `npm run dev`, abrir uma página longa (listagem de projetos com muitos itens) em viewport largo: confirmar que a sidebar permanece fixa com logo, menu e bloco de usuário visíveis durante toda a rolagem, e que o rodapé institucional R3 continua colado no canto inferior direito
- [x] 2.2 Reduzir a altura da janela até o menu exceder a viewport: confirmar que a sidebar permanece fixa e o menu rola internamente sem mover logo nem bloco de usuário
- [x] 2.3 Reduzir a largura abaixo do breakpoint `md`: confirmar que a sidebar volta a empilhar no topo e rolar com a página, e que o rodapé institucional encurtado continua visível
