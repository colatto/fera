# Design — migrar-codesplitting

## Context

O `vite.config.ts` (instalado: vite 8.2.2 + rolldown 1.2.4) divide vendor via `rolldownOptions.output.manualChunks` na forma de função — escolha do change `chunk-grande` (arquivado em 2026-09-15), que documentou então que a forma de objeto lançava `TypeError` no Rolldown. Desde então o guia oficial de migração Vite 7→8 marcou a forma de função como deprecated, e os tipos do rolldown embutido confirmam: `@deprecated — Please use output.codeSplitting instead`. O rolldown converte a função, por baixo dos panos, em `codeSplitting.groups[{ name(moduleId) }]` — a migração é mecânica.

Build atual (medido na exploração, `vite build`, sem avisos): `vendor-supabase` 210 kB, `vendor-react` 189 kB, `vendor-router` 91 kB, mais `index` (111 kB) e chunks por rota. Ver proposal.md para a motivação e a decisão de `skip_specs` (refatoração pura — os requisitos de `carregamento-progressivo` permanecem intocados).

## Goals / Non-Goals

**Goals:**
- Substituir a API deprecated pela nativa (`output.codeSplitting.groups`), mantendo os mesmos três grupos de vendor e os mesmos nomes de chunk.
- Sair do build sem nenhum aviso (deprecado ou de chunk grande) — o aviso de chunk é termômetro de regressão segundo a spec `carregamento-progressivo`.
- Atualizar o comentário do bloco, que documenta uma restrição da API antiga ("a forma de objeto não é aceita pelo Rolldown").

**Non-Goals:**
- Revisar os grupos em si (quais pacotes vão para qual vendor) — foco é a troca de API, não re-engenharia do chunking.
- Migrar outras partes do config ou da aplicação (a exploração confirmou que não há mais nenhum padrão pré-Vite-8 além deste).
- Prefetch de chunks em hover/predictive; micro-otimização de tempo de build (já não-goal de `chunk-grande`).

## Decisions

### D1 — `codeSplitting.groups` com `test` em regex espelhando as regras da função

A função atual tem 4 regras → 3 nomes de grupo. A tradução direta mantém os mesmos padrões, ancorados em `node_modules` como hoje:

```ts
codeSplitting: {
  groups: [
    { name: "vendor-supabase", test: /[\\/]node_modules[\\/]@supabase[\\/]/ },
    { name: "vendor-react", test: /[\\/]node_modules[\\/](react-dom|scheduler|react)[\\/]/ },
    { name: "vendor-router", test: /[\\/]node_modules[\\/]react-router/ },
  ],
},
```

Alternativas consideradas:
- **`advancedChunks`**: aceito pelo rolldown 1.2.4, mas é a API anterior, já absorvida como legado por `codeSplitting` (o próprio binding converte um para o outro) — escolheria um caminho de deprecação para sair de outro.
- **Não migrar agora** (esperar a remoção): rejeitado porque a mudança custa pouco, é verificável por comparação de build, e o projeto trata avisos de build como sinal de regressão — um aviso de deprecação futuro poluiria exatamente esse sinal.
- **`manualChunks` como função de `name` dentro de um group** (`groups: [{ name(moduleId) {...} }]`): equivalente ao que o rolldown já faz internamente, mas menos declarativo e mantém a lógica em código quando o `test` por regex resolve — sem benefício.

Ordem dos grupos importa (primeira correspondência vence): supabase antes dos outros, e `react-router` por último não colide com `react[\\/]` porque `react-router` não casa com `react` seguido de separador. O filtro `!id.includes("node_modules")` da função desaparece: nenhum `test` casa fora de `node_modules`, então o código próprio segue no chunk default.

### D2 — Mesclar as duas regras de `vendor-react` numa alternância só

`(react-dom|scheduler)` e `react` viram `(react-dom|scheduler|react)` — mesmo grupo de destino na função atual; a fusão não muda a semântica (qualquer id que casava uma das duas regras casava exatamente uma, e ambas retornavam `"vendor-react"`). Preserva a intenção do comentário original: react + react-dom juntos evitam ciclo de chunks na inicialização do React.

### D3 — Sem `minSize` explícito

Os três grupos têm 91–210 kB, muito acima do default (20 kB nos exemplos do rolldown). Fixar um valor agora seria tuning sem problema a resolver; a checagem é a comparação de build (D4). Se um grupo futuro nascer pequeno demais, aí sim o `minSize` entra na conversa.

### D4 — Ritual de verificação: medir antes e depois, sempre

Herdado do design de `chunk-grande` (D3): "sempre medir no build real antes de fixar grupos". A troca só vale se o build pós-troca emitir os mesmos chunks com tamanhos equivalentes e nenhum aviso. Comparação de referência (pré-troca):

| chunk | bytes |
|---|---|
| dashboard-operacional | 378 105 |
| vendor-supabase | 210 779 |
| vendor-react | 189 604 |
| index | 111 541 |
| vendor-router | 91 664 |
| projetos-listar | 61 487 |

(mais chunks por rota menores; hashes mudam a cada build e não são sinal.)

## Risks / Trade-offs

- [`codeSplitting` e `manualChunks` coexistindo → rolldown ignora o `manualChunks` silenciosamente] → a mudança é substituição direta (remover um bloco, inserir outro); a verificação confirma que não sobrou `manualChunks` no config e que os chunks vendor continuam sendo emitidos (se o novo bloco fosse ignorado, os chunks vendor desapareceriam e o `index` engordaria ~490 kB).
- [Semântica de grupos difere em detalhe da função (captura de módulos, defaults de tamanho)] → comparação linha a linha do `ls -la dist/assets` antes/depois; nomes `vendor-*` idênticos e tamanhos equivalentes são o critério de aceite.
- [API do rolldown ainda em churn (perto de RC no lançamento do Vite 8)] → a versão é pinada pelas dependências do vite 8.2.2 (`~1.2.4`) e `codeSplitting` é justamente a opção documentada como o caminho longo no guia de migração; o risco de churn restante é maior em `advancedChunks` do que aqui.
- [Regex mesclada (D2) com erro de digitação mudaria silenciosamente o agrupamento] → capturado pela mesma comparação de chunks: grupo errado aparece como chunk sumido ou com tamanho trocado.

## Migration Plan

Mudança local de um único arquivo, deploy via fluxo normal (Vercel roda o mesmo `vite build`). Rollback é reverter o commit — nenhum dado, schema ou recurso remoto envolvido (o config toca apenas a etapa de build local/CI).

## Open Questions

(nenhuma)
