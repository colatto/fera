## ADDED Requirements

### Requirement: Legenda do tooltip na cor do status
No dashboard operacional, a legenda exibida no tooltip dos gráficos de distribuição por status (barras e pizza) MUST ser apresentada na cor associada ao status do elemento sob o cursor, conforme o mapa de cores por status usado pelos próprios gráficos, de forma consistente entre os dois gráficos. O rótulo e o valor exibidos MUST permanecer inalterados ("quantidade : N" no gráfico de barras e o rótulo do status na pizza).

#### Scenario: Hover em barra do gráfico de distribuição
- **WHEN** o usuário posiciona o cursor sobre a barra de um status no gráfico "Distribuição por status"
- **THEN** a linha "quantidade : N" do tooltip é exibida na cor associada a esse status, a mesma cor da barra sob o cursor

#### Scenario: Hover em fatia do gráfico de proporção
- **WHEN** o usuário posiciona o cursor sobre a fatia de um status no gráfico "Proporção por status"
- **THEN** a linha do tooltip é exibida na cor associada a esse status, a mesma cor da fatia sob o cursor

#### Scenario: Consistência entre os gráficos
- **WHEN** o mesmo status é hoverado no gráfico de barras e no gráfico de pizza
- **THEN** a cor da legenda do tooltip é a mesma nos dois gráficos
