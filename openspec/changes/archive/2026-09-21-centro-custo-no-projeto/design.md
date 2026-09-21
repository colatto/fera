## Context

Ver proposal.md — Why. Estado atual relevante para o desenho:

- `ordem_compra.centro_custo varchar(100)` existe; `projeto` não tem coluna de CC; `projeto.ordem_compra_id` FK (OC 1—N projetos).
- RPCs: `registrar_ordem_compra(p_numero, p_data, p_centro)` e `vincular_ordem_compra(p_projeto, p_oc)` (exige `ENVIADO`, move para `OC_REGISTRADA`, registra evento).
- Duas views projetam CC: `v_ordens_compra_administrativo` (da própria tabela OC) e `v_projetos_administrativo` (`oc.centro_custo` — fonte do detalhe ADM, linha do tempo e CSV).
- O frontend lê CC sempre da projeção administrativa (`projeto.centro_custo` no tipo `ProjetoAdministrativo`), nunca da tabela OC — a view é a costura.
- Dado real conflitante: OC 001 ("SPSPSP") atende F-2026-0002, F-2026-0204, F-2026-5009.
- Toda alteração de banco é pelo MCP Supabase; `banco.sql` é referência declarativa versionada. Sem testes automatizados: verificação via `tsc -b` (`npm run build`) + validação direta no banco. `src/types/database.types.ts` é mantido à mão.

## Goals / Non-Goals

**Goals:**
- CC como atributo do projeto, com unicidade global garantida pelo banco (0..1 por projeto; um CC em no máximo um projeto).
- `vincular_ordem_compra` aplicando vínculo + CC numa única transação; recusa amigável de CC duplicado.
- Campo único de CC no diálogo, válido para os dois modos.
- Migração determinística do CC existente, incluindo a decisão "SPSPSP → F-2026-0002".

**Non-Goals:**
- Não criar cadastro/entidade de centro de custo (continua texto livre `varchar(100)`, como hoje).
- Não oferecer edição/remoção de CC após o vínculo (espelha a OC, que também não tem desvínculo).
- Não alterar RLS, dashboards ou o fluxo de status.

## Decisions

1. **Coluna em `projeto` com constraint única, não tabela de junção nem entidade.** `projeto.centro_custo varchar(100)` + `unique` (Postgres permite múltiplos NULLs em unique — 0..1 sai de graça). Alternativa considerada: tabela `centro_custo` com FK — rejeitada porque CC continua texto livre de negócio e a regra "um CC só pode ter um projeto" é inteiramente expressa pela unique index; entidade só se CC ganhar atributos próprios.
2. **CC aplicado no vínculo, não no registro da OC.** `vincular_ordem_compra(p_projeto, p_oc, p_centro default null)` faz `update projeto set ordem_compra_id, centro_custo` numa transação só; `registrar_ordem_compra(p_numero, p_data)` perde `p_centro`. Alternativa considerada: RPC separada `definir_centro_custo` — rejeitada porque criaria dois momentos para um mesmo fato (o CC nasce com o vínculo) e uma janela inconsistente entre OC vinculada e CC gravado. A normalização é `btrim` no RPC (string vazia → null), defesa em profundidade além do trim do diálogo.
3. **Duplicidade tratada no RPC com mensagem amigável.** O corpo captura `unique_violation` (23505) e re-levanta `exception 'Centro de custo já pertence a outro projeto'`; a UI já exibe a mensagem do banco fielmente (padrão "Feedback transacional" da spec). Alternativa: checagem prévia por `select` — rejeitada: sofre corrida entre projetos; a constraint é a verdade.
4. **Migração em dois passos antes de qualquer constraint.** (a) aplicar decisão: `F-2026-0002` recebe "SPSPSP"; (b) copiar CC da OC para o projeto nos demais casos (OCs 15235→F-2026-5001 "PR155", 32→F-2026-5007 "MGPRZ003"); só então criar a unique index. Ordem garante que a constraint nunca vê dado inválido.
5. **Views recriadas antes de derrubar a coluna da OC.** `v_projetos_administrativo` troca `oc.centro_custo` por `p.centro_custo` (mantém `numero_oc`/`data_oc` do join, pois a OC continua compartilhada); `v_ordens_compra_administrativo` deixa de projetar CC. A coluna `ordem_compra.centro_custo` só é removida depois, porque as views dependem dela. Grants reemitidos para as novas assinaturas das RPCs.
6. **Frontend: a view é a costura — mudanças pequenas.** Linha do tempo e CSV continuam lendo `projeto.centro_custo` da projeção ADM (a fonte muda no banco, a UI não). No diálogo, o campo "Centro de custo (opcional)" sai do bloco condicional do modo "Registrar nova" e passa a valer para os dois modos; `registrarOrdemCompra` perde o parâmetro e `vincularOrdemCompra` ganha `p_centro` (`src/queries/fluxo.ts`). `database.types.ts` atualizado à mão (sem CLI de tipos no projeto).
7. **`banco.sql` atualizado como última tarefa de banco** (referência declarativa do estado esperado — coluna nova/removida, RPCs, views, grants).

## Risks / Trade-offs

- [Migração roda em produção com dado real] → migrar CC antes de criar a unique index e derrubar a coluna; conferir contagens impactadas após cada passo (`select` de conferência no MCP).
- [CC duplicado só descoberto no envio do formulário] → mensagem amigável do banco exibida no diálogo sem alterar estado (padrão existente); o ADM escolhe outro CC ou limpa o campo.
- [Texto livre de CC permite valores quase idênticos ("sp-spsp" vs "SPSPSP")] → aceito: a regra de negócio é unicidade exata, como decidido; normalização além de trim (case-fold) mudaria o contrato e fica fora de escopo.
- [`registrar_ordem_compra` sem `p_centro` é breaking para qualquer chamador] → o único chamador é o próprio app (`src/queries/fluxo.ts`), atualizado na mesma change; grants reemitidos.
- [Falha parcial registro→vínculo já coberta pelo design D3 existente] → com CC no vínculo, a falha por duplicidade não deixa OC órfã inconsistente: a OC permanece disponível para "Vincular existente", que re-aplica OC + CC.

## Migration Plan

Ordem única de execução no Supabase remoto (via MCP, uma transação por passo, com conferência entre passos):

1. `alter table projeto add column centro_custo varchar(100)`.
2. Migração de dados: F-2026-0002 = "SPSPSP" (decisão); copiar CC das OCs 15235 e 32 para seus únicos projetos.
3. Conferir com `select` que nenhum valor está duplicado; criar `create unique index` em `projeto.centro_custo`.
4. Recriar `registrar_ordem_compra` (sem `p_centro`) e `vincular_ordem_compra` (com `p_centro`, capturando 23505); reemitir grants.
5. Recriar as duas views (CC do projeto na de projetos; sem CC na de ordens).
6. `alter table ordem_compra drop column centro_custo`.
7. Atualizar `banco.sql`.

Rollback: enquanto a coluna da OC não for derrubada (passos 1–5), o estado anterior é restaurável recriando views/RPCs antigas e limpando a coluna nova; após o passo 6, o dado de CC já vive só em `projeto` — rollback volta as RPCs/views antigas sem perder dado. O app só é atualizado junto com o passo 4–5 para não chamar assinatura removida.

## Open Questions

Nenhuma — decisões 1–4 fechadas com o usuário na exploração.
