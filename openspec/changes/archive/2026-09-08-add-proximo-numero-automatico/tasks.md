## 1. Banco (somente via MCP Supabase)

- [x] 1.1 Aplicar migration com `public.fn_proximo_automatico()` (INSERT força `proximo_numero := faixa_inicial`; UPDATE aplica guarda monotônica e clamp para cima até `faixa_inicial`) e o trigger `tipo_proximo_automatico before insert or update on public.tipo_projeto`, conforme design.md (D2, D3, D4)
- [x] 1.2 Verificar via `execute_sql` que nenhuma linha existente tem `proximo_numero < faixa_inicial` e que o trigger não alterou valores correntes
- [x] 1.3 Validar comportamento no banco: insert de tipo de teste nasce com contador = faixa inicial; update elevando `faixa_inicial` acima do contador aplica clamp; update tentando reduzir `proximo_numero` falha com a mensagem em português; remover o tipo de teste ao final

## 2. Frontend

- [x] 2.1 Remover `proximo_numero` de `ValoresTipoProjeto` em `src/queries/cadastros.ts` (insert e update deixam de enviar a coluna)
- [x] 2.2 Remover o input "Próximo número" e o estado correspondente do diálogo em `src/routes/cadastros/cadastros-tipos.tsx`
- [x] 2.3 Remover o bloco de validação local de próximo número em `validarTipo` (`cadastros-tipos.tsx:55-60`), mantendo as demais validações
- [x] 2.4 Conferir que a coluna "Próximo nº" da tabela de tipos e a exibição em `projeto-novo.tsx` permanecem como informação somente-leitura

## 3. Referência declarativa

- [x] 3.1 Atualizar `banco.sql` com a função e o trigger na posição dos demais triggers de `tipo_projeto`

## 4. Validação de fim a fim

- [x] 4.1 Na UI: criar tipo PPI (faixa inicial 1001) e conferir "Próximo nº" = 1001 sem campo de entrada; editar tipo elevando a faixa inicial acima do contador e conferir o clamp; criar projeto pelo fluxo normal e conferir que o número atribuído e o incremento seguem corretos
- [x] 4.2 Rodar verificação de tipos/compilação do frontend (`npm run build` ou equivalente) sem erros
