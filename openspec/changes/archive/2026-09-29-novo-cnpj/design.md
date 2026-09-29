# Design

## Context

O CNPJ do cliente é validado em duas camadas independentes: no formulário (`src/routes/cadastros/cadastros-clientes.tsx` — filtro no `onChange`, `inputMode="numeric"`, mensagem de validação local) e no banco (constraint `cliente_cnpj_formato` em `banco.sql:17`, replicada no Supabase remoto). As duas usam a mesma regex `^[0-9]{14}$`. A tradução de violações de constraint vive em `src/lib/formato.ts` e não conhece `cliente_cnpj_formato`. Ver proposal.md para a motivação (formato alfanumérico da RFB).

## Goals / Non-Goals

**Goals:**

- Uma única regex, válida em JavaScript e PostgreSQL, que define o formato aceito nas duas camadas: `^[0-9A-EHJ-NPR-TV-Z]{12}[0-9]{2}$`.
- Comportamento do campo: normalizar minúsculas para maiúsculas e ignorar qualquer caractere que, após a conversão, não case com a regex — sem mudar o que já está digitado (padrão atual do filtro `onChange`).
- Constraint do remoto alterada exclusivamente via MCP Supabase, com `banco.sql` atualizado na mesma mudança.

**Non-Goals:**

- Validar dígito verificador (o sistema nunca validou DV, nem no formato numérico).
- Migrar dados existentes (todo CNPJ numérico é subconjunto do novo formato) ou alterar o índice único parcial `cliente_cnpj_unico`.
- Formatar CNPJ com máscara na exibição ou aceitar máscara na entrada.

## Decisions

- **D1 — Regex com classe de caracteres que pulsa as letras proibidas.** `[0-9A-EHJ-NPR-TV-Z]` cobre 10 dígitos + 21 letras (A–Z menos I, O, U, Q, F). Alternativas descartadas: `[A-Z0-9]{12}[0-9]{2}` com verificação separada das letras proibidas (duas regras para manter sincronizadas em duas camadas) e lookahead negativo `(?!.*[IOUQF])` (menos legível e desnecessário — a classe simples resolve nos dois motores). Case-sensitive é o padrão em JavaScript e PostgreSQL, então minúscula é rejeitada na check sem esforço extra.

- **D2 — Bloquear I, O, U, Q, F (decisão do usuário).** Segue a orientação da NT Conjunta/ENCAT em vez do formato normativo completo A–Z. Pega erros de digitação (O no lugar de 0) e reflete o que a RFB emite. Risco consciente: se a RFB um dia emitir com essas letras, a validação recusaria um CNPJ real — reavaliar a regex numa mudança própria se isso ocorrer.

- **D3 — Converter para maiúsculas antes de validar (decisão do usuário).** No `onChange`: `toUpperCase()` primeiro, teste da regex depois; se não casar, o estado não muda (o caractere é ignorado, igual ao tratamento atual de pontuação). Digitar `joao` não produz `JOAO` — `j`, `a` viram `J`, `A` e entram; `o` vira letra proibida e é ignorado. Colar texto com máscara continua sendo rejeitado inteiro. A check do banco, que só aceita maiúsculas, vira defesa em profundidade de verdade.

- **D4 — `inputMode` volta ao padrão de texto.** `inputMode="numeric"` abre teclado sem letras em dispositivos móveis e impediria o novo formato. A filtragem no `onChange` continua responsável por bloquear pontuação.

- **D5 — Sem validação de DV (decisão do usuário).** Coerente com o formato antigo, que nunca validou dígito verificador. Validar o DV alfanumérico exigiria o módulo 11 com a tabela estendida de valores das letras do P&R da RFB e seria uma mudança própria, com risco de invalidar cadastros existentes se a tabela estiver errada.

- **D6 — Troca da constraint no remoto via MCP Supabase.** `alter table public.cliente drop constraint cliente_cnpj_formato` seguido de `add constraint` com a nova regex, na mesma operação; a constraint nova é um superconjunto da antiga, então a troca nunca rejeita dado válido existente. `banco.sql` é atualizado como referência declarativa na mesma mudança — é proibido provisionar por outro caminho (config do projeto: MCP Supabase é o único ambiente operacional; sem MCP disponível, interromper e reportar o bloqueio).

- **D7 — Mapear `cliente_cnpj_formato` em `formato.ts`.** Violação de check (código 23514) hoje chegaria crua à tela se a validação local fosse contornada. A entrada no `MENSAGENS_CONSTRAINT` custa uma linha e cumpre o requisito da spec `interface-web` de mensagem compreensível para verificação do banco.

## Risks / Trade-offs

- [RFB emitir CNPJ com I/O/U/Q/F no futuro] → risco aceito em D2; mudança futura de uma linha na regex das duas camadas.
- [Front antigo em deploy durante a troca da constraint] → sem conflito: a constraint nova aceita tudo que o front antigo envia (troca aditiva); a ordem das etapas é livre.
- [Rollback da constraint após gravar um CNPJ alfanumérico] → a constraint antiga rejeitaria o registro novo; mitigação: o rollback só é direto enquanto não houver alfanumérico gravado — caso exista, tratar o registro antes de recriar a constraint antiga.
- [Usuário colar CNPJ com máscara e não entender por que "não colou"] → comportamento idêntico ao atual para pontuação; a descrição do diálogo reforça "sem pontuação".

## Migration Plan

1. Alterar a constraint no Supabase remoto via MCP Supabase (D6) e validar no remoto.
2. Atualizar `banco.sql` (mesma regex) — referência declarativa.
3. Atualizar o front (`cadastros-clientes.tsx`) e `formato.ts`.
4. Rodar `npm run build` (tsc + vite) e executar a matriz de validação manual das tasks.

Rollback: recriar a constraint antiga no remoto via MCP (observação do risco acima) e reverter front/`banco.sql`.
