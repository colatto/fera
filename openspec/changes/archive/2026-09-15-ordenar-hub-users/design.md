## Context

A tela de Usuários (`src/routes/usuarios/usuarios.tsx`) lista `v_usuarios_manutencao` ordenada só por `nome` (`src/queries/usuarios.ts`), com três botões fantasma por linha na coluna Ações (Editar, Redefinir senha, Inativar/Reativar — este último disparando direto, sem modal). A modal `DialogEditarUsuario` opera sobre um snapshot do objeto da linha capturado no clique, o `DialogContent` padrão é `sm:max-w-sm`, e a redefinição de senha hoje é um diálogo autônomo (`DialogRedefinirSenha`) aberto pela tabela. As ações de backend (`inativar`, `reativar`, `redefinir_senha` da Edge Function `admin-usuarios`) e seus tratamentos de erro já existem e não mudam.

## Goals / Non-Goals

**Goals:**

- Ordenação Ativos → Inativos → nome na fonte da listagem, sem lógica de ordenação espalhada na UI.
- Reduzir a coluna Ações da tabela a um único botão `Editar`, concentrando as ações de status e senha na modal de edição, que passa a refletir o status atual do usuário em tempo real.

**Non-Goals:**

- Alterar view, RLS, Edge Function, mensagens de erro ou as regras de negócio já fixadas na spec `administracao-usuarios` (revogação de sessões, salvaguarda de último ADM, mínimo de 6 caracteres).
- Paginação, filtros ou busca na listagem.

## Decisions

1. **Ordenação no servidor, em duas cláusulas** — `.order("ativo", { ascending: false }).order("nome")` na consulta de `v_usuarios_manutencao`. PostgREST ordena booleanos com `DESC` pondo `true` primeiro, e a segunda cláusula desempata alfabeticamente dentro de cada grupo. Alternativas descartadas: ordenar no cliente (duplicaria a intenção em dois lugares) ou recriar a view com `ORDER BY` (mudança de banco desnecessária — a view não garante ordem e a ordenação é contrato de exibição da tela).

2. **Hub na modal de edição, não dropdown na tabela** — a modal já é o ponto de edição do usuário e passa a hospedar a seção `Ações do usuário`; a tabela exibe apenas `Editar`. Alternativa de menu suspenso na tabela foi descartada por fragmentar as ações em dois pontos e exigir componente de menu novo.

3. **Redefinição por revelação inline** — o botão `Redefinir senha` revela, na própria modal, o campo de nova senha com o botão `Confirmar`; o texto atual da descrição ("sessões serão revogadas; usuário inativo não é reativado") vira o apoio do campo revelado. Alternativas descartadas: diálogo aninhado sobre a modal (empilhamento confuso) e campo sempre visível (convida a digitar a senha e acionar `Salvar` do formulário por engano). A mutação `redefinirSenha` existente é reutilizada; ao confirmar, o campo limpa e recolhe, com a modal aberta.

4. **Um clique para inativar/reativar, destrutivo no `Inativar`** — a fricção de abrir a modal substitui a confirmação explícita, mantendo paridade com o comportamento atual (um clique na tabela). `Reativar` usa estilo padrão.

5. **Dado fresco por `id` em vez de snapshot** — o estado de edição guarda o `id` do usuário e a modal deriva o objeto da lista revalidada (`consulta.data`). O cache do React Query segue servindo os dados durante a revalidação (invalidação não zera o cache), então não há lampejo de estado indefinido entre a ação e o refetch. Fallback defensivo: fechar a modal se o `id` não for encontrado (não há exclusão de usuário, então é improvável).

6. **Largura `sm:max-w-lg`** — respiro para a seção de ações, com precedente no app (`dialog-lote` usa `sm:max-w-2xl`, cadastros usam `max-w-xl`).

## Risks / Trade-offs

- [Ordenação booleana dependente do comportamento do PostgREST] → verificação manual da ordem na tela após implementar; se `ativo` não ordenar como esperado, trocar por expressão equivalente na mesma cláusula.
- [Usuário rebaixado/inativado na própria modal dispara salvaguarda de último ADM] → toast de erro existente é exibido, modal permanece aberta e o formulário mantém o estado; nenhum tratamento extra necessário.
- [Modal aberta enquanto outra sessão altera o mesmo usuário] → o dado fresco por `id` reflete o estado do último refetch; aceitável para tela administrativa de baixa concorrência.

## Migration Plan

Mudança exclusivamente de frontend; sem deploy de banco ou Edge Function. Rollback trivial por reverter o commit. A ordenação nova aparece sem etapa de migração de dados.
