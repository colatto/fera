## 1. Banco — coluna de valor (MCP Supabase)

- [x] 1.1 Aplicar `alter table public.projeto add column valor numeric(15,2)` (anulável, transitório) via `apply_migration`
- [x] 1.2 **Pausa para backfill:** listar os projetos existentes (`id`, `codigo_pasta`, `status`) via `execute_sql`, pedir ao usuário o valor real de cada um e aplicar os `update`s — valor é imutável, nenhum placeholder
- [x] 1.3 Aplicar `alter column valor set not null` + `add constraint projeto_valor_positivo check (valor > 0)` e conferir com `execute_sql` que não resta nulo

## 2. Banco — RPC `criar_projeto` com `p_valor`

- [x] 2.1 Recriar `criar_projeto` com `p_valor numeric` (sem default), gravando `valor` no insert e mantendo o evento `CRIACAO` sem valor em `detalhes`
- [x] 2.2 Atualizar o `grant execute` para a nova assinatura e `drop function` da assinatura antiga de 9 parâmetros
- [x] 2.3 Verificar em `pg_proc` que existe apenas a nova assinatura de `criar_projeto`

## 3. Banco — views administrativas

- [x] 3.1 Recriar `v_projetos_administrativo` com `p.valor` anexada ao final da lista de colunas
- [x] 3.2 Recriar `v_dashboard_financeiro` com `valor_projetos` (subconsulta escalar somando `valor` dos projetos com `status <> 'CANCELADO'`)
- [x] 3.3 Rodar `get_advisors` (security e performance) após o DDL e tratar apontamentos relacionados à mudança

## 4. Tipos e referência declarativa

- [x] 4.1 Regenerar `src/types/database.types.ts` via `generate_typescript_types` e salvar no repositório
- [x] 4.2 Atualizar `banco.sql` para o estado final: coluna, constraint, função nova, grant atualizado e views recriadas (referência declarativa — não é deploy)

## 5. Frontend — criação com valor

- [x] 5.1 Adicionar `p_valor: number` (obrigatório) em `ParametrosCriacao` em `src/queries/fluxo.ts`
- [x] 5.2 Adicionar o campo "Valor (R$)" em `projeto-novo.tsx`: state string, conversão `Number(valor.replace(",", "."))`, inclusão no `valido` com `> 0`, envio em `submeter` — mesmo padrão do diálogo de NF
- [x] 5.3 Conferir que a validação local bloqueia criação sem valor ou com valor não positivo antes de chamar a RPC

## 6. Frontend — exibição exclusiva de ADM

- [x] 6.1 Adicionar coluna "Valor" em `colunasAdministrativas()` com `formatarMoeda` e incluir a coluna no CSV exportado por ADM em `projetos-listar.tsx`
- [x] 6.2 Adicionar `Campo rotulo="Valor"` no card "Dados do projeto" de `projeto-detalhe.tsx`, renderizado somente quando `ehAdm`, lendo `adm.valor`
- [x] 6.3 Adicionar `valor_projetos` ao select e `projetos` à interface `DashboardFinanceiro` em `src/queries/dashboards.ts`, e o card "Projetos" (grid `md:grid-cols-4`) em `dashboard-financeiro.tsx` com descrição explicitando "não cancelados"
- [x] 6.4 Conferir que nenhuma superfície de OPER (listagem, detalhe, CSV, dashboard operacional) exibe valor do projeto

## 7. Validação

- [x] 7.1 Rodar `openspec validate valor-projeto --strict` e corrigir apontamentos
- [x] 7.2 Rodar build/typecheck local (`npm run build` ou equivalente) sem erros
- [x] 7.3 Verificação ponta a ponta no ambiente remoto: criar projeto com valor (valor gravado, evento de criação sem valor), listagem/detalhe/CSV de ADM exibindo valor, dashboard financeiro com "Projetos" excluindo cancelados, e OPER sem qualquer exposição do valor
