## 1. Banco de dados (via MCP Supabase)

- [x] 1.1 Atualizar no projeto remoto a função `alterar_status_projeto`: a transição para `CANCELADO` passa a exigir `v.status = 'CADASTRADO'` (além do motivo não vazio), com mensagem de erro específica para cancelamento em outro status (ver design.md, decisões 1 e 2)
- [x] 1.2 Atualizar `banco.sql` com a mesma definição da função (referência declarativa versionada)
- [x] 1.3 Validar no remoto: cancelar um projeto em `CADASTRADO` com motivo (sucesso, evento registrado) e tentar cancelar um projeto em `ENVIADO` ou avançado (falha com a mensagem específica, status e linha do tempo inalterados)

## 2. Frontend

- [x] 2.1 Em `src/routes/projetos/projeto-detalhe.tsx`, mover o botão "Cancelar projeto" para dentro do branch `status === "CADASTRADO"` (junto de "Enviar projeto"), removendo-o do bloco comum `!cancelado`

## 3. Verificação

- [x] 3.1 Rodar `npm run build` (typecheck + build) e confirmar que passa
- [x] 3.2 Conferir no detalhe do projeto: botão de cancelamento presente em `CADASTRADO`, ausente em `ENVIADO` e nos demais status, e fluxo de erro transacional exibindo a mensagem do banco
