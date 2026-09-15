## 1. Ordenação da listagem

- [x] 1.1 Em `src/queries/usuarios.ts`, ordenar `listarUsuariosManutencao` por `ativo` (decrescente, ativos primeiro) e depois por `nome`

## 2. Modal de edição como hub

- [x] 2.1 Em `DialogEditarUsuario`, trocar o snapshot por `id`: derivar o usuário dos dados revalidados da consulta por `id`, com fechamento da modal como fallback se não encontrado
- [x] 2.2 Alargar a modal para `sm:max-w-lg` e exibir o selo de situação (Ativo/Inativo) no cabeçalho, derivado do dado fresco
- [x] 2.3 Adicionar a seção `Ações do usuário` com revelação inline de `Redefinir senha` (campo de nova senha + Confirmar, mínimo de 6 caracteres, texto de apoio sobre revogação de sessões; reutilizar `redefinirSenha`; ao confirmar, limpar e recolher o campo com a modal aberta)
- [x] 2.4 Adicionar `Inativar`/`Reativar` em um clique conforme o status atual, com estilo destrutivo no `Inativar`, reutilizando `inativarUsuario`/`reativarUsuario` e os toasts existentes

## 3. Tabela

- [x] 3.1 Reduzir a coluna Ações ao botão `Editar`, que abre a modal pelo `id` da linha
- [x] 3.2 Remover os botões `Redefinir senha` e `Inativar`/`Reativar` da tabela, o estado `redefinicao` e o componente `DialogRedefinirSenha`

## 4. Verificação

- [x] 4.1 Conferir na tela: ativos antes de inativos (alfabético dentro de cada grupo), coluna Ações só com `Editar` e fluxos da modal (redefinição inline, inativar/reativar refletindo o status sem reabrir, salvaguarda do último ADM exibindo o motivo)
- [x] 4.2 Rodar build e lint do projeto
