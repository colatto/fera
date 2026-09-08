## Context

`mensagemDeErro` (src/lib/formato.ts) é o ponto único por onde 8 telas transformam erros de escrita/leitura em texto de toast; hoje ele apenas extrai `erro.message` — que, para violações de constraint, é o texto cru do Postgres em inglês. As escritas de cadastro vão direto às tabelas via PostgREST (decisão da spec `cadastros-basicos`: validação no servidor, sem duplicação client-side), e o erro chega ao cliente como `PostgrestError` com `code` (código Postgres), `message` (contém o nome da constraint) e `details` (ex.: `Key (nome)=(Vivo) already exists.`). As RPCs (`criar_projeto` e funções de fluxo) já rejeitam com `RAISE EXCEPTION` em português ("Faixa esgotada" etc.), que hoje são exibidas corretamente. Ver motivação em proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- Toda violação de constraint alcançável pelas escritas da interface virar mensagem em português compreensível, em um único ponto de mudança.
- Preservar intactas as mensagens já amigáveis das RPCs e o fallback atual para erros desconhecidos.

**Non-Goals:**

- Pré-validação client-side ou mudança na estratégia de escritas diretas/RLS.
- Mudanças em `banco.sql`, schema, RLS ou Edge Functions.
- Normalizar a unicidade de nome quanto a maiúsculas/minúsculas (`Vivo` vs `vivo` coexistem hoje) — questão de negócio separada, não requisito deste change.
- Internacionalização: mensagens fixas em português, como o resto da interface.

## Decisions

**D1 — Tradução central dentro de `mensagemDeErro`.** O tradutor vive junto ao helper em `src/lib/formato.ts`; nenhuma tela muda. Todas as 8 telas que já chamam `mensagemDeErro` herdam a tradução. *Alternativas rejeitadas:* tratamento por tela (espalhado e inconsistente); pré-validação client-side (duplica a validação do banco, tem condição de corrida e contradiz a decisão de confiar no servidor).

**D2 — Chave do mapa = código Postgres + nome da constraint.** O tradutor intercepta apenas `23505` (unique), `23P01` (exclusion) e `23514` (check) e extrai o nome da constraint de `message` com `/constraint "([^"]+)"/`. O nome da constraint é a chave estável — está versionado em `banco.sql`. *Alternativa rejeitada:* casar por substring da mensagem inteira (frágil a variações de texto do SGBD); confiar só no `code` (não distingue qual restrição foi violada).

**D3 — Mapa declarativo constraint → mensagem, com valor do `details` quando disponível.** Tabela fixa no código cobrindo as constraints alcançáveis pela interface:

| Constraint | Mensagem |
|---|---|
| `operadora_nome_key` | Já existe uma operadora com o nome "X". |
| `cliente_cnpj_unico` | Já existe um cliente cadastrado com o CNPJ X. |
| `tipo_projeto_nome_key` | Já existe um tipo de projeto com o nome "X". |
| `tipo_faixas_sem_sobreposicao` | A faixa de números sobrepõe a faixa de outro tipo de projeto. |
| `tipo_faixa_valida` | Faixa inconsistente com o indicador PPI: tipos comuns usam 0–1000; PPI, a partir de 1001. |
| `tipo_proximo_valido` | O próximo número deve estar dentro da faixa definida. |
| `tipo_torre_limite_parcelas` | O tipo Torre exige limite de parcelas igual a 3. |

Quando `details` traz o par chave/valor (`Key (nome)=(Vivo) already exists.`), o valor substitui o "X" da frase; sem `details`, a mensagem degrada para forma sem valor ("Já existe uma operadora com este nome."). *Alternativa rejeitada:* exigir o valor — `details` pode estar ausente conforme a versão do PostgREST.

**D4 — Pass-through para tudo que não é constraint mapeada.** Mensagens de `RAISE EXCEPTION` das RPCs (P0001), falhas de rede, erros 4xx/5xx do PostgREST e constraints fora do mapa seguem o caminho atual do helper (mensagem original ou "Erro inesperado. Tente novamente."). O tradutor é aditivo: só entra quando há tradução certa. *Alternativa rejeitada:* traduzir também por heurística de texto — esconderia mensagens já corretas e acoplaria o frontend ao vocabulário do SGBD.

**D5 — Sem testes automatizados; verificação por build e navegador.** O projeto não tem framework de testes. Verificação: `npm run build` (type-check) e roteiro manual no navegador (operadora duplicada, CNPJ duplicado, tipo com nome duplicado, faixa sobreposta, Torre com parcelas ≠ 3, e uma rejeição de RPC — "Faixa esgotada" — para confirmar o pass-through). *Alternativa rejeitada:* introduzir vitest só para este change — escopo maior que o problema.

## Risks / Trade-offs

- [Constraint nova ou renomeada no banco sem entrada no mapa] → Fallback mantém o comportamento atual (mensagem crua); o mapa é barato de estender e `banco.sql` é a lista de verificação natural ao mexer no schema.
- [Formato de `message`/`details` variar entre versões de Postgres/PostgREST] → Regex tolerante: casa só o trecho `constraint "..."`; `details` ausente degrada a mensagem sem quebrar.
- [Tradução remover contexto técnico de depuração] → O toast não é canal de diagnóstico; o erro original permanece no console/stack da aplicação, apenas a frase exibida muda.
- [`details` expõe o valor digitado] → É o mesmo valor que o próprio usuário acabou de submeter; sem vazamento além da sessão.

## Migration Plan

Mudança somente no frontend (um arquivo), sem toque em banco, RLS, Edge Functions ou MCP Supabase. Deploy normal no Vercel; efeito imediato para todos os usuários e retrocompatível (o pior caso de uma tradução ausente é o comportamento atual). Rollback: revert do commit e redeploy.
