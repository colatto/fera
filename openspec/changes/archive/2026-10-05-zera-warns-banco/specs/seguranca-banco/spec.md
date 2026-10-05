# Spec Delta

## Purpose

Definir as convenções de segurança das funções e views expostas pelo banco PostgreSQL do Supabase: `search_path` fixado nas funções, RPCs administrativas inacessíveis a chamadores não autenticados, e views de leitura `SECURITY DEFINER` com guarda de perfil como exceção documentada do modelo de acesso.

## ADDED Requirements

### Requirement: Funções com search_path fixado

Toda função SQL ou PL/pgSQL no banco MUST declarar `search_path` fixo — vazio quando o corpo não resolver nomes de objetos, ou a lista explícita de schemas necessários — de modo que a resolução de nomes não dependa da configuração ou do papel de quem a invoca. O estado declarado em `banco.sql` MUST refletir o `search_path` fixo de cada função.

#### Scenario: Linter não aponta search_path mutável

- **WHEN** o Security Advisor do Supabase é executado
- **THEN** o lint `function_search_path_mutable` não retorna nenhum achado para funções do schema `public`

#### Scenario: Trigger protege e carrega como antes

- **WHEN** um `UPDATE` em `projeto` tenta alterar `numero` ou `codigo_pasta`
- **THEN** a operação é recusada com a exceção de proteção, e um `UPDATE` ordinário continua atualizando `atualizado_em` via trigger

### Requirement: Funções administrativas inacessíveis a não autenticados

Toda função `SECURITY DEFINER` de escrita administrativa MUST ter o privilégio `EXECUTE` concedido somente a papéis autenticados (`authenticated`, `service_role`, `postgres`) e MUST NOT ser executável por `PUBLIC` ou `anon`. O estado declarado em `banco.sql` MUST explicitar essa revogação.

#### Scenario: Linter não aponta função executável por anon

- **WHEN** o Security Advisor do Supabase é executado
- **THEN** o lint `anon_security_definer_function_executable` não retorna nenhum achado

#### Scenario: Chamada anônima é recusada sem gravar nada

- **WHEN** um cliente não autenticado invoca uma função administrativa de escrita via `/rest/v1/rpc`
- **THEN** a requisição é recusada por falta de privilégio e nenhum dado é gravado

#### Scenario: ADM autenticado continua executando

- **WHEN** um usuário autenticado com perfil ADM invoca uma função administrativa de escrita
- **THEN** a função executa normalmente, sujeita à guarda interna de perfil

### Requirement: Views de leitura SECURITY DEFINER com guarda de perfil

As views de leitura expostas no schema `public` são aceitas como `SECURITY DEFINER` — excedendo o RLS das tabelas base — desde que cada view: contenha guarda de perfil (`usuario_adm()` ou `usuario_ativo()`) restringindo linhas; mascare por perfil as colunas que não devem ser vistas por não administradores; e esteja declarada em `banco.sql` com `grant select` a `authenticated`. View nova de leitura MUST nascer com a guarda e view de leitura que perder todo uso (sem referência em specs, código do frontend ou dependências no banco) MUST ser derrubada no remoto e removida de `banco.sql` na mesma mudança.

#### Scenario: Chamador sem perfil autorizado não vê linhas

- **WHEN** um chamador não autenticado ou sem perfil autorizado consulta uma view de leitura guardada por `usuario_adm()` ou `usuario_ativo()`
- **THEN** a consulta retorna zero linhas

#### Scenario: Coluna sensível mascarada para não administrador

- **WHEN** um usuário OPER consulta `v_eventos_operacionais`
- **THEN** a coluna `detalhes` vem nula, enquanto para ADM ela traz o conteúdo

#### Scenario: View sem uso sai do banco e da referência

- **WHEN** uma view de leitura deixa de ter referência em specs, código do frontend ou dependências no banco
- **THEN** ela é derrubada no remoto via MCP Supabase e removida de `banco.sql` na mesma mudança, sem `CASCADE`
