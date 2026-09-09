## ADDED Requirements

### Requirement: Detalhes de eventos em linguagem natural na linha do tempo
A linha do tempo do detalhe do projeto MUST apresentar a descrição originada dos detalhes do evento em linguagem natural, derivada do tipo do evento, e MUST NOT exibir serialização JSON crua nem identificadores internos do banco (como o identificador do projeto anterior em eventos de substituição). Quando o tipo do evento não tiver humanização definida — hoje criação, substituição e alterações de status/cadastro — a descrição originada de detalhes MUST ser omitida, mantendo título, data e responsável. O motivo de cancelamento, quando presente, MUST ter precedência sobre a descrição de detalhes.

#### Scenario: Compatibilização de fundação marcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como verdadeira
- **THEN** a linha do tempo exibe o evento com descrição em linguagem natural indicando que a fundação foi marcada como compatibilizada, sem JSON cru

#### Scenario: Compatibilização de fundação desmarcada
- **WHEN** o ADM consulta o detalhe de um projeto que possui evento de compatibilização de fundação marcada como falsa
- **THEN** a linha do tempo exibe o evento com descrição distinta indicando a desmarcação, sem JSON cru

#### Scenario: Evento sem humanização definida
- **WHEN** a linha do tempo renderiza evento de criação, substituição ou tipo sem humanização definida
- **THEN** o evento é exibido sem descrição originada de detalhes, apenas com título, data e, quando presente, o responsável

#### Scenario: Nenhum JSON cru em nenhum perfil
- **WHEN** qualquer evento com detalhes é renderizado na linha do tempo, em qualquer perfil
- **THEN** a interface não exibe serialização JSON de detalhes nem identificadores internos do banco
