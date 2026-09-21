## Context

O conceito de predecessor/substituição está espalhado em quatro camadas: formulário de criação (`projeto-novo.tsx`), tipo `ParametrosCriacao` (`fluxo.ts`), RPC `criar_projeto` no banco e o enum `project_event_type` (valor `SUBSTITUICAO`), além da documentação e das specs `fluxo-projetos` e `consulta-projetos`. Fatos verificados no ambiente que moldam a abordagem:

- Banco remoto Supabase em PostgreSQL **17.6** — **não** implementa `ALTER TYPE ... DROP VALUE` (correção apurada durante o apply: o comando não existe em nenhuma versão do PostgreSQL); a remoção do valor do enum exige recriar o tipo.
- **Nenhum dado histórico usa o conceito**: 0 eventos `SUBSTITUICAO`, 0 projetos com `projeto_anterior_id` preenchido. A migração destrutiva não perde nada.
- `ROTULOS_EVENTO` (`constantes.ts`) é `Record<TipoEvento, string>` exaustivo — remover o valor do enum e regenerar tipos força a remoção do rótulo em tempo de compilação.
- `evento_projeto` tem trigger de imutabilidade, mas é irrelevante aqui por não haver linhas do tipo.
- Contexto do projeto: toda operação de banco usa exclusivamente o MCP Supabase; `banco.sql` é só referência declarativa.

Ver proposta.md para a motivação e os deltas de spec para o comportamento alvo.

## Goals / Non-Goals

**Goals:**

- Remover o conceito de todas as camadas em uma única migração coesa, sem janela em que a aplicação quebre.
- Manter `banco.sql` e `database.types.ts` sincronizados com o estado pós-migração do banco remoto.

**Non-Goals:**

- Não altera a regra de cancelamento (status, motivo, perfis) — ela sobrevive sem o conceito de substituição.
- Não toca no status `CANCELADO` nem nos filtros da listagem; só desaparece a consulta de cancelados que alimentava o campo removido.
- Não edita eventos históricos nem limpa a tabela `evento_projeto` (não há o que limpar).

## Decisions

**1. Ordem de deploy: frontend antes da migração.** A RPC atual aceita `p_anterior_id` opcional (default `null`), então a UI que já não envia o parâmetro funciona contra o banco antigo. O inverso quebraria: RPC nova sem o parâmetro rejeita UI antiga que o envia. Sequência: (1) deploy do frontend sem o campo; (2) migração do banco; (3) regeneração dos tipos. A aplicação é o único consumidor conhecido da RPC.

**2. Migração única via `apply_migration`, nesta ordem interna:**
   1. `DROP FUNCTION public.criar_projeto(bigint, bigint, varchar, bigint, varchar, varchar, char(2), numeric, uuid, bigint);` — remover um parâmetro muda a assinatura, e `CREATE OR REPLACE` não altera identidade de função; o recriar sem `p_anterior_id` deixa função órfã se não houver drop explícito.
   2. `CREATE FUNCTION public.criar_projeto(...)` sem `p_anterior_id`, sem a validação de cancelado e sem o insert do evento `SUBSTITUICAO`.
   3. `ALTER TABLE public.projeto DROP CONSTRAINT projeto_anterior_distinto; DROP COLUMN projeto_anterior_id;` — o drop da coluna remove automaticamente unique e FK autorreferenciada.
   4. Enum `project_event_type` sem `SUBSTITUICAO` — **ajuste durante o apply**: PostgreSQL não implementa `ALTER TYPE ... DROP VALUE` em nenhuma versão (a premissa de suporte no PG 17.6 era incorreta; a tentativa falhou com `0A000: dropping an enum value is not implemented`). O valor foi removido pela recriação do tipo, alternativa já prevista nesta decisão: renomear o tipo antigo, criar `project_event_type` com os quatro valores restantes (mesma ordem), converter `evento_projeto.tipo` via texto, descartar o tipo antigo. A view `v_eventos_operacionais` (dependente do tipo) é descartada e recriada com `security_barrier` e o grant `SELECT` a `authenticated` preservados.
   Alternativa considerada: manter coluna e enum e só cortar o fluxo de criação — descartada porque o usuário declarou o conceito morto e meia-remoção deixaria schema mentindo sobre o domínio.

**3. Regeneração de tipos via MCP** (`generate_typescript_types`) substituindo `src/types/database.types.ts` por inteiro, em vez de edição manual — elimina à força a coluna, as relações FK e o argumento da RPC, e o `Record` exaustivo de `ROTULOS_EVENTO` passa a exigir a remoção da chave `SUBSTITUICAO`.

**4. Verificação em dois planos:** `npm run build` (o `tsc -b` pega qualquer referência sobrevivente — tipo `ParametrosCriacao`, chave de `ROTULOS_EVENTO`, uso da coluna) e leitura de volta no banco via MCP (coluna ausente, enum sem o valor, assinatura nova da RPC em `pg_proc`). `openspec validate` fecha o ciclo dos artefatos.

**5. `banco.sql` atualizado como referência declarativa** (enum, tabela, RPC), sem função de deploy — o deploy é a migração do item 2.

## Risks / Trade-offs

- [Migração destrutiva em coluna] → Verificado previamente: 0 linhas usam o conceito; histórico de `banco.sql` no git preserva o DDL original caso algo precise ser reconstruído.
- [Chamadas antigas à RPC com `p_anterior_id` falhariam] → UI atualizada e implantada antes da migração (decisão 1); nenhum outro consumidor conhecido.
- [Enum sem o valor com linha órfã quebraria leitura da linha do tempo] → Impossível aqui: 0 eventos `SUBSTITUICAO` antes do drop.
- [Frontend em cache do navegador ainda exibe o campo] → Sem efeito colateral grave: contra o banco antigo a criação funciona; após a migração, uma UI obsoleta que enviasse `p_anterior_id` receberia erro explícito da RPC e a mensagem do banco é exibida tal como qualquer falha de criação.
