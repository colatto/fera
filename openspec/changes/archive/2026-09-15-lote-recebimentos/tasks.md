## 1. Extração do diálogo

- [x] 1.1 Criar `src/routes/projetos/dialog-lote.tsx` movendo `DialogLote` e `LinhaLote` de `projeto-detalhe.tsx` verbatim, ajustando a assinatura para `DialogLote({ aberto, aoFechar, notasDisponiveis })` (sem consulta interna; `ProjetoAdministrativo` e demais tipos importados de `@/queries/projetos`)
- [x] 1.2 Remover de `projeto-detalhe.tsx` o componente `DialogLote`, `LinhaLote`, o estado `loteAberto`, o botão "Lote de recebimentos" e os imports que ficarem sem uso (`confirmarRecebimentosLote`, `ItemRecebimentoLote`, `listarProjetos`, `filtrosVazios`, `ProjetoAdministrativo`, `dataLocalHoje`, `useMemo`, etc.), deixando o build e o lint limpos

## 2. Entrada na listagem

- [x] 2.1 Em `projetos-listar.tsx`, para ADM: consulta `useQuery` com chave `chavesProjetos.lista("ADM", filtrosVazios)` / `listarProjetos("ADM", filtrosVazios)` / `enabled: ehAdm` e memo de `notasDisponiveis` (`nota_fiscal_id !== null && (saldo_receber ?? 0) > 0`)
- [x] 2.2 Adicionar o botão "Lote de recebimentos" (`variant="secondary"`, `size="sm"`) no grupo de ações do cabeçalho, antes de "Exportar CSV", visível apenas com `ehAdm`, com estado `loteAberto` para o diálogo
- [x] 2.3 Implementar a decisão de clique: consulta carregada e `notasDisponiveis` vazio → `toast.warning("Nenhuma nota pendente de recebimento")` sem abrir o diálogo; caso contrário (incluindo consulta pendente), abrir o diálogo
- [x] 2.4 Renderizar `<DialogLote aberto aoFechar notasDisponiveis />` na página e verificar que, confirmado um lote, a tabela e a disponibilidade de notas se atualizam (invalidação por `["projetos"]`)

## 3. Verificação

- [x] 3.1 Validar os cenários do delta: botão presente no cabeçalho da listagem para ADM em qualquer estado dos filtros, ausente para perfil operacional, ausente no detalhe do projeto, aviso no clique sem notas pendentes
- [x] 3.2 Confirmar que o diálogo extraído preserva os requisitos de `interface-web` (largura ampliada, truncamento do rótulo da nota, rodapé contido) e os de `fluxo-projetos` (transacionalidade, default de data local, reflexo imediato da quitação total)
- [x] 3.3 `openspec validate lote-recebimentos --strict` sem erros e build de produção sem avisos de imports não utilizados
