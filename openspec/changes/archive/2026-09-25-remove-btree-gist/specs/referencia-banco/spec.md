# Spec Delta

## Purpose

Define a coerência entre a referência declarativa `banco.sql` e o projeto remoto Supabase quanto às extensões PostgreSQL instaladas: extensão só é declarada e instalada quando algum objeto do banco a exige.

## ADDED Requirements

### Requirement: Extensão declarada somente com dependente

A referência declarativa `banco.sql` MUST declarar somente extensões PostgreSQL que possuam ao menos um objeto dependente no banco — índice, constraint de exclusão, tipo ou função que as exija. O conjunto de extensões instaladas no remoto MUST permanecer coerente com o que `banco.sql` declara: derrubar uma extensão no remoto MUST vir acompanhado da remoção de sua declaração em `banco.sql` na mesma mudança, e o inverso também vale. A remoção de uma extensão MUST NOT usar `CASCADE` e MUST NOT remover objetos dependentes; se o drop falhar por dependência, a extensão permanece instalada e declarada até que a mudança que elimina a dependência seja concluída.

#### Scenario: Extensão sem dependente sai do ar e da referência

- **WHEN** a extensão `btree_gist` for derrubada no remoto via MCP Supabase
- **THEN** o remoto deixa de listá-la como instalada, `banco.sql` deixa de conter `create extension ... btree_gist`, e nenhuma tabela, view, função, índice, constraint, policy ou dado existente é alterado

#### Scenario: Remoção com dependência não usa CASCADE

- **WHEN** um drop de extensão falhar porque algum objeto depende dela
- **THEN** a operação é interrompida sem `CASCADE`, nenhum objeto dependente é removido, e a extensão permanece instalada e declarada em `banco.sql` até que a dependência seja eliminada em mudança própria

### Requirement: Reintrodução guiada por necessidade

Quando uma evolução do schema exigir recursos providos por uma extensão ausente — por exemplo, constraint de exclusão ou índice GiST sobre tipo escalar, que exigiria `btree_gist` — a extensão MUST ser criada no remoto via MCP Supabase e declarada em `banco.sql` na mesma mudança, antes do objeto dependente entrar em vigor.

#### Scenario: Necessidade futura de btree_gist

- **WHEN** uma evolução do schema precisar de constraint de exclusão ou índice GiST sobre tipo escalar
- **THEN** `btree_gist` é criada no remoto via MCP e a linha correspondente volta a `banco.sql` na mesma mudança, e somente depois o objeto dependente é criado
