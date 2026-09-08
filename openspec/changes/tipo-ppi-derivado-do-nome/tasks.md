## 1. Banco (MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto correto e revalidar que nenhum tipo PPI existe em `public.tipo_projeto`
- [x] 1.2 Aplicar migration única: drop de `is_ppi` (derruba `tipo_faixa_valida`), re-adição como `generated always as (lower(nome) = 'ppi') stored` e recriação idêntica de `tipo_faixa_valida`
- [x] 1.3 Validar no banco: coluna gerada recalculada por insert/update de `nome`; constraint bloqueando faixa inconsistente (PPI < 1001, não PPI > 1000 ou sem final); inserção de teste com nome "PPI" e faixa 1001 aceita e nome "PPI" com faixa 500 rejeitada; remover registro de teste ao final
- [x] 1.4 Atualizar `banco.sql` (referência declarativa) para o novo estado da tabela e da constraint

## 2. Tipos e consultas

- [x] 2.1 Regenerar `src/types/database.types.ts` via MCP Supabase e conferir que `is_ppi` sai de Insert/Update e permanece em Row
- [x] 2.2 Em `src/queries/cadastros.ts`, remover `is_ppi` de `ValoresTipoProjeto` (payloads passam a não enviar o campo)

## 3. Formulário de tipo de projeto

- [x] 3.1 Remover o Switch "Tipo PPI" e derivar o indicador no formulário: `nome.trim().toLowerCase() === "ppi"` (precedente de Torre)
- [x] 3.2 Implementar auto-preenchimento na borda de subida: transição não PPI → PPI ajusta `faixa_inicial = 1001` e `faixa_final = null`; transição inversa não altera valores
- [x] 3.3 Ajustar `validarTipo` para derivar o PPI do nome (mesmas regras: PPI ≥ 1001 com final opcional; demais 0–1000 com final obrigatório)
- [x] 3.4 Atualizar rótulo da faixa final ("(opcional)" quando PPI) e a `DialogDescription` do formulário (nome "PPI" ativa a regra; sem menção a controle manual)
- [x] 3.5 Remover a coluna PPI (Sim/Não) da listagem de tipos

## 4. Traduções e verificação

- [x] 4.1 Atualizar a mensagem de `tipo_faixa_valida` em `src/lib/formato.ts` para citar a origem nominal do indicador (tipos chamados `PPI` usam faixa a partir de 1001; demais, 0–1000 com final obrigatório)
- [x] 4.2 Verificar build/tipagem (`tsc -b`) sem referências remanescentes a `is_ppi` gravável
- [ ] 4.3 Teste manual ponta a ponta na interface: criar tipo "ppi" (auto-preenchimento 1001/final limpa), criar tipo comum, editar tipo PPI renomeando para outro nome (bloqueio pela validação), listagem sem coluna PPI
