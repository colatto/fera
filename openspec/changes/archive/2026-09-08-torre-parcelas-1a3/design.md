## Context

Hoje a regra da Torre está espalhada em quatro pontos coerentes entre si: constraint `tipo_torre_limite_parcelas check (lower(nome) <> 'torre' or limite_parcelas = 3)` (`banco.sql:34`), validação local `nome.toLowerCase() === "torre" && limite_parcelas !== 3` (`cadastros-tipos.tsx:56-58`), input numérico livre (`cadastros-tipos.tsx:155-162`) e tradução da constraint em `formato.ts:81-84`. Dados existentes: Estrutural=1, Torre=3 — ambos válidos na nova regra. O componente `Select` (shadcn) já existe e é usado em outras telas. Toda alteração de banco ocorre exclusivamente pelo MCP Supabase; `banco.sql` é referência declarativa. Motivação: ver proposal.md — Why; requisitos de comportamento: ver delta em `specs/cadastros-basicos/spec.md`.

## Goals / Non-Goals

**Goals:**
- Torre aceitar limite de parcelas 1, 2 ou 3 — coerente nas quatro camadas (banco, validação local, campo do formulário, mensagens).
- Campo do formulário comunicar as opções válidas: select 1|2|3 quando o nome é Torre.
- Preservar o nome da constraint e, com ele, o mapa de tradução de erros.
- Manter intocado o comportamento dos demais tipos (regra `> 0` no banco, input livre na UI).

**Non-Goals:**
- Criar teto (`max 3`) para tipos não-Torre — usuário decidiu explicitamente não alterar a regra dos demais.
- Alterar o fluxo de recebimentos: a RPC `registrar_recebimento` lê `limite_parcelas` da tabela em tempo de execução e se adapta sozinha.
- Mudar a semântica de detecção do nome Torre (continua `lower(nome) = 'torre'`, igualdade exata).

## Decisions

### D1: Mesma constraint, nova condição (alternativa: renomear a constraint)
`tipo_torre_limite_parcelas` passa de `limite_parcelas = 3` para `limite_parcelas between 1 and 3`, preservando o nome. Manter o nome evita tocar a chave do mapa `MENSAGENS_CONSTRAINT` em `formato.ts` (só o texto muda) e mantém a trilha de auditoria do banco estável. A condição nova repete o limite inferior 1 já garantido pela check base `limite_parcelas > 0` para tornar a regra da Torre autocontida e legível.

### D2: Select condicional somente para Torre (alternativas: select para todos os tipos; travar Torre em 3)
O formulário renderiza o `Select` 1|2|3 quando `lower(nome) === "torre"`; para os demais nomes, o input numérico livre permanece. Selecionar por nome espelha exatamente a condição da constraint, então UI e banco nunca divergem sobre quando a regra se aplica. Rejeitado: estender o select para todos os tipos (mudaria a regra dos demais, fora de escopo) e travar Torre em 3 (era a regra antiga, que se quer relaxar).

### D3: Renomear para Torre não altera o valor do campo (decisão do usuário, opção b)
Se o ADM digita "Torre" com um valor fora de 1..3 no campo, o valor não é resetado: o Select fica sem opção correspondente (renderiza vazio) e o salvamento é bloqueado pela validação local ("O tipo Torre deve ter limite de parcelas entre 1 e 3."). Sem mutação escondida de estado; a validação é a única fonte de feedback. Rejeitado: resetar automaticamente para 1 — esconderia a discrepância sem o usuário perceber.

### D4: Textos acompanham a nova regra
`validarTipo` passa a bloquear Torre com valor fora de 1..3 (`< 1 || > 3`); a mensagem da tradução em `formato.ts` e a descrição do diálogo passam de "igual a 3" para "entre 1 e 3". O bloco base `limite_parcelas < 1` (comum a todos os tipos) permanece; o bloco Torre adiciona apenas o teto.

## Risks / Trade-offs

- [Select em branco ao renomear para Torre com valor fora da faixa] → Aceito e decidido (D3): validação local bloqueia no salvar com mensagem clara.
- [Janela sem constraint entre drop e add em produção] → Operação única de migration (drop + add no mesmo lote, transação única via MCP); dados atuais já satisfazem a nova condição, nada entre as duas etapas depende da constraint antiga.
- [Rollback da constraint com dados novos] → Reverter exige que nenhuma Torre esteja com 1 ou 2; se houver, o valor precisa ser ajustado antes do rollback da constraint (a regra antiga é mais restritiva).

## Migration Plan

1. MCP Supabase `apply_migration`: em um único lote, `alter table public.tipo_projeto drop constraint tipo_torre_limite_parcelas;` e `add constraint tipo_torre_limite_parcelas check (lower(nome) <> 'torre' or limite_parcelas between 1 and 3);`.
2. MCP `execute_sql` — verificação: nenhuma linha de `tipo_projeto` viola a nova condição (dados atuais: 1 e 3).
3. Frontend: Select condicional (D2), sem reset no rename (D3), validação e textos (D4).
4. Atualizar `banco.sql` (linha da constraint), `requisitos.md` e o comentário de regras no topo do formulário.
5. Validação funcional: salvar Torre com 1 e com 2 (antes impossível); Torre com 4 falha com mensagem em português; tipo não-Torre com 4 continua sendo salvo; rename para Torre com valor 5 exibe Select vazio e bloqueia no salvar.

**Rollback**: drop/add da constraint com a condição antiga (`= 3`) após ajustar qualquer Torre com 1 ou 2, e reverter o frontend. Nenhuma mudança de dados estrutural ocorreu.

## Open Questions

(nenhuma)
