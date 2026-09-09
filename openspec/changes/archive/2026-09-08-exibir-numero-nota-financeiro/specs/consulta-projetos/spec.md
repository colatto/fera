## ADDED Requirements

### Requirement: Número da nota no resumo financeiro
O detalhe do projeto para ADM MUST exibir, no card "Financeiro", uma linha própria com o número da nota fiscal registrada acompanhado da data de emissão, enquanto o projeto tiver nota; o resumo financeiro MUST continuar exibindo o valor da nota, recebido, saldo a receber, previsão de recebimento e ordem de compra como já definido.

#### Scenario: ADM visualiza detalhe com nota registrada
- **WHEN** o ADM abre o detalhe de um projeto com nota fiscal registrada
- **THEN** o card "Financeiro" exibe a linha "Número da nota" com o número da nota e a data de emissão formatada em pt-BR, além do valor da nota

#### Scenario: Detalhe sem nota registrada
- **WHEN** o ADM abre o detalhe de um projeto sem nota fiscal registrada
- **THEN** o card "Financeiro" não exibe a linha "Número da nota" e mantém as demais linhas inalteradas
