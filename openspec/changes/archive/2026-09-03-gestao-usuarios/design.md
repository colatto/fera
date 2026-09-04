## Context

A Edge Function `admin-usuarios` (v1, `verify_jwt` ativo) já executa `criar`, `inativar`, `reativar` e `alterar` com credencial de serviço confinada ao backend; `public.usuario` segue 1:1 com `auth.users`, com guardas `usuario_ativo()`/`usuario_adm()` governando RLS, views e RPCs. A senha é definida apenas na criação. Não existe regra impedindo que o último ADM ativo seja inativado ou rebaixado — e toda a administração de usuários depende de um chamador ADM ativo. Toda operação remota (schema, Auth, Edge Function, validação) acontece exclusivamente pelo MCP Supabase; `banco.sql` é apenas referência declarativa versionada.

## Goals / Non-Goals

**Goals:**
- Ciclo de senha pós-criação: redefinição pelo ADM via backend com revogação de sessão, e troca da própria senha pelo usuário ativo pelo fluxo nativo do Auth.
- Garantia em banco de que o sistema nunca fica sem ADM ativo, cobrindo qualquer via de escrita (inclusive `service_role`).

**Non-Goals:**
- Link/e-mail de redefinição de senha (depende de entrega de e-mail; a redefinição é direta pelo ADM).
- Definição da política de senha no console do Auth — pendência operacional já registrada em `autenticacao-sessao`.
- Alterar RLS, guardas, views, RPCs de negócio e as ações existentes além das salvaguardas adicionadas.

## Decisions

**1. Ação `redefinir_senha` na própria Edge Function `admin-usuarios`.**
Valida o chamador (ativo + `ADM`), valida alvo (existe em `public.usuario`) e senha (comprimento mínimo), grava a senha pela Admin API (`updateUserById`) e revoga as sessões do alvo (`signOut`), na ordem senha → revogação. Falha de revogação é reportada e o retry resolve (operação idempotente); a sessão residual vale só até expirar — a mesma janela aceita na inativação. Redefinir não mexe em `ativo`: usuário inativo com senha nova continua bloqueado por `usuario_ativo()`. Alternativas rejeitadas: `generateLink` por e-mail (acima, Non-Goals); function separada (repetiria guarda, segredo e deploy — mesma razão da decisão 5 de `autenticacao-sessao`).

**2. Troca da própria senha é fluxo nativo do Supabase Auth, no cliente.**
`updateUser` do Auth com a senha nova, exigindo a credencial atual do usuário conforme o próprio GoTrue; sem Edge Function, sem `service_role`, sem tocar `public.usuario` (perfil, nome, e-mail e status inalterados; e-mail continua idêntico nas duas pontas). Usuário inativo não chega a executar: suas sessões foram revogadas/banidas na inativação e novo login é negado. Alternativa rejeitada: ação de autoatendimento na Edge Function — ampliaria a superfície administrativa sem ganho.

**3. Salvaguarda de ADM ativo é trigger de restrição no banco, com pré-checagem na Edge Function.**
`fn_garantir_adm_ativo` como `before update` em `public.usuario`: se a transição tira um ADM (perfil `ADM`→`OPER` ou `ativo true`→`false`), trava as linhas dos demais ADM ativos (`for update`) e falha se nenhuma restante. O trigger vale para qualquer escritor — `service_role` ignora RLS, não triggers — mantendo o princípio do projeto de validar no banco, não na interface. A Edge Function repete a checagem antes de tocar o Auth em `inativar`/`alterar` (falhar cedo evita revogar sessão/banir e depois compensar), e o trigger permanece como defesa de profundidade para escritas diretas. O `for update` serializa corridas (dois ADM inativando-se simultaneamente). Alternativas rejeitadas: `check` (não referencia outras linhas); checagem somente na function (burlável por qualquer escrita `service_role`, contrariando a aceitação "validado no banco").

**4. `banco.sql` sincronizado como referência.**
Nova seção com a função e o trigger do item 3; sem valor novo de dado, sem mecanismo de deploy.

## Risks / Trade-offs

- [Revogação falhar depois da senha nova] → erro explícito ao chamador; retry idempotente; janela residual curta por natureza.
- [Corrida entre os dois últimos ADMs] → trigger serializa com `for update` sobre os demais ADM ativos.
- [Trigger negar operação em emergência real] → intencional: negar é melhor que lockout; resgate de emergência segue sendo procedimento de console (pendência operacional).
- [Política de senha ainda no console] → a function valida comprimento mínimo; a política efetiva permanece pendência registrada.
- [MCP Supabase indisponível] → operação remota interrompida e bloqueio reportado; nenhuma alternativa local.

## Migration Plan

1. Migration aditiva no remoto via MCP: função `fn_garantir_adm_ativo` + trigger em `public.usuario`; sincronizar `banco.sql`.
2. Deploy da v2 de `admin-usuarios` via MCP com `verify_jwt` ativo: ação `redefinir_senha` e pré-checagem de salvaguarda em `inativar`/`alterar`.
3. Validação ponta a ponta no remoto via MCP, cobrindo os cenários do delta spec (redefinição, troca própria, salvaguarda), com usuários de teste inativados ao final.
4. Rollback: alterações aditivas — remover trigger/function-objeto e redeployar a versão anterior da Edge Function; sem migração de dados.
