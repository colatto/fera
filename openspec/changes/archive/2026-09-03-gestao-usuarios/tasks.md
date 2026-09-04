## 1. Banco — salvaguarda de ADM ativo (via MCP Supabase)

- [x] 1.1 Aplicar migration no projeto remoto: função `public.fn_garantir_adm_ativo` (`before update` em `public.usuario`) que, ao tirar um ADM (perfil `ADM`→`OPER` ou `ativo true`→`false`), trava os demais ADM ativos (`for update`) e falha se nenhum restar
- [x] 1.2 Atualizar `banco.sql` como referência declarativa versionada (função + trigger), sem alterar as demais seções

## 2. Edge Function `admin-usuarios` v2 (via MCP Supabase)

- [x] 2.1 Implementar ação `redefinir_senha`: valida chamador ativo e `ADM`, alvo existente em `public.usuario` e senha (comprimento mínimo); grava a senha pela Admin API (`updateUserById`) e revoga as sessões do alvo (`signOut`), na ordem senha → revogação, idempotente para retry, sem alterar `ativo`
- [x] 2.2 Pré-checar a salvaguarda nas ações `inativar` e `alterar` (perfil): negar antes de qualquer chamada ao Auth se a operação deixaria o sistema sem ADM ativo, incluindo auto-operações
- [x] 2.3 Fazer o deploy da nova versão com `verify_jwt` ativo e credencial de serviço confinada aos segredos da function

## 3. Validação ponta a ponta no remoto (via MCP Supabase)

- [x] 3.1 Redefinição: ADM redefine senha de usuário ativo — sessões revogadas, senha antiga falha e nova funciona; redefinição de inativo não restaura acesso; chamada de não-ADM é negada
- [x] 3.2 Troca própria: usuário ativo altera a própria senha pelo fluxo nativo do Auth — login vale com a nova senha e perfil/nome/e-mail/status ficam inalterados; sem comprovação da credencial atual a troca é negada
- [x] 3.3 Salvaguarda: inativação e rebaixamento do último ADM ativo falham pela Edge Function e também por update direto com `service_role` (trigger); com um segundo ADM ativo, as mesmas operações são executadas
- [x] 3.4 Inativar ao final os usuários de teste criados na validação, deixando registrados os artefatos deixados no remoto

## 4. Encerramento

- [x] 4.1 Verificar os advisors de segurança e desempenho do projeto via MCP e tratar o que for decorrente destas alterações
- [x] 4.2 Atualizar o registro de pendências operacionais (política de senha no console do Auth permanece pendência; resgate de emergência por console em caso de trigger negar operação)
