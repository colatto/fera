# Pendências operacionais — gestao-usuarios

Registro dos itens que ficam fora do alcance das ferramentas MCP atuais (configuração
do Auth no console/Management API do Supabase) e dos artefatos deixados no remoto
pela validação.

## 1. Configuração do Auth (console/Management API)

A fazer pelo ADM no projeto remoto `wgdlazhrcyqmbvhaindq`:

- [x] **Exigência de reautenticação para troca de senha** (`update password require
  reauthentication`) — configurada pelo ADM e **validada**: sessão com mais de 24h
  sem nonce recebe `400 reauthentication_needed` e a senha anterior permanece válida;
  com sign-in recente (credencial comprovada) a troca é aceita. Observação do
  comportamento nativo do GoTrue: a comprovação da credencial vale para a sessão
  inteira por até 24h — depois disso é exigido o OTP de reautenticação (enviado por
  e-mail, ver item 3).
- [ ] **Definir política de senha** no Auth (comprimento mínimo etc.) — pendência
  arrastada de `autenticacao-sessao`; a Edge Function valida piso de 6 caracteres em
  `criar` e `redefinir_senha` no ínterim.
- [ ] **Desabilitar o sign-up público** e **ativar a proteção de senha vazada**
  (HaveIBeenPwned) — pendências arrastadas de `autenticacao-sessao` (ainda apontadas
  pelo security advisor).

## 2. Resgate de emergência (procedimento de console)

- A salvaguarda do banco (`fn_garantir_adm_ativo`) nega, por construção, a inativação
  e o rebaixamento do último ADM ativo em **qualquer** via de escrita. Se um dia houver
  necessidade legítima de resgate (ex.: único ADM perdou a senha), o desbloqueio é
  procedimento manual no console/SQL do projeto (desativar o trigger, operar,
  reativá-lo) — deliberadamente não existe caminho automatizado.

## 3. Artefatos da validação (deixados no projeto remoto)

- Edge Function `admin-usuarios` está na **v3** (`verify_jwt` ativo; service_role só
  nos segredos do runtime). v2 teve o mesmo deploy com uma revogação de sessão
  redundante que foi corrigida: a própria Admin API revoga todas as sessões ao gravar
  senha nova (`updateUserById` com `password`), numa única transação.
- Usuários de teste criados e **inativados** (banidos, sessões revogadas) ao final:
  - `valida.oper3@fera.teste` (OPER) — cobriu redefinição, troca própria e negações.
  - `valida.adm3@fera.teste` (ADM) — cobriu a salvaguarda com segundo ADM.
  Suas senhas de validação foram descartadas; reativação, se desejada, pela ação
  `reativar` com um ADM ativo.
- Limitação da validação da troca própria: o ramo do OTP de reautenticação
  (`POST /reauthenticate` → código por e-mail → `updateUser` com nonce) não pôde ser
  exercido ponta a ponta porque os fixtures usam domínio `@fera.teste`, sem caixa
  postal alcançável. A negação sem nonce (sessão >24h) veio exatamente do ramo que
  verificaria o OTP, que portanto está armado; a troca com credencial comprovada
  (sign-in recente) foi validada ponta a ponta.
- `oper.validacao2@fera.teste` (inativo, de `autenticacao-sessao`) teve a senha
  redefinida durante o teste "redefinição não restaura inativo"; segue inativo e banido.
- Estado final de `public.usuario`: `colatto@live.com` (ADM) e `hello@ruatrez.com`
  (OPER) ativos; os demais quatro inativos. Nenhum schema, dado de negócio ou
  configuração além dos descritos foi alterado.

## 4. Advisors não tratados (fora do escopo desta change)

Apontamentos pré-existentes, já registrados ou deliberados, que **não** decorrem
destas alterações:

- `security_definer_view` (ERROR) para as views administrativas/operacionais — padrão
  deliberado do projeto, aceito no registro de `autenticacao-sessao` (retornam conjunto
  vazio para não-ADM).
- `function_search_path_mutable` (WARN) para `fn_atualizar_timestamp`,
  `fn_impedir_edicao_evento` e `fn_proteger_projeto` — pré-existentes. A função nova
  `fn_garantir_adm_ativo` recebeu `set search_path = public` nesta change (decorrência
  tratada); as antigas seguem como dívida anterior, não ampliada.
- `auth_rls_initplan` (WARN) na policy `usuario_leitura`, `auth_leaked_password_protection`
  (WARN), FKs sem índice e índices sem uso (INFO) — pré-existentes, nenhuma relação com
  o gatilho/Edge Function desta change.
