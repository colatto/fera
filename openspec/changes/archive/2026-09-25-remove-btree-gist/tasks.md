# Tasks

## 1. Remoto — verificação prévia (via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto e que `btree_gist` consta como instalada (schema `public`, versão 1.7); verificar: a lista de extensões do MCP mostra `btree_gist` com `installed_version` preenchido e schema `public`
- [x] 1.2 Re-checar dependências no remoto: 0 índices GiST no schema `public`, 0 constraints de exclusão no schema `public`, 0 objetos dependentes da extensão fora de sua fiação interna de catálogo (`pg_amop`/`pg_amproc`); verificar: as três consultas retornam 0 e as linhas de `pg_amop`/`pg_amproc` são apenas a fiação interna documentada no design

## 2. Remoto — derrubar a extensão

- [x] 2.1 Executar `drop extension btree_gist;` via MCP, sem `CASCADE`; verificar: o comando conclui sem erro e, em caso de falha por dependência, a operação é interrompida sem `CASCADE` e reportada conforme o spec `referencia-banco`
- [x] 2.2 Validar o remoto após o drop: extensão ausente da lista de instaladas e objetos do schema `public` intactos; verificar: `btree_gist` não aparece nas extensões instaladas e a contagem de tabelas, views, funções, índices e policies do schema `public` é igual à do pré-drop

## 3. Referência declarativa — banco.sql

- [x] 3.1 Remover a linha `create extension if not exists btree_gist;` de `banco.sql` e commitar; verificar: `grep -n "btree_gist" banco.sql` não retorna nada e `git diff` mostra somente essa remoção

## 4. Verificação final de coerência

- [x] 4.1 Conferir as duas pontas na mesma mudança — remoto sem `btree_gist` e `banco.sql` sem a declaração — e validar o change; verificar: `openspec validate remove-btree-gist` passa e o cenário "Extensão sem dependente sai do ar e da referência" do spec `referencia-banco` está satisfeito
