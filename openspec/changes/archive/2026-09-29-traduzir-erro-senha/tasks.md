# Tasks

## 1. Tradutor de erros do Auth

- [x] 1.1 Adicionar a entrada `weak_password` ao mapa `MENSAGENS_AUTH` em `src/lib/formato.ts` com a mensagem fixa do design D1 ("A senha deve ter ao menos 6 caracteres e conter pelo menos uma letra minúscula, uma maiúscula, um dígito e um símbolo.") e verificar que `npm run build` passa sem erros.

## 2. Dica de política nos formulários

- [x] 2.1 Em `src/routes/usuarios/minha-senha.tsx`, incluir o texto de apoio "Mínimo 6 caracteres, com minúscula, maiúscula, dígito e símbolo." junto ao campo de nova senha e verificar no navegador que a dica aparece, com `npm run build` passando.

- [x] 2.2 Em `src/routes/usuarios/usuarios.tsx`, estender a descrição do diálogo "Novo usuário" para citar as quatro classes e incluir a mesma dica junto ao campo de nova senha da redefinição na modal de edição, verificando no navegador que as duas dicas aparecem, com `npm run build` passando.

## 3. Edge Function admin-usuarios

- [x] 3.1 Obter o código vigente da função via MCP Supabase (`get_edge_function`), tratar nas ações `criar` e `redefinirSenha` o erro do Auth com `code === 'weak_password'` respondendo `HttpError(400, mensagem fixa)` em vez de interpolar `erro.message`, atualizar o comentário defasado sobre a política pendente no console, implantar a versão nova exclusivamente via MCP Supabase (`deploy_edge_function`) e confirmar em `list_edge_functions` o incremento de versão.

## 4. Verificação integrada

- [x] 4.1 Executar o roteiro manual do design D4 no navegador: senha fora da política nas três telas ("Minha senha", criar usuário, redefinir senha) exibe a mensagem em português sem texto cru; credencial atual errada e nova senha igual à atual mantêm suas mensagens específicas; troca, criação e redefinição válidas funcionam; dica visível nos três formulários.

- [x] 4.2 Confirmar com sonda à API Auth do projeto (senha curta com as quatro classes, rejeitada sem criar recurso) que a política vigente segue declarada corretamente na mensagem fixa.
