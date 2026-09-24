## 1. Modo exclusivo na modal de edição

- [x] 1.1 Em `ModalEditarUsuario` (`src/routes/usuarios/usuarios.tsx`), renderizar a linha de ações (`Redefinir senha` / `Inativar`–`Reativar`) somente quando `redefinicaoAberta` for falso
- [x] 1.2 Renderizar o rodapé (`Voltar` / `Salvar`) somente quando `redefinicaoAberta` for falso
- [x] 1.3 Adicionar `disabled={redefinicaoAberta}` ao Select de perfil e aos Inputs de nome e e-mail
- [x] 1.4 Conferir que `Cancelar` e o sucesso da redefinição restauram linha de ações, rodapé e campos sem alterar os valores digitados em nome e e-mail (nenhum `reset` extra deve ser necessário)

## 2. Validação

- [x] 2.1 Validar manualmente na tela de usuários: abrir `Editar usuário`, acionar `Redefinir senha` e conferir modo exclusivo (ações e rodapé ocultos, campos desabilitados); digitar nome/e-mail antes e confirmar preservação após `Cancelar` e após redefinição bem-sucedida; conferir usuário inativo (rótulo `Reativar`) e o caminho de erro (senha curta mantém o modo)
- [x] 2.2 Rodar `npm run build` (typecheck + build) e corrigir qualquer regressão
