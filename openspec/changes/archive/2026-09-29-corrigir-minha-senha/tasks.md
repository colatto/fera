# Tasks

## 1. Tradutor de erros do Auth

- [x] 1.1 Em `mensagemDeErro` (`src/lib/formato.ts`), adicionar ramo chaveado por `erro.code` (o auth-js copia o `error_code` do servidor para `AuthApiError.code`) com o mapa: `current_password_invalid` e `current_password_required` → "Credencial atual não comprovada. Verifique a senha atual."; `same_password` → "A nova senha deve ser diferente da senha atual." (design D2/D3). O caminho atual (constraints Postgres, `error.message`, "Erro inesperado") permanece intacto para códigos fora do mapa. Verificar: `npm run build` compila sem erros.

## 2. Fluxo da troca de senha

- [x] 2.1 Em `submeter()` (`src/routes/usuarios/minha-senha.tsx`), remover o bloco de comprovação `signInWithPassword` (e seu toast) e fazer chamada única `supabase.auth.updateUser({ password: novaSenha, current_password: senhaAtual })` (design D1); o erro segue para `mensagemDeErro`, que agora exibe as mensagens em português. Atualizar o comentário de cabeçalho (referência ao design D6 arquivado) para registrar a comprovação server-side. Verificar: `npm run build` compila sem erros.

## 3. Verificação integrada

- [x] 3.1 Roteiro manual no navegador (`npm run dev`, conta OPER): (a) credencial atual errada → toast "Credencial atual não comprovada. Verifique a senha atual." e senha anterior mantida; (b) nova senha igual à atual → toast "A nova senha deve ser diferente da senha atual."; (c) troca válida → login passa a valer com a senha nova e nome/perfil permanecem na tela; (d) botão segue desabilitado com nova senha abaixo de 6 caracteres. Se (c) for executada com as credenciais do `.env`, restaurar a senha original em seguida (nova troca revertendo, ou redefinição pelo ADM) para manter o `.env` válido.
