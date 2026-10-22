# Design

## Context

`projeto.responsavel_interno_id` (uuid not null, FK para `usuario`, banco.sql:42) é preenchido por `criar_projeto` e nunca mais alterado. As projeções `v_projetos_operacional` e `v_projetos_administrativo` (banco.sql:327 e :336) não o expõem, e o frontend lê exclusivamente dessas views (`src/queries/projetos.ts`). Alterações de banco são aplicadas no remoto via MCP Supabase; `banco.sql` é referência declarativa. Não há script de geração de tipos — `src/types/database.types.ts` é mantido à mão.

## Goals / Non-Goals

**Goals:**

- Nome do responsável disponível nas duas projeções em uma única consulta por superfície (lista, detalhe, CSV).
- Exibição consistente nos dois perfis, sem nova query no frontend.

**Non-Goals:**

- Edição do responsável interno após a criação (exigiria função no banco e auditoria).
- Filtro de projetos por responsável na listagem.

## Decisions

1. **Expor o nome (`u.nome as responsavel_interno`) na view, via left join.** O join acontece dentro das views, junto dos demais joins já existentes (cliente, operadora, tipo_projeto). Alternativas descartadas: (a) frontend consultando `usuario` à parte — exigiria query extra e mapeamento id→nome na aplicação, espalhando a resolução por três superfícies; (b) expor só o id — obrigaria o frontend a resolver o nome, mesmo problema. A view mantém o contrato de projeção única por perfil que a spec `consulta-projetos` já estabelece.

2. **Mesma coluna nas duas views.** O requisito é visível para ADM e OPER, e é apenas um nome de usuário interno — não há dado financeiro ou de documento envolvido, então não fere a fronteira entre projeções.

3. **Recriação das views com DROP + CREATE, não CREATE OR REPLACE.** Como a mudança adiciona um join ao FROM (não apenas colunas ao final), o PostgreSQL exige recriar a view. Ordem: dropar `v_projetos_administrativo` e `v_projetos_operacional`, recriar ambas com `security_barrier` e o join `left join public.usuario u on u.id = p.responsavel_interno_id`, e reaplicar os grants de `select` a `authenticated` (o revoke implícito do drop não pode deixar a janela aberta nem a tabela sem grant). Nenhum outro objeto do banco depende dessas views (as funções de dashboard leem `projeto` diretamente).

4. **`left join` apesar de o FK ser `not null`.** A integridade (`on delete restrict`) garante responsável sempre presente; o left join é escolha defensiva e uniforme com o estilo do restante das views, e o frontend exibe `—` quando nulo, como nos demais campos.

5. **Coluna/CSV posicionados após "Operadora"** na listagem e no CSV dos dois perfis, e campo no detalhe junto dos demais do card "Dados do projeto". No CSV, as colunas são listas fixas por perfil em `projetos-listar.tsx`; "Responsável" entra nas duas listas na mesma posição relativa.

## Risks / Trade-offs

- **Janela sem views entre drop e create** → executar drop + create + grants como um único script/lock de transação no MCP Supabase; o intervalo é de milissegundos e afetaria apenas consultas concorrentes.
- **Esquecer de reaplicar grants após o drop** → a listagem e o detalhe deixariam de carregar para todos; a task de validação consulta os grants do remoto após aplicar.
- **Tipos desatualizados** → sem geração automática, `database.types.ts` é atualizado à mão com `responsavel_interno: string | null` nas duas views; o build (`tsc -b`) detecta divergência.

## Migration Plan

1. Aplicar no remoto via MCP Supabase: drop das duas views, create com o novo join, re-grant de `select`.
2. Atualizar `banco.sql` com as novas definições (referência declarativa, mesma mudança).
3. Atualizar tipos e frontend; validar com usuário OPER e ADM.
4. Rollback: recriar as views com a definição anterior (presente em `banco.sql` do commit anterior) e reverter o frontend.
