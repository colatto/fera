## ADDED Requirements

### Requirement: Valor da nota fiscal derivado do projeto
O registro de nota fiscal MUST usar exclusivamente o valor do projeto: a RPC `registrar_nota_fiscal` MUST derivar o valor da nota de `projeto.valor` e MUST NOT aceitar valor informado pelo cliente (nenhuma assinatura da RPC recebe parâmetro de valor). A nota criada MUST ficar com valor igual ao valor gravado do projeto. O diálogo "Registrar nota fiscal" MUST exibir o valor do projeto como texto somente leitura, formatado em moeda, e MUST NOT oferecer campo editável de valor; a habilitação do registro MUST depender apenas de número e data de emissão preenchidos. As regras existentes do registro (exigir ADM, exigir status `AUTORIZADO_FATURAMENTO`, unicidade do número, transição para `NOTA_EMITIDA` com evento) permanecem inalteradas.

#### Scenario: Diálogo exibe o valor do projeto como somente leitura
- **WHEN** o ADM abre o diálogo "Registrar nota fiscal" em um projeto autorizado
- **THEN** o diálogo exibe o valor do projeto como texto formatado em moeda, não oferece campo editável de valor, e o botão de registro habilita com número e data de emissão preenchidos

#### Scenario: Nota registrada fica com o valor do projeto
- **WHEN** o ADM registra uma nota fiscal com número e data válidos
- **THEN** a nota é criada com valor igual ao valor gravado do projeto, o status passa a `NOTA_EMITIDA` e a linha do tempo exibe a nota com esse valor e a previsão de recebimento

#### Scenario: RPC não aceita valor do cliente
- **WHEN** uma chamada à RPC `registrar_nota_fiscal` tenta informar um argumento de valor
- **THEN** a chamada falha por ausência de assinatura compatível e nenhuma nota é criada, permanecendo o projeto em `AUTORIZADO_FATURAMENTO`

#### Scenario: Recebimentos limitados ao valor do projeto
- **WHEN** a nota derivada do projeto está emitida e o ADM lança recebimentos até a quitação
- **THEN** o total recebido não pode exceder o valor do projeto, e a parcela que o atinge integralmente transiciona o projeto para `PAGO`
