## Why

A linha do tempo do detalhe do projeto mistura duas dimensões de tempo: eventos são ancorados ao instante real da ação (`realizado_em`), mas os documentos (ordem de compra, nota fiscal, recebimentos) são ancorados à data de negócio fixada artificialmente ao meio-dia (`aoMeioDia`). Como a data de negócio é escolhida pelo usuário e pode ser retroativa, o documento flutua para fora do fluxo natural (aparece antes da criação do projeto ou entre eventos não relacionados) e exibe um horário fabricado ("12:00") que não corresponde ao momento real do registro. Além disso, o default de data dos diálogos do fluxo (`HOJE()`) usa `toISOString()` (UTC) e retorna a data de amanhã entre 21h e meia-noite no fuso brasileiro, gravando a data errada na OC.

## What Changes

- Documentos da linha do tempo passam a ser ancorados ao **instante real da ação**:
  - Ordem de compra: momento do vínculo ao projeto (`realizado_em` do evento `Enviado → OC registrada`).
  - Nota fiscal: `registrado_em` da própria tabela.
  - Recebimentos: `confirmado_em` da própria tabela.
  - Autorização de faturamento: `autorizado_em` (já correto hoje; passa a ser a regra padrão).
- A data de negócio do documento (`data_oc`, `data_emissao`, `data_recebimento`) deixa de posicionar o item e passa a constar apenas na descrição, sem hora fictícia; a ordenação cronológica permanece.
- A previsão de recebimento permanece como projeção ancorada à data calculada (emissão + 30 dias), sem alteração.
- `HOJE()` e o default equivalente do dashboard operacional passam a usar a **data local** do usuário (não UTC) — diálogos de OC, nota fiscal e recebimento, e defaults do seletor de período.
- Sem alteração de schema, views ou RPCs no Supabase: a OC usa o evento já exposto por `v_eventos_operacionais`; nota e recebimentos são leituras diretas de tabela (só incluir colunas no select).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito da linha do tempo do detalhe passa a definir a ancoragem temporal dos documentos (instante real da ação; data de negócio somente na descrição).
- `fluxo-projetos`: o requisito do diálogo de ordem de compra (e dos demais diálogos de datas) passa a exigir default de data no fuso local do usuário.
- `painel-dashboards`: o requisito do dashboard operacional passa a exigir defaults de período no fuso local do usuário.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx` — `montarItensAdm` (âncora e descrição dos documentos), `HOJE()` e diálogos de OC/nota/recebimento.
- `src/queries/projetos.ts` — `obterDocumentosAdm`: incluir `registrado_em` (nota) e `confirmado_em` (recebimentos) nos selects.
- `src/routes/dashboards/dashboard-operacional.tsx` — default de período (`hoje()`).
- `src/lib/formato.ts` (ou `utils`) — helper de data local compartilhado.
- `src/components/linha-tempo.tsx` — sem alteração (ordenação cronológica por `quando` permanece).
- Supabase: nenhuma alteração.
