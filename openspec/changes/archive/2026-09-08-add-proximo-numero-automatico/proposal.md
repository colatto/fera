## Why

O campo "Próximo número" do tipo de projeto é hoje digitado pelo usuário no formulário de cadastro, embora o incremento real já seja automático e transacional na RPC `criar_projeto`. A entrada manual não agrega controle — só cria armadilha: o default `0` do diálogo viola a faixa sempre que `faixa_inicial > 0` (caso comum em tipos PPI, que começam em 1001) e obriga o ADM a digitar um valor que o sistema já conhece. O contador é estado interno da numeração `F-AAAA-NNNN`, não uma decisão de cadastro.

## What Changes

- O formulário de tipo de projeto deixa de oferecer edição de "Próximo número"; o valor nasce automaticamente igual à `faixa_inicial` e passa a ser mantido exclusivamente pelo sistema.
- Nova função/trigger no banco (aplicada via MCP Supabase): no INSERT de `tipo_projeto`, força `proximo_numero := faixa_inicial`, ignorando qualquer valor enviado; no UPDATE, aplica clamp automático para cima quando a `faixa_inicial` sube acima do contador corrente (nunca reutiliza números).
- A RPC `criar_projeto` permanece inalterada (incremento transacional com `FOR UPDATE` já existente).
- Frontend remove o input do diálogo, o campo do payload `ValoresTipoProjeto` e a validação local de próximo número; a coluna "Próximo nº" da tabela permanece como informação somente-leitura.
- A constraint `tipo_proximo_valido` e sua tradução em `formato.ts` permanecem como rede de segurança.
- `banco.sql` é atualizado como referência declarativa do novo trigger.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: a regra de formulário de tipo de projeto deixa de incluir próximo número como campo do usuário; passa a exigir que o próximo número seja calculado automaticamente pelo banco (inicial = faixa inicial, incremento pela RPC de criação de projeto, clamp para cima quando a faixa inicial sobe) e que a interface o apresente somente como informação.

## Impact

- **Banco (somente via MCP Supabase)**: nova função de trigger `before insert or update` em `public.tipo_projeto`; `banco.sql` atualizado como referência declarativa.
- **Frontend**: `src/routes/cadastros/cadastros-tipos.tsx` (remoção do input e da validação local), `src/queries/cadastros.ts` (remoção de `proximo_numero` de `ValoresTipoProjeto`).
- **Não afetado**: `criar_projeto`, `projeto-novo.tsx` (continua exibindo o próximo número no seletor de tipo), constraint `tipo_proximo_valido` e tradução em `formato.ts`.
- **Tradeoff aceito**: correção manual de contador desalinhado sai da UI; resta intervenção direta no banco via MCP Supabase.
