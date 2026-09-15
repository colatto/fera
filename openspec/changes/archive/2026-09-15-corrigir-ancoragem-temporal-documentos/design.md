## Context

A linha do tempo do detalhe (`projeto-detalhe.tsx`, `montarItensAdm`) combina eventos (`realizado_em`, timestamptz) com documentos ancorados a `aoMeioDia(data_de_negocio)` — string de data fixada em "T12:00:00". O componente `LinhaTempo` ordena tudo cronologicamente por `quando`, exibindo documentos com `formatarDataHora`. As fontes de dados: `v_eventos_operacionais` (eventos), `v_projetos_administrativo` (OC via `numero_oc`/`data_oc`/`centro_custo`, sem `oc.registrado_em`) e `obterDocumentosAdm` (leitura direta das tabelas `autorizacao_faturamento`, `nota_fiscal` e `recebimento`). Os defaults de data dos diálogos usam `HOJE()` = `new Date().toISOString().slice(0, 10)` (UTC). Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Ancorar cada documento da linha do tempo ADM ao instante real da ação que o trouxe ao projeto.
- Preservar a data de negócio como informação (na descrição do item), sem hora fabricada.
- Eliminar o deslocamento de um dia no default de data dos diálogos e do dashboard operacional.

**Non-Goals:**
- Não alterar schema, views, RPCs ou RLS no Supabase (config do projeto exige MCP para qualquer mudança remota — nenhuma é necessária).
- Não alterar `LinhaTempo` (ordenação cronológica por `quando` permanece).
- Não mudar a linha do tempo de OPER (só eventos, já ancorados ao instante real).
- Não alterar a previsão de recebimento (permanece projeção com âncora ao meio-dia da data calculada).

## Decisions

**D1 — Fonte da âncora temporal por documento.**
- **Ordem de compra**: `realizado_em` do evento `ALTERACAO_STATUS` com `status_novo = 'OC_REGISTRADA'` já carregado em `v_eventos_operacionais`. Alternativas rejeitadas: `oc.registrado_em` (exigiria expor a coluna em `v_projetos_administrativo` via MCP e é semanticamente errado — uma OC atende vários projetos, então `registrado_em` marca o primeiro registro da OC, não o vínculo a este projeto); âncora pela `data_oc` (é exatamente o comportamento defeituoso atual).
- **Nota fiscal**: `nota_fiscal.registrado_em`, adicionando a coluna ao select de `obterDocumentosAdm` (leitura direta de tabela, sem view). Equivalente temporalmente ao evento da transição `NOTA_EMITIDA` (mesma transação), mas é a fonte direta do documento e dispensa busca no array de eventos.
- **Recebimentos**: `recebimento.confirmado_em`, mesmo mecanismo. Não há evento por parcela (só a transição final para `PAGO`), então o timestamp da tabela é o único instante real por recebimento.
- **Autorização**: `autorizado_em` — já correto hoje; mantido como modelo da regra.

**D2 — Data de negócio migra para a descrição; exibição usa o instante real.**
Itens de documento continuam renderizados com `formatarDataHora` (agora sobre instantes reais). Descrições propostas: OC — `OC {numero} de {data_oc} — centro de custo {centro}`; nota — `Emissão {data_emissao} — Valor {valor}`; recebimento — data de negócio + valor (`aoMeioDia` deixa de ser usado em documentos e permanece apenas na previsão, onde o meio-dia é uma âncora neutra entre itens com hora no mesmo dia).

**D3 — Fallback defensivo da OC.** Se o evento de transição para `OC_REGISTRADA` não for encontrado (não deve ocorrer: `vincular_ordem_compra` sempre insere o evento), o item da OC usa o comportamento atual (`aoMeioDia(data_oc)`) em vez de sumir da linha do tempo.

**D4 — Helper único de data local.** Novo helper (ex. `dataLocalHoje()` em `lib/formato.ts`) compondo `getFullYear()/getMonth()/getDate()` — determinístico, sem depender de ICU — substituindo `toISOString().slice(0, 10)` em `HOJE()` (projeto-detalhe), `hoje()` (dashboard-operacional) e no sufixo do nome do CSV (projetos-listar, por consistência).

**D5 — Nenhuma mudança de banco.** As colunas adicionadas aos selects de `obterDocumentosAdm` já são legíveis por ADM (grant e RLS de `nota_fiscal`/`recebimento` já usados pelo mesmo caminho).

**D6 — Invalidação de eventos/documentos por prefixo (descoberta na verificação).** Os diálogos do fluxo (OC, nota, recebimento, lote, cancelar) chamam `useAcaoFluxo` sem `projetoId`, então a invalidação condicional de `["eventos", id]`/`["documentos", id]` nunca rodava para eles: logo após registrar uma OC, a linha do tempo servia cache obsoleto sem o evento da transição, a âncora D1 caía no fallback D3 e o sintoma original (12:00, fora do fluxo) persistia na tela. A correção — invalidar `["eventos"]` e `["documentos"]` por prefixo em `invalidarAposFluxo`, sem depender de parâmetro — é exigida pelo requisito pré-existente do spec `fluxo-projetos` ("o sucesso MUST refletir imediatamente em status, linha do tempo e dashboards") e também cobre o lote, que afeta vários projetos. Alternativa rejeitada: passar `projetoId` em cada diálogo (mais acoplado e não cobre o lote).

## Risks / Trade-offs

- [Projetos antigos mudam de posição dos documentos após o deploy] → é o comportamento desejado (ordem real das ações); a data de negócio permanece visível na descrição, e o fallback D3 cobre o caso de evento ausente.
- [Instante do vínculo ≠ data de emissão pode confundir quem procura a OC pela data] → mitigado pela descrição explícita ("OC 1234 de 10/09/2026").
- [Divergência relógio-servidor vs cliente] → instantes reais são `timestamptz` renderizados no fuso do cliente (design D10 vigente); nada muda nesse aspecto.

## Migration Plan

Deploy frontend-only (build Vercel). Rollback por revert do deploy. Nenhum dado migrado.

## Open Questions

Nenhum.
