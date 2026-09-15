## 1. Helper de data local

- [x] 1.1 Criar `dataLocalHoje()` em `src/lib/formato.ts`: data corrente no fuso local em `YYYY-MM-DD`, compondo `getFullYear()/getMonth()/getDate()` (sem UTC)

## 2. Documentos ancorados ao instante real

- [x] 2.1 Em `src/queries/projetos.ts`: incluir `registrado_em` no select de `nota_fiscal` e `confirmado_em` no select de `recebimento` em `obterDocumentosAdm`, e refletir os campos na interface `DocumentosAdm`
- [x] 2.2 Em `montarItensAdm` (`projeto-detalhe.tsx`): ancorar o item "Ordem de compra" ao `realizado_em` do evento `ALTERACAO_STATUS` com `status_novo = "OC_REGISTRADA"` (fallback D3: `aoMeioDia(data_oc)` se o evento não existir) e mover a data de negócio para a descrição (`OC {numero} de {data_oc} — centro de custo {centro}`)
- [x] 2.3 Em `montarItensAdm`: ancorar a nota a `nota.registradoEm` e os recebimentos a `confirmadoEm`, com a data de negócio na descrição (nota: "Emissão {data} — Valor {valor}"; recebimento: data de negócio + valor); `aoMeioDia` permanece somente na previsão de recebimento
- [x] 2.4 (design D6) Em `invalidarAposFluxo` (`queries/fluxo.ts`): invalidar `["eventos"]` e `["documentos"]` por prefixo, sem depender de `projetoId`, e remover o parâmetro de `useAcaoFluxo` e dos chamadores — os diálogos do fluxo não o informavam, deixando a linha do tempo obsoleta logo após a ação

## 3. Defaults de data no fuso local

- [x] 3.1 Em `projeto-detalhe.tsx`: `HOJE()` passa a usar `dataLocalHoje()` (diálogos de OC, nota e recebimentos em lote)
- [x] 3.2 Em `dashboard-operacional.tsx`: substituir `hoje()` e o cálculo de período por `dataLocalHoje()`
- [x] 3.3 Em `projetos-listar.tsx`: sufixo do nome do CSV usa `dataLocalHoje()`

## 4. Validação

- [x] 4.1 `npm run build` sem erros de tipo ou compilação
- [x] 4.2 Verificação manual como ADM (usar credenciais diponiveis em .env): registrar OC nova e vincular OC existente — o documento "Ordem de compra" aparece na posição do vínculo, com data e hora reais e a data de emissão na descrição; com data de emissão retroativa, o documento não recua antes da criação/envio
- [x] 4.3 Verificação manual: nota fiscal e recebimentos posicionados pelos instantes de registro/confirmação, sem horário fabricado; previsão de recebimento inalterada (só data)
- [x] 4.4 Verificação manual: defaults de data dos diálogos e do dashboard operacional correspondem à data local (validar o caso noturno simulando o fuso, se necessário)
