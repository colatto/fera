# Design

## Context

Estado verificado na exploração: `btree_gist` 1.7 instalada no schema `public` do projeto remoto Supabase; 0 índices GiST no schema público, 0 constraints de exclusão e 0 objetos dependentes em todo o banco (as únicas dependências são linhas internas de catálogo `pg_amop`/`pg_amproc` da própria extensão). `banco.sql:5` declara `create extension if not exists btree_gist;` desde o primeiro commit. Restrição do projeto: toda alteração remota ocorre exclusivamente via MCP Supabase; `banco.sql` é referência declarativa, não mecanismo de deploy.

## Goals / Non-Goals

**Goals:**

- Derrubar a extensão no remoto e retirar sua declaração de `banco.sql` na mesma mudança, sem `CASCADE`.
- Validar, antes e depois, que nenhum objeto do remoto depende dela e que o schema permanece intacto.
- Deixar registrado o critério de reintrodução (spec `referencia-banco`).

**Non-Goals:**

- Não realocar a extensão para o schema `extensions` (convenção Supabase): preservar peso morto não justifica o trabalho.
- Não revisar as demais extensões instaladas (`pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`): as duas últimas são defaults da plataforma; as primeiras são convenção Supabase e ficam fora do escopo desta mudança.
- Não alterar nenhum outro objeto do schema (tabelas, funções, views, RLS, policies, dados).

## Decisions

1. **Drop sem `CASCADE`.** Nada depende da extensão, e `CASCADE` é perigoso como hábito: esconde dependências inesperadas. Se o drop falhar por dependência, a operação para e a dependência é tratada em mudança própria. Alternativa (`CASCADE` direto) descartada.
2. **Derrubar em vez de realocar.** Mover a extensão para o schema `extensions` (`alter extension btree_gist set schema extensions;`) a colocaria na convenção certa, mas manteria uma extensão sem uso. Como o custo de recolocá-la no futuro é um comando, remover é a escolha de menor peso.
3. **Duas pontas na mesma mudança.** Drop no remoto via MCP e remoção da linha de `banco.sql` caminham juntos: fazer só uma das pontas cria drift (extensão órfã no remoto, ou referência declarando algo que não existe). Ordem escolhida: re-checar dependências → drop remoto → validar remoto → editar `banco.sql` → commit; a janela de divergência fecha com o arquivo coerente com o estado já observado no remoto.
4. **Reintrodução explícita.** Se uma evolução futura exigir constraint de exclusão ou índice GiST sobre tipo escalar, a extensão volta via MCP e a declaração volta a `banco.sql` na mesma mudança, antes do objeto dependente — já contratado no spec `referencia-banco`.

## Risks / Trade-offs

- [Dependência oculta descoberta no momento do drop] → Re-executar a checagem de dependências imediatamente antes do drop; sem `CASCADE`, o drop falha ruidosamente sem quebrar nada.
- [Uma extensão a menos disponível para evoluções futuras] → Recriar é um comando via MCP; critério registrado no spec.
- [Confusão com as ~484 dependências internas de catálogo que aparecem em consultas a `pg_depend`] → São a fiação `pg_amop`/`pg_amproc` da própria extensão, não objetos do projeto; documentado aqui para não bloquear a validação.

## Migration Plan

1. Re-checar no remoto (via MCP): 0 índices GiST, 0 constraints de exclusão, 0 objetos dependentes da extensão.
2. `drop extension btree_gist;` via MCP Supabase, sem `CASCADE`.
3. Validar no remoto: extensão ausente da lista de instaladas; objetos do schema `public` inalterados.
4. Remover a linha 5 de `banco.sql` e commitar.
5. Rollback, se necessário: `create extension btree_gist;` via MCP e restaurar a linha em `banco.sql`.
