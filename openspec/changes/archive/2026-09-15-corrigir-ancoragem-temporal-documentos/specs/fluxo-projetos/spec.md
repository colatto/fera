## ADDED Requirements

### Requirement: Datas de negócio com default no fuso local
Os diálogos do fluxo que pré-preenchem uma data de negócio (ordem de compra, nota fiscal e recebimentos em lote) MUST usar como default a data corrente no fuso local do usuário e MUST NOT derivar esse default de uma representação UTC; o valor informado pelo usuário prevalece sobre o default.

#### Scenario: Registro de OC no fim da noite
- **WHEN** o ADM abre o modo "Registrar nova" do diálogo de ordem de compra entre 21h e meia-noite no fuso local
- **THEN** a data pré-preenchida é a data corrente local, e não a data de amanhã

#### Scenario: Defaults dos demais diálogos de data
- **WHEN** o ADM abre os diálogos de nota fiscal e de recebimentos em lote
- **THEN** as datas pré-preenchidas também correspondem à data corrente local

#### Scenario: Valor informado prevalece
- **WHEN** o ADM altera a data pré-preenchida antes de confirmar
- **THEN** a data alterada é a gravada, sem sobreposição pelo default
