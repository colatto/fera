## Context

O `DialogLote` (em `src/routes/projetos/projeto-detalhe.tsx`) já é transversal: consulta `listarProjetos("ADM", filtrosVazios)` e filtra `nota_fiscal_id !== null && saldo_receber > 0`, sem usar o projeto da página em que o botão vive. O botão, porém, está no cabeçalho do detalhe, condicionado a `ehAdm && status === "NOTA_EMITIDA"`. A mutação usa `useAcaoFluxo` (RPC `confirmar_recebimentos_lote`), que invalida `["projetos"]` no sucesso — o que mantém qualquer consulta de projetos da página coerente após um lote confirmado. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**
- Entrada única do lote no cabeçalho da listagem de projetos, sempre visível para ADM.
- Aviso "Nenhuma nota pendente de recebimento" no clique quando não há notas com saldo em aberto.
- `DialogLote` extraído sem alteração de comportamento (transacionalidade, largura ampliada, truncamento, default de data local permanecem como estão).

**Non-Goals:**
- Alterar a RPC `confirmar_recebimentos_lote`, o banco, RLS ou as queries existentes.
- Mudar o conteúdo/comportamento interno do diálogo (requisitos de `interface-web` continuam valendo).
- Novo indicador de contagem de notas pendentes no botão (avaliado e descartado na exploração).

## Decisions

1. **`DialogLote` extraiído para `src/routes/projetos/dialog-lote.tsx`** (mesmo diretório do único consumidor, a listagem). Alternativa: `src/components/` — desnecessário enquanto houver um único consumidor; o movimento é trivial caso surja outro. O arquivo leva junto `LinhaLote` e os imports exclusivos do diálogo.

2. **Consulta de notas sobe para a página de listagem, e o diálogo recebe `notasDisponiveis` por prop.** A decisão de clique (abrir vs. avisar) precisa da lista no instante do clique; com a consulta dentro do diálogo (`enabled: aberto`, como hoje), ela não existiria ainda. Alternativa descartada: manter a consulta no diálogo e abrir sempre — perderia o aviso no clique exigido pelo spec. Assinatura: `DialogLote({ aberto, aoFechar, notasDisponiveis })`.

3. **Chave de consulta mantida: `chavesProjetos.lista("ADM", filtrosVazios)`, `enabled: ehAdm`.** No carregamento inicial da página, `filtrosAplicados === filtrosVazios`, então a consulta da tabela usa exatamente a mesma chave — a consulta do lote nasce em cache, sem requisição extra. Com filtros aplicados, a entrada `filtrosVazios` permanece no cache e segue válida. A invalidação por `["projetos"]` após o lote a atualiza junto com a tabela.

4. **Regra de clique:** com a consulta carregada e `notasDisponiveis.length === 0`, `toast.warning("Nenhuma nota pendente de recebimento")` (idioma sonner já usado na tela) e o diálogo não abre; caso contrário, abre. Enquanto a consulta está pendente (janela curtíssima: só na primeira renderização), o clique abre o diálogo — a lista se preenche sozinha quando os dados chegam; exibir o aviso com dados ainda não carregados seria um falso negativo.

5. **Botão no cabeçalho da listagem:** `[Lote de recebimentos] [Exportar CSV] [Novo projeto]`, com `variant="secondary"` — ações secundárias à esquerda, ação primária ("Novo projeto") à direita, acompanhando a convenção visual já usada no detalhe. Visível só com `ehAdm`, como "Novo projeto".

## Risks / Trade-offs

- [Consulta em erro confluindo com clique no lote] → com erro, `notasDisponiveis` vazio e o clique exibiria o aviso como se não houvesse notas. Cenário improvável (a página inteira já estaria em estado de erro pela consulta da tabela, mesma família de chave) e auto-corrige no refetch; aceito sem tratamento especial.
- [Remoção do atalho no detalhe] → quem estava em um projeto `NOTA_EMITIDA` perde o acesso a um clique de distância. Mitigação: é justamente o comportamento pedido — a operação nunca pertenceu ao detalhe — e a listagem é a rota-pai imediata.
- [Imports órfãos em `projeto-detalhe.tsx`] → a extração pode deixar imports sem uso (`confirmarRecebimentosLote`, `ItemRecebimentoLote`, `listarProjetos`, `filtrosVazios`, `ProjetoAdministrativo`, `dataLocalHoje`, `useMemo`…). Mitigação: tarefa dedicada de limpeza com build/lint como critério.
