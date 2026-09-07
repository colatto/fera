## Purpose

Define a interface de administração de usuários pelo ADM — criação, alteração, inativação/reativação e redefinição de senha pela Edge Function `admin-usuarios` — e a troca da própria senha pelo Supabase Auth, mantendo a credencial de serviço confinada ao backend.

## Requirements

### Requirement: Listagem de manutenção
A interface MUST oferecer ao ADM a listagem de usuários conforme `v_usuarios_manutencao`, com ativos e inativos, perfil, nome e e-mail; a tela MUST ser exclusiva da navegação de ADM.

#### Scenario: ADM lista usuários
- **WHEN** o ADM abre a administração de usuários
- **THEN** retornam usuários ativos e inativos com perfil, nome e e-mail

### Requirement: Criação de usuário com senha inicial
A interface MUST permitir ao ADM criar usuário informando perfil (`ADM`/`OPER`), nome, e-mail e senha inicial de no mínimo 6 caracteres, enviando a ação `criar`; a senha inicial transita somente na chamada autenticada da Edge Function e a interface MUST NOT retê-la após a operação. Erros retornados — e-mail duplicado, validação — MUST ser exibidos com a mensagem da função.

#### Scenario: Criação válida
- **WHEN** o ADM cria usuário com dados válidos
- **THEN** o usuário aparece na listagem como ativo e consegue autenticar-se com a senha inicial

#### Scenario: E-mail duplicado
- **WHEN** o ADM cria usuário com e-mail já cadastrado
- **THEN** a interface exibe a mensagem de conflito retornada e nenhum usuário é criado

### Requirement: Alteração de perfil e dados cadastrais
A interface MUST permitir ao ADM alterar perfil, nome e e-mail de um usuário pela ação `alterar`; a negação da salvaguarda de último ADM ativo MUST ser exibida sem produzir efeito.

#### Scenario: Alteração válida
- **WHEN** o ADM altera o perfil de um usuário de `OPER` para `ADM`
- **THEN** a listagem reflete o novo perfil e o acesso do usuário passa a seguir o perfil novo

#### Scenario: Rebaixamento do último ADM negado
- **WHEN** o ADM rebaixa para `OPER` o único ADM ativo
- **THEN** a função nega a operação e a interface exibe o motivo, mantendo o perfil `ADM`

### Requirement: Inativação e reativação
A interface MUST permitir ao ADM inativar e reativar usuários pelas ações `inativar` e `reativar`; a inativação revoga imediatamente as sessões do usuário-alvo, e a negação da salvaguarda de último ADM ativo MUST ser exibida sem efeito.

#### Scenario: Inativação derruba sessão
- **WHEN** o ADM inativa um usuário autenticado
- **THEN** a aplicação do usuário-alvo perde a sessão e volta ao login, e ele retorna à listagem como inativo

#### Scenario: Inativação do último ADM negada
- **WHEN** o ADM inativa a si mesmo sendo o único ADM ativo
- **THEN** a função nega a operação e a interface exibe o motivo, mantendo-o ativo

### Requirement: Redefinição de senha pelo ADM
A interface MUST permitir ao ADM redefinir a senha de qualquer usuário pela ação `redefinir_senha`, informando a nova senha com no mínimo 6 caracteres; a redefinição revoga as sessões do usuário-alvo e não restaura o acesso de usuário inativo. A interface MUST usar exclusivamente a sessão ADM autenticada — a credencial de serviço MUST NOT existir no cliente.

#### Scenario: Redefinição em usuário ativo
- **WHEN** o ADM redefine a senha de um usuário ativo
- **THEN** as sessões do alvo são revogadas e o login passa a valer somente com a senha nova

#### Scenario: Redefinição não reativa inativo
- **WHEN** o ADM redefine a senha de um usuário inativo
- **THEN** a senha nova é gravada e o usuário continua sem acessar enquanto estiver inativo

### Requirement: Troca da própria senha
A interface MUST permitir ao usuário autenticado ativo alterar a própria senha pelo Supabase Auth, informando a credencial atual; a troca MUST NOT alterar perfil, nome, e-mail ou status em `public.usuario`, e a recusa por credencial atual não comprovada MUST ser exibida.

#### Scenario: Troca válida
- **WHEN** o usuário ativo altera a própria senha informando a credencial atual correta
- **THEN** o login passa a valer com a senha nova e seus dados de perfil permanecem inalterados

#### Scenario: Credencial atual incorreta
- **WHEN** a troca é tentada sem comprovar a credencial atual
- **THEN** a operação é negada e a interface exibe a falha, mantendo a senha anterior

### Requirement: Invocação da Edge Function pelo navegador
A Edge Function `admin-usuarios` MUST ser invocável diretamente pelo navegador: requisições de verificação prévia (`OPTIONS`) MUST receber resposta de sucesso com headers de CORS que autorizem os cabeçalhos usados pela chamada autenticada (`Authorization`, `apikey`, `Content-Type`), e TODAS as respostas da função — de sucesso, de erro de validação, de guarda e de erro interno — MUST carregar header de origem permitida, de modo que o navegador consiga ler o corpo de qualquer resposta.

#### Scenario: Verificação prévia aceita
- **WHEN** o navegador envia a verificação prévia CORS antes de chamar a função
- **THEN** a função responde com status de sucesso e headers autorizando a chamada autenticada com `Authorization`, `apikey` e `Content-Type`

#### Scenario: Erro da função legível pelo navegador
- **WHEN** a função nega uma operação com erro de negócio (por exemplo, e-mail duplicado ou guarda de último ADM ativo)
- **THEN** a resposta de erro carrega header de origem permitida e o navegador consegue ler o corpo, permitindo à interface exibir a mensagem da função

### Requirement: Exibição de falha de comunicação
Quando a ação de administração falha por falha de comunicação — a requisição não obtém resposta da função (indisponibilidade, bloqueio de rede ou de política de origem) —, a interface MUST exibir mensagem amigável de falha de comunicação com o servidor, distinta das mensagens de erro devolvidas pela função; a mensagem bruta do SDK de transporte MUST NOT ser exibida ao usuário.

#### Scenario: Função inalcançável
- **WHEN** o ADM executa uma ação e a requisição não obtém resposta da função
- **THEN** a interface exibe mensagem de falha de comunicação com o servidor, sem detalhes brutos de transporte, e nenhum dado é alterado
