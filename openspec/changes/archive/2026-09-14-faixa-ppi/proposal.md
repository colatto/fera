## Why

A faixa de numeração não-PPI (0–1000) está apertada: três tipos já ocupam 1–500 e novos tipos competirão pelo restante. A regra de fronteira passa a ser não-PPI 0–5000 e PPI a partir de 5001. Como os projetos foram removidos do banco remoto (limpeza executada antes desta mudança), a faixa do tipo PPI existente pode ser migrada sem renumerar nenhum projeto.

## What Changes

- **BREAKING** — A constraint `tipo_faixa_valida` do banco passa a exigir: tipos não-PPI com faixa entre 0 e 5000 (final obrigatória) e tipos PPI com faixa inicial a partir de 5001 (final opcional).
- O tipo PPI existente tem a faixa movida de 1001–3000 para **5001–7000**; o trigger `fn_proximo_automatico` eleva o `proximo_numero` para 5001 sem intervenção manual.
- Reset dos contadores não-PPI para o início da própria faixa (Torre 8→1, Estrutural 202→201; collo já está em 401), desabilitando temporariamente o trigger `tipo_proximo_automatico`, que proíbe redução manual.
- Formulário de tipos de projeto: limites de validação, mensagem de erro, valor padrão de faixa final (5000) e auto-preenchimento PPI (5001) atualizados para a nova fronteira.
- Referência declarativa (`banco.sql`) e `requisitos.md` alinhados à nova regra.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: os requisitos de faixa de tipo de projeto mudam de fronteira — não-PPI 0–1000 → 0–5000, PPI a partir de 1001 → a partir de 5001 — afetando a validação local, o auto-preenchimento ao digitar PPI, as mensagens traduzidas de erro do banco e os cenários que citam valores.

## Impact

- **Banco remoto (Supabase, via MCP)**: `UPDATE` na faixa do tipo PPI e nos contadores não-PPI; troca da constraint `tipo_faixa_valida` (drop + add, dentro de transação). Nenhuma função, view ou RLS é alterada.
- **Código**: `banco.sql` (constraint), `src/routes/cadastros/cadastros-tipos.tsx` (validação local, defaults, auto-fill, texto de ajuda), `src/lib/formato.ts` (mensagens de constraint), `requisitos.md`.
- **Sem impacto**: `criar_projeto` e o fluxo de numeração continuam idênticos (consomem `proximo_numero` da faixa do tipo); API e demais telas não mudam.
