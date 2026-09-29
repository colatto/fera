# Tasks

## 1. Modal sem ações sobre o próprio registro

- [x] 1.1 Em `DialogEditarUsuario` (`src/routes/usuarios/usuarios.tsx`), obter o usuário da sessão com `useRouteLoaderData("shell")` (padrão do shell, tipo `SessaoAtual`) e calcular o predicado de próprio registro comparando `usuario.id` com o `id` da sessão, tratando `id` nulo como nunca-próprio (design D1 e D3). Verificar: `npm run build` passa sem erro de tipo.
- [x] 1.2 Renderizar condicionalmente: quando o usuário em edição for o próprio logado, omitir o bloco inteiro (`Separator` + seção `Ações do usuário`), mantendo perfil, nome e e-mail e o rodapé `Voltar`/`Salvar`; os estados de redefinição ficam inalcançáveis nesse caso (design D2). Verificar: em `npm run dev`, abrir a modal do próprio usuário na página Usuários — a seção não aparece, `Salvar` grava perfil/nome/e-mail e a modal fecha.

## 2. Validação de comportamento e change

- [x] 2.1 Conferir a modal de outro usuário: seção `Ações do usuário` intacta, com `Redefinir senha` (modo exclusivo, cancelar e confirmar) e `Inativar`/`Reativar` funcionando como antes. Verificar: comportamento observado igual ao atual, sem regressão.
- [x] 2.2 Rodar `openspec validate --change user-nao-altera` e `npm run build`. Verificar: validação do change sem erros e build limpo.
