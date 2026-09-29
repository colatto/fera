# Tasks

## 1. Constraint no Supabase remoto (via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto; se indisponível, interromper a operação remota e reportar o bloqueio (regra do projeto — nenhum caminho alternativo local). Verificação: listagem do projeto ativo no MCP antes de qualquer SQL.
- [x] 1.2 No remoto, executar via MCP Supabase a troca da constraint: `alter table public.cliente drop constraint cliente_cnpj_formato;` e `alter table public.cliente add constraint cliente_cnpj_formato check (cnpj is null or cnpj ~ '^[0-9A-EHJ-NPR-TV-Z]{12}[0-9]{2}$');`. Verificação: `select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'cliente_cnpj_formato';` retorna a definição com a regex nova.

## 2. Referência declarativa e código

- [x] 2.1 Atualizar `banco.sql:17` com a mesma regex da constraint do remoto. Verificação: `grep -n "0-9A-EHJ-NPR-TV-Z" banco.sql` encontra a linha da `cliente_cnpj_formato` e nenhuma outra linha do arquivo mudou (`git diff banco.sql`).
- [x] 2.2 Atualizar `src/routes/cadastros/cadastros-clientes.tsx`: filtro do `onChange` converte para maiúsculas (`toUpperCase`) e valida contra `^[0-9A-EHJ-NPR-TV-Z]{0,14}$` (renomear `apenasDigitosCnpj`), remover `inputMode="numeric"`, ajustar placeholder, descrição do diálogo e mensagem de `validarCliente` para o formato alfanumérico (14 caracteres, letras maiúsculas exceto I/O/U/Q/F nas 12 primeiras posições, dois dígitos no final). Verificação: `npm run build` passa.
- [x] 2.3 Adicionar entrada `cliente_cnpj_formato` em `MENSAGENS_CONSTRAINT` (`src/lib/formato.ts`) com mensagem em português sobre o formato inválido. Verificação: `npm run build` passa.

## 3. Validação integrada (front + remoto)

- [x] 3.1 Executar a matriz manual com o app em `npm run dev`, logado como ADM em Clientes, cobrindo os cenários da spec: digitar `12ABC34501DE35` e salvar (gravado); digitar minúsculas `12abc34501de35` (campo exibe maiúsculas); digitar `O`, `I`, `U`, `Q`, `F` (não entram no campo); colar `12.345.678/0001-95` (nada entra); salvar com 13 caracteres (bloqueado com a mensagem nova); salvar CNPJ duplicado (mensagem traduzida existente, sem texto cru). Verificação: comportamento observado igual aos cenários da delta de `cadastros-basicos`.
- [x] 3.2 Limpar os resíduos do teste via MCP Supabase (excluir registros de cliente criados na matriz) e confirmar coerência final remoto ↔ `banco.sql` (`pg_get_constraintdef` no remoto igual à linha do arquivo). Verificação: consulta no remoto e `git diff` fecham com a regex `^[0-9A-EHJ-NPR-TV-Z]{12}[0-9]{2}$`.
