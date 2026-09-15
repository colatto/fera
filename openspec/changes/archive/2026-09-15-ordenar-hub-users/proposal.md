## Why

A listagem de usuários mistura ativos e inativos em ordem alfabética única, dificultando enxergar quem está em operação; e a coluna Ações repete três botões em cada linha (Editar, Redefinir senha, Inativar/Reativar), poluindo a tabela e convidando cliques acidentais em ações destrutivas.

## What Changes

- Listagem ordenada pelo servidor: usuários Ativos primeiro, seguidos dos Inativos, em ordem alfabética por nome dentro de cada grupo.
- Coluna Ações da tabela passa a exibir somente o botão `Editar`; `Redefinir senha` e `Inativar`/`Reativar` saem da tabela.
- A modal `Editar usuário` se torna o hub de ações do usuário: mantém o formulário de perfil, nome e e-mail e ganha uma seção `Ações do usuário` com `Redefinir senha` (revela campo de nova senha inline para confirmar) e `Inativar`/`Reativar` conforme o status atual do usuário, em um clique, com estilo destrutivo para `Inativar`.
- Modal alargada para `sm:max-w-lg` para acomodar a seção de ações.
- A modal deixa de operar sobre um snapshot da linha: passa a derivar o usuário por `id` dos dados revalidados da query, de modo que o status exibido e os rótulos das ações se atualizem após inativar/reativar sem fechar a modal.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `administracao-usuarios`: a listagem de manutenção passa a exigir ordenação Ativos → Inativos → nome; a inativação/reativação e a redefinição de senha passam a ser oferecidas a partir da modal de edição (a tabela exibe apenas `Editar`), sem mudar as regras de negócio já definidas (revogação de sessões, salvaguarda de último ADM ativo, mínimo de 6 caracteres).

## Impact

- `src/queries/usuarios.ts`: ordenação na consulta de `v_usuarios_manutencao`.
- `src/routes/usuarios/usuarios.tsx`: tabela (coluna Ações), `DialogEditarUsuario` (hub de ações, largura, dado fresco por `id`) e remoção do fluxo direto de `DialogRedefinirSenha` a partir da tabela.
- Sem mudanças de banco, view, Edge Function `admin-usuarios`, RLS ou permissões — as ações já existem no backend.
