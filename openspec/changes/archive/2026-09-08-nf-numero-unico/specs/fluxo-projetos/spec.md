## ADDED Requirements

### Requirement: Unicidade do número da nota fiscal
Cada nota fiscal MUST ter `numero` único no sistema, e o registro de nota fiscal (`registrar_nota_fiscal`) com número já existente — inclusive em projeto diferente — MUST falhar transacionalmente sem criar a nota nem alterar o projeto. O número MUST ser armazenado sem espaços nas pontas; tentativa de registrar número com espaços nas pontas MUST falhar transacionalmente. A falha MUST ser exibida na interface como mensagem amigável que identifique o número duplicado, sem alterar o estado exibido do projeto.

#### Scenario: Registro de nota com número inédito
- **WHEN** o ADM registra uma nota fiscal com número que não existe no sistema
- **THEN** a nota é criada e o fluxo segue como hoje: status passa a `NOTA_EMITIDA` com evento na linha do tempo

#### Scenario: Registro de nota com número duplicado em outro projeto
- **WHEN** o ADM registra uma nota fiscal com número igual ao de uma nota já existente em outro projeto
- **THEN** a operação falha transacionalmente, nenhuma nota é criada, o projeto permanece em `AUTORIZADO_FATURAMENTO`, e a interface exibe mensagem amigável indicando que já existe nota fiscal com aquele número

#### Scenario: Número com espaços nas pontas
- **WHEN** uma chamada à RPC `registrar_nota_fiscal` recebe número com espaços no início ou no fim
- **THEN** a operação falha transacionalmente e nenhuma nota é criada
