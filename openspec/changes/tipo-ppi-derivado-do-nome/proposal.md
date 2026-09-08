## Why

O indicador PPI de um tipo de projeto hoje é um controle manual (Switch "Tipo PPI") redundante e propenso a esquecimento: o usuário precisa ligar o indicador e depois ajustar a faixa manualmente. O formulário já demonstra o padrão correto com `Torre` — o nome dirige o comportamento. Derivar o PPI do nome elimina o passo manual, aplica a regra (faixa a partir de 1001, final opcional) assim que o usuário digita "PPI", e remove a possibilidade de divergência entre nome e indicador, com o banco passando a calcular `is_ppi` sempre a partir do nome.

## What Changes

- No formulário de criar/editar tipo de projeto, o controle manual "Tipo PPI" (Switch) é removido.
- O indicador PPI passa a ser derivado do nome: após trim, comparação exata com "ppi" ignorando caixa (mesmo precedente de `Torre`).
- Quando o nome digitado se torna PPI (transição não PPI → PPI), o formulário aplica automaticamente a regra: auto-preenche faixa inicial com 1001 e limpa a faixa final (que se torna opcional). A transição inversa não restaura valores; a validação local bloqueia se a faixa ficar inconsistente.
- Validação local mantida: nome PPI exige faixa inicial ≥ 1001 com final opcional; demais nomes exigem faixa 0–1000 com final obrigatório.
- **BREAKING (banco)**: a coluna `tipo_projeto.is_ppi` deixa de ser gravável pelo cliente e passa a ser coluna gerada: `generated always as (lower(nome) = 'ppi') stored`. A constraint `tipo_faixa_valida` é recriada referenciando a coluna gerada. Payloads de insert/update não podem mais enviar `is_ppi`.
- A coluna "PPI" (Sim/Não) da listagem de tipos é removida (a informação passa a ser o próprio nome e a faixa exibida).
- Mensagem traduzida da constraint `tipo_faixa_valida` atualizada para refletir a nova origem do indicador (nome "PPI").

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: o requisito "Regras de formulário dos cadastros" muda — o indicador PPI deixa de ser campo do formulário e passa a ser derivado do nome (com auto-preenchimento da faixa na transição para PPI), e a listagem de tipos deixa de exibir a coluna PPI.

## Impact

- **Banco (somente via MCP Supabase, atualizando `banco.sql` como referência declarativa)**: `public.tipo_projeto` — drop da coluna `is_ppi` (derruba `tipo_faixa_valida` junto), re-adicionar como coluna gerada e recriar a constraint. Nenhum tipo PPI existe hoje no banco (apenas Torre e Estrutural), então não há dados a migrar.
- **Tipos gerados**: `src/types/database.types.ts` precisa ser regenerado — `is_ppi` sai de Insert/Update e permanece somente em Row.
- **Front-end**: `src/routes/cadastros/cadastros-tipos.tsx` (remoção do Switch, derivação pelo nome, auto-preenchimento na transição, remoção da coluna da listagem, descrição do diálogo) e `src/queries/cadastros.ts` (`ValoresTipoProjeto` sem `is_ppi`).
- **Traduções**: `src/lib/formato.ts` (texto de `tipo_faixa_valida`).
- Sem impacto em views, funções, triggers, RLS ou em outros fluxos que leiam `is_ppi` (nenhum consumidor além do cadastro e da constraint).
