## ADDED Requirements

### Requirement: Unicidade do número da ordem de compra
Cada ordem de compra MUST ter `numero` único no sistema, e o registro de uma nova ordem de compra (`registrar_ordem_compra`) com número já existente MUST falhar transacionalmente sem criar a ordem nem alterar o projeto. O número MUST ser armazenado sem espaços nas pontas; tentativa de registrar número com espaços nas pontas MUST falhar transacionalmente. A falha MUST ser exibida na interface como mensagem amigável que identifique o número duplicado, sem alterar o estado exibido. Vincular uma ordem de compra já existente a outro projeto (`vincular_ordem_compra`) MUST continuar permitido, pois o reuso de uma mesma OC por vários projetos ocorre pela vinculação, não pelo registro de nova OC.

#### Scenario: Registro de OC com número inédito
- **WHEN** o ADM registra uma nova OC com número que não existe no sistema
- **THEN** a OC é criada e vinculada ao projeto conforme o fluxo atual

#### Scenario: Registro de OC com número duplicado
- **WHEN** o ADM registra uma nova OC com número igual ao de uma OC já existente
- **THEN** a operação falha transacionalmente, nenhuma OC é criada, e a interface exibe mensagem amigável indicando que já existe ordem de compra com aquele número

#### Scenario: Número com espaços nas pontas
- **WHEN** uma chamada à RPC `registrar_ordem_compra` recebe número com espaços no início ou no fim
- **THEN** a operação falha transacionalmente e nenhuma OC é criada

#### Scenario: Reuso de OC existente por outro projeto
- **WHEN** o ADM vincula, pelo modo "Vincular existente", uma OC já registrada a outro projeto
- **THEN** a vinculação ocorre normalmente, sem exigir registro de nova OC
