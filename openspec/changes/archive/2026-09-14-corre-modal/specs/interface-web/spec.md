## ADDED Requirements

### Requirement: Integridade de modais com conteúdo longo
Toda modal da interface MUST manter todo o próprio conteúdo — campos, rótulos, valores selecionados e ações do rodapé — dentro dos limites da caixa do diálogo, em qualquer viewport suportado. Quando um rótulo ou valor selecionado exceder o espaço disponível, a interface MUST truncá-lo com indicação visual de corte em vez de expandir a modal, deslocar campos para fora da caixa ou sobrepor elementos. A modal de confirmação de recebimentos em lote MUST ser apresentada em largura ampliada em relação às modais padrão do sistema, comportando na mesma linha do item a nota selecionada, a data e o valor.

#### Scenario: Seleção de nota mantém a modal do lote íntegra
- **WHEN** o ADM abre "Lote de recebimentos", adiciona um item e seleciona uma nota com rótulo longo (pasta, número da nota e saldo)
- **THEN** o seletor da nota, a data, o valor e o botão de remover permanecem dentro da caixa da modal, o rodapé segue inteiro dentro dela e o rótulo da nota selecionada é truncado com reticências

#### Scenario: Múltiplos itens permanecem contidos
- **WHEN** o ADM adiciona vários itens ao lote e seleciona notas em todos
- **THEN** cada linha permanece contida na modal, sem empurrar as demais linhas nem o rodapé para fora da caixa

#### Scenario: Largura ampliada da modal de lote
- **WHEN** o ADM abre a modal de confirmação de recebimentos em lote em janela de computador
- **THEN** a modal é apresentada com largura ampliada em relação às modais padrão do sistema, exibindo nota, data e valor lado a lado na mesma linha
