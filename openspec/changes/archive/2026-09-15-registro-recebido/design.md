## Context

Os diálogos de recebimento hoje abrem com valor vazio e validam apenas `valor > 0` no cliente; o teto do saldo é imposto só pelo banco (`registrar_recebimento` rejeita `total + valor > nota.valor` com falha transacional, e o lote falha integralmente). Dados disponíveis na UI: `saldo_receber` (view `v_projetos_administrativo`) e a lista `notasDisponiveis` com `nota_fiscal_id`, `codigo_pasta`, `numero_nota_fiscal` e `saldo_receber` por projeto. Detalhes de ciclo de vida que condicionam a abordagem:

- `DialogRecebimento` (projeto-detalhe.tsx) permanece montado enquanto o projeto tem nota; `useState` inicializa uma vez, então qualquer pre-fill precisa reagir à abertura (`aberto`), lendo o saldo corrente que o React Query mantém na props.
- `DialogLote` (dialog-lote.tsx) também persiste `linhas` entre aberturas — peculiaridade existente que se torna inconsistente com a regra de nota única.
- O campo de valor é texto livre parseado por `Number(valor.replace(",", "."))`; não há componente de máscara monetária.

## Goals / Non-Goals

**Goals:**

- Pre-fill do Valor com o saldo corrente, na abertura (detalhe) e na seleção da nota (lote), sempre editável.
- Validação local no submit: `0 < valor ≤ saldo`, com erro inline e botão desabilitado.
- Nota única por linha do lote, com opção desabilitada (visível e marcada) nas demais linhas.
- Diálogos com estado reiniciado a cada abertura.

**Non-Goals:**

- Nenhuma mudança em banco, RPCs, RLS ou queries; o banco permanece a fonte da verdade.
- Não validar client-side o limite de parcelas (`limite_parcelas` não chega à UI pela view); parcelamento abaixo do saldo segue território do banco.
- Não introduzir máscara monetária nem `type="number"`; mantém o input de texto com vírgula decimal.
- Não bloquear digitação (clamp durante o input) — o teto age só no submit.

## Decisions

**D1 — Pre-fill com o saldo a receber, não com o valor da nota.** Com recebimentos parciais, o valor da nota excede o saldo e o pre-fill nasceria já inválido; o saldo coincide com o valor da nota quando a nota está íntegra (caso típico) e é sempre válido. Alternativa descartada: pre-fill com o valor da nota seguido de clamp.

**D2 — Pre-fill na abertura, com reset do diálogo.** Em `DialogRecebimento`, sincronizar `valor` (e `data`) quando `aberto` transiciona para true, lendo `saldo` da props — que o React Query mantém atualizado, cobrindo o cenário de reabertura após recebimento parcial. Em `DialogLote`, limpar `linhas` ao abrir. Alternativas descartadas: `key` que força remontagem por abertura (funciona, mas indireto) e estado derivado (mais invasivo que o efeito pontual).

**D3 — Validação no submit com erro inline.** O botão fica desabilitado e a linha do valor exibe mensagem quando o parse do texto não resulta em número positivo ou excede o saldo. Mensagens: "Informe um valor positivo" e "O valor excede o saldo de {formatarMoeda(saldo)}". Segue o precedente local do `DialogCancelar` (validação de motivo antes da RPC). Alternativas descartadas: clamp durante a digitação (corrompe o texto em edição) e atributo `max` de `type="number"` (exige migrar o input e o parsing, sem ganho de UX).

**D4 — Formatação do pre-fill com vírgula decimal e dois dígitos.** Novo helper em `src/lib/formato.ts` (ex.: `formatarValorDecimal`) usando `Intl.NumberFormat("pt-BR")` com `useGrouping: false` e 2 casas — produz `"6000,50"`, que o parsing existente `replace(",", ".")` consome sem alteração. `formatarNumero` existente não serve: usa separador de milhar ("6.000,5").

**D5 — Nota única derivada do estado das linhas.** O conjunto de notas "em uso" é derivado das seleções das outras linhas; cada `SelectItem` correspondente é renderizado desabilitado com sufixo "— já em uso". Trocar a nota ou remover a linha libera automaticamente a nota anterior, pois o conjunto é recalculado. Alternativa descartada: filtrar a opção da lista (o ADM procuraria uma nota que "sumiu" sem saber por quê). Validação da soma por nota entre linhas torna-se desnecessária: sem duplicatas, validar cada linha contra o próprio saldo é suficiente.

**D6 — Troca de nota sobrescreve o valor da linha.** Ao mudar a nota selecionada, o Valor da linha é re-preenchido com o saldo da nova nota; o valor digitado para a nota anterior não faz sentido na nova. Edição do usuário após a seleção prevalece (comportamento da spec).

**D7 — Banco inalterado como rede de segurança.** Se o saldo mudar entre a abertura e o submit (outro ADM lançou recebimento), a validação local passa, a RPC recusa e a UI exibe a mensagem transacional — comportamento já especificado ("Feedback transacional sem aplicação otimista").

## Risks / Trade-offs

- [Saldo defasado entre abertura e submit] → A RPC rejeita com falha transacional e a UI exibe o erro; nenhum recebimento é aplicado (lote permanece integral). Sem mitigação adicional necessária.
- [Reset do lote descarta linhas ao fechar sem confirmar] → Escolha deliberada (spec): estado nunca persiste entre aberturas; evita inconsistência com a regra de nota única.
- [Parse de texto livre com vírgula/ponto] → Pre-fill normalizado pelo helper único (D4) e parsing centralizado existente; edge cases (texto vazio, múltiplas vírgulas) tratados como valor inválido pela validação, não por exceção.

## Migration Plan

Mudança somente de frontend: commit e deploy normal (Vercel). Sem migração de banco, sem rollback além do revert do commit.

## Open Questions

Nenhuma — as decisões foram fechadas na sessão de exploração.
