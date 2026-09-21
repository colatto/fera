## Why

O centro de custo é hoje uma coluna da ordem de compra (`ordem_compra.centro_custo`), mas as regras de negócio o vinculam ao projeto: um projeto tem no máximo um centro de custo e um centro de custo pertence a no máximo um projeto. Como uma ordem de compra atende vários projetos, manter o CC na OC torna as regras 0..1/1:1 inaplicáveis — e o diálogo de ordem de compra só coleta CC no modo "Registrar nova", impossibilitando informar CC ao vincular uma OC existente (status `ENVIADO`). Hoje já há dado real conflitante: a OC "001" com CC "SPSPSP" atende 3 projetos.

## What Changes

- **BREAKING** (banco): coluna `ordem_compra.centro_custo` removida; criada `projeto.centro_custo varchar(100)` com constraint de unicidade global (um CC em no máximo um projeto; NULLs múltiplos permitidos = 0..1 por projeto).
- **BREAKING** (RPC): `registrar_ordem_compra` perde o parâmetro `p_centro`; `vincular_ordem_compra` passa a `(p_projeto, p_oc, p_centro)` e aplica vínculo + CC numa única transação no momento `ENVIADO` → `OC_REGISTRADA`, recusando transacionalmente CC já usado por outro projeto.
- Diálogo "Ordem de compra" (ADM, `ENVIADO`): um único campo "Centro de custo (opcional)" vale para os dois modos ("Vincular existente" e "Registrar nova"); o CC passa a ser atributo do projeto, não de um modo do diálogo.
- Migração de dados (decisão fechada): CC "SPSPSP" (OC 001) fica com o projeto F-2026-0002; F-2026-0204 e F-2026-5009 ficam sem CC; PR155 → F-2026-5001 (OC 15235); MGPRZ003 → F-2026-5007 (OC 32).
- Views de detalhe ADM, listagem e de ordens de compra passam a projetar o CC do projeto; o CC exibido (linha do tempo ADM e CSV ADM) passa a ser o do projeto — projetos que compartilham OC passam a exibir CCs distintos ou vazio.
- CC é imutável após o vínculo (espelha a OC: não existe desvínculo/edição nesta change).
- `banco.sql` atualizado como referência declarativa; toda alteração de banco exclusivamente via MCP Supabase.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fluxo-projetos`: novas requirements do centro de custo — posse pelo projeto, campo único nos dois modos do diálogo, vínculo + CC transacionais em `vincular_ordem_compra`, recusa de CC duplicado com mensagem amigável sem alterar estado, imutabilidade após o vínculo, e validação do fluxo "registro succeeded + vínculo falhou" preservando a OC disponível para vinculação posterior.
- `consulta-projetos`: a exibição do centro de custo (descrição do documento OC na linha do tempo ADM e coluna "Centro de custo" do CSV ADM) passa a refletir o centro de custo do projeto, não o da OC.

## Impact

- **Banco (via MCP Supabase)**: coluna nova + constraint única, coluna removida, assinaturas e corpos das RPCs `registrar_ordem_compra` e `vincular_ordem_compra`, projeções das views (detalhe ADM, listagem, ordens de compra), migração de dados pontual; RLS inalterada.
- **Frontend**: `src/routes/projetos/projeto-detalhe.tsx` (`DialogOrdemCompra` — campo único de CC nos dois modos), `src/queries/fluxo.ts` (assinaturas), `src/types/database.types.ts` (regenerar); linha do tempo e CSV continuam lendo `centro_custo` da projeção ADM, agora com fonte no projeto.
- **Dados**: realocação do CC "SPSPSP" para F-2026-0002 e nulificação nos demais projetos da OC 001.
