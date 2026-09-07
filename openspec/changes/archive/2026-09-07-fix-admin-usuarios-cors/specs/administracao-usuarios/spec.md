## ADDED Requirements

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
