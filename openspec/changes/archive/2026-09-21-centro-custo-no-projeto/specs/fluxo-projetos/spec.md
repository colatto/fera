## ADDED Requirements

### Requirement: Centro de custo pertence ao projeto
O centro de custo MUST ser um atributo do projeto — um projeto MUST ter no máximo um centro de custo, e um mesmo centro de custo MUST pertencer a no máximo um projeto (unicidade global, com múltiplos projetos sem centro de custo permitidos). A ordem de compra MUST NOT carregar centro de custo: o registro de ordem de compra (`registrar_ordem_compra`) MUST NOT aceitar centro de custo, e a ordem de compra vinculada a vários projetos não define o centro de custo de nenhum deles. A unicidade do centro de custo MUST ser garantida transacionalmente pelo banco, não pela interface.

#### Scenario: Projeto sem centro de custo
- **WHEN** um projeto é criado e enviado sem que um centro de custo seja informado
- **THEN** o projeto permanece sem centro de custo e o fluxo de ordem de compra funciona normalmente

#### Scenario: Centro de custo duplicado recusado pelo banco
- **WHEN** uma operação tenta atribuir a um projeto um centro de custo já pertencente a outro projeto
- **THEN** a operação falha transacionalmente, o estado exibido não se altera e a interface mostra mensagem amigável indicando que o centro de custo já pertence a outro projeto

#### Scenario: Registro de ordem de compra sem centro de custo
- **WHEN** o ADM registra uma nova ordem de compra pelo modo "Registrar nova"
- **THEN** a ordem é criada sem centro de custo — o campo do diálogo pertence ao projeto e é aplicado no vínculo

### Requirement: Vínculo de ordem de compra aplica o centro de custo do projeto
`vincular_ordem_compra` MUST aceitar um centro de custo opcional e aplicar vínculo da OC e centro de custo do projeto numa única transação, somente para projeto em status `ENVIADO`: em caso de sucesso, o projeto passa a `OC_REGISTRADA` com a OC vinculada e o centro de custo gravado no projeto, com o evento correspondente na linha do tempo; em caso de falha de qualquer etapa, nada é aplicado. O centro de custo gravado no vínculo MUST ser imutável: nenhuma operação do fluxo MUST alterá-lo ou removê-lo após o vínculo. Quando o registro da nova OC succeed e a vinculação subsequente falha (inclusive por centro de custo duplicado), a OC registrada MUST permanecer disponível para vinculação posterior pelo modo "Vincular existente".

#### Scenario: Vincular existente com centro de custo
- **WHEN** o ADM, no diálogo de ordem de compra de um projeto em `ENVIADO`, escolhe o modo "Vincular existente", seleciona uma OC, informa um centro de custo ainda não usado e confirma
- **THEN** a OC é vinculada e o centro de custo é gravado no projeto numa única transação, o detalhe passa a exibir `OC_REGISTRADA` com o evento na linha do tempo, e o CC informado aparece associado ao projeto

#### Scenario: Vincular existente sem centro de custo
- **WHEN** o ADM vincula uma OC existente sem informar centro de custo
- **THEN** o vínculo ocorre normalmente e o projeto permanece sem centro de custo

#### Scenario: Registrar nova com centro de custo no mesmo campo
- **WHEN** o ADM registra uma nova ordem de compra informando o centro de custo no campo único do diálogo
- **THEN** a OC é criada sem centro de custo e o vínculo subsequente grava o centro de custo no projeto — o comportamento é o mesmo do modo "Vincular existente"

#### Scenario: Vínculo falha por centro de custo duplicado
- **WHEN** o ADM vincula uma OC informando um centro de custo já pertencente a outro projeto
- **THEN** a operação falha transacionalmente: o projeto permanece em `ENVIADO` sem OC nem centro de custo, e a interface exibe mensagem amigável indicando a duplicidade

#### Scenario: Centro de custo imutável após o vínculo
- **WHEN** o projeto está em `OC_REGISTRADA` ou status posterior
- **THEN** nenhuma ação do fluxo altera ou remove o centro de custo gravado no projeto
