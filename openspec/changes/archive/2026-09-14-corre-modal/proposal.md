# Correção da modal de lote de recebimentos

## Why

Na página de detalhe do projeto, ao abrir "Lote de recebimentos" e selecionar uma nota, a modal se desconfigura: Data, Valor e o botão de remover são empurrados para fora da caixa do diálogo, e o rodapé ("Voltar" / "Confirmar lote") fica parcialmente fora dela. Reproduzido em [http://localhost:5173](http://localhost:5173) (projeto `F-2026-5001`) e causa raiz identificada em duas sobreposições de CSS — a largura pretendida da modal nunca é aplicada e a linha do item não consegue encolher quando o rótulo da nota selecionada é longo.

## What Changes

- Aplicar de fato a largura pretendida da modal de lote: `sm:max-w-2xl` em vez de `max-w-2xl`, pois o `sm:max-w-sm` do `DialogContent` base vence a variante sem prefixo na cascata do Tailwind.
- Permitir o encolhimento da coluna da nota na linha do item: faixa de grid `minmax(0, 1fr)` em vez de `1fr` (cujo piso de min-content hoje força o transbordamento) e `min-w-0` no wrapper do campo.
- Fazer o trigger do `Select` preencher a coluna e truncar o rótulo longo com reticências (`w-full`), em vez de crescer com o texto em `whitespace-nowrap`.
- Sem alteração de comportamento, dados, banco, consultas ou fluxo: é correção visual de layout da modal.

## Capabilities

### New Capabilities

### Modified Capabilities

- `interface-web`: novo requirement "Integridade de modais com conteúdo longo" — modais MUST manter todo o conteúdo dentro dos limites da caixa, truncando rótulos longos em vez de transbordar; cenários ancorados na modal de lote de recebimentos (seleção de nota mantém a modal íntegra; largura ampliada aplicada).

## Impact

- `src/routes/projetos/projeto-detalhe.tsx`: `DialogLote` (classes do `DialogContent`, da linha em grid e do `SelectTrigger`).
- Sem alteração em `src/components/ui/dialog.tsx` nem `src/components/ui/select.tsx` (correção no ponto de uso, não no base).
- Sem alteração de banco, RLS, views, RPCs ou Edge Functions (Supabase remoto permanece intocado).
- Verificação manual no navegador (dev server + credenciais de teste `AUTH_ADM_*`); o repositório não possui suíte automatizada de UI.
