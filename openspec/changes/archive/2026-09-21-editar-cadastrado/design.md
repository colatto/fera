## Context

A edição de identificadores em projeto cadastrado cruza banco e frontend. Fatos verificados no ambiente que moldam a abordagem:

- O enum `project_event_type` já reserva `ALTERACAO_CADASTRAL` e o frontend já tem o rótulo "Alteração cadastral" em `ROTULOS_EVENTO` (`constantes.ts`), mas nenhuma função do banco insere esse tipo — o conceito existia no desenho e faltava o fluxo que o produz.
- Toda escrita em `projeto` passa por RPCs `security definer` que validam perfil e regras por dentro; a tabela tem RLS sem policies diretas. `definir_compatibilizacao_fundacao` é o molde de alteração de campo auditada; `alterar_status_projeto` é o molde de revalidação de status sob `FOR UPDATE`.
- O trigger `fn_proteger_projeto` só bloqueia `numero`/`codigo_pasta` e "descancelar" — atualizar identificadores o atravessa sem mudança.
- Na tela de detalhe, o grupo de ações de `CADASTRADO` já existe (`projeto-detalhe.tsx`) e os dois identificadores já são exibidos como campos somente leitura. A linha do tempo já renderiza qualquer evento `ALTERACAO_CADASTRAL` (rótulo sem descrição) por `montarItens*`, sem código novo.
- `invalidarAposFluxo` (`fluxo.ts`) já invalida `projetos`, `projeto` e `eventos` — a atualização pós-edição é coberta sem acrescentar chaves.
- Os dois campos são `varchar(100) not null`; no cadastro, a UI trima e exige não vazio.
- Contexto do projeto: toda operação de banco usa exclusivamente o MCP Supabase; `banco.sql` é só referência declarativa; tipos regenerados via MCP.

Ver proposta.md para a motivação e o delta de spec (`fluxo-projetos`) para o comportamento alvo.

## Goals / Non-Goals

**Goals:**

- Correção dos dois textos de identificador em uma única transação, auditada por evento na linha do tempo.
- Portão duplo de permissão (UI e RPC) e revalidação de status no servidor.

**Non-Goals:**

- Não altera cliente/operadora vinculadas (FKs) nem qualquer outro campo do projeto — a troca de cliente é outra mudança, com impacto em views e filtros.
- Não registra os valores anteriores no evento: o `detalhes` fica vazio por decisão do usuário (ver Riscos).
- Não muda views, policies, dashboards, filtros ou a listagem.

## Decisions

**1. RPC nova `editar_identificadores_projeto(p_id bigint, p_identificador_cliente varchar, p_identificador_operadora varchar)`.** `security definer`, moldada em `definir_compatibilizacao_fundacao` + `alterar_status_projeto`: gate `usuario_adm()` com `errcode 42501` (como `criar_projeto`); `SELECT ... FOR UPDATE` do projeto; recusa status diferente de `CADASTRADO`; `btrim` nos dois parâmetros e recusa de vazio pós-trim; um único `UPDATE` gravando os dois campos; `INSERT` de evento `ALTERACAO_CADASTRAL` sem `detalhes`. Como é função nova, `CREATE OR REPLACE` basta — sem drop de assinatura órfã. Alternativas consideradas: policy RLS de update direto (descartada: abriria superfície de update na tabela que hoje só recebe escrita via RPC, e o padrão transacional com evento se perderia); estender `alterar_status_projeto` (descartada: mistura troca de status com edição cadastral).

**2. No-op sem evento, decidido pós-trim no servidor.** Se `btrim` de ambos os parâmetros for igual aos valores vigentes, a RPC retorna sem `UPDATE` e sem evento. Se apenas um dos dois mudar, há mudança — grava evento normalmente (a spec condiciona a omissão aos dois valores idênticos). Alternativa: gravar evento sempre — descartada por ruído de auditoria sem conteúdo.

**3. ADM em duas camadas.** O botão "Editar" aparece com `ehAdm && status === "CADASTRADO"` e a RPC revalida o perfil — a camada de UI sozinha não é defesa (perfis são dados, não segredos). Isso difere de Enviar/Cancelar do mesmo grupo (qualquer ativo): a edição é correção cadastral, coerente com `criar_projeto`, que também exige ADM.

**4. Diálogo na tela de detalhe, pre-fill refeito a cada abertura.** `DialogEditarIdentificadores` junto aos demais diálogos de `projeto-detalhe.tsx`, seguindo o padrão do `DialogRecebimento`: estado local sincronizado em `useEffect` quando `aberto` vira verdadeiro, com os valores da query do detalhe (já em cache), evitando stale após edição anterior na mesma sessão. Inputs com `maxLength={100}` (espelha o `varchar(100)`) e validação local trim/não vazio bloqueando o botão de confirmar. Sucesso e erro por toast; a mutação usa `useAcaoFluxo`, herdando as invalidações sem código extra. Alternativa: edição inline no card "Dados do projeto" — descartada por fugir ao padrão de todas as ações do fluxo.

**5. Ordem de deploy: banco → tipos → frontend.** A RPC nova é aditiva: a UI atual nem a conhece, então nada quebra enquanto o banco muda primeiro — o inverso do caso delete-predecessor. Sequência: (1) `apply_migration` via MCP Supabase com a `CREATE OR REPLACE FUNCTION`; (2) atualização de `banco.sql` como referência declarativa; (3) regeneração de `src/types/database.types.ts` via MCP; (4) frontend (botão, diálogo, chamada da RPC em `fluxo.ts`).

## Risks / Trade-offs

- [Corrida: status muda de `CADASTRADO` com o diálogo aberto] → A RPC revalida o status sob `FOR UPDATE`; a falha transacional vira toast e nada muda. Sem aplicação otimista, no padrão do projeto.
- [Auditoria sem os valores anteriores] → O evento registra quem e quando, mas não o que mudou; reconstruir o valor anterior dependeria de fontes externas. Limitação aceita pelo usuário; se revertem, a decisão 1 já isola o ponto de mudança (adicionar `detalhes` jsonb).
- [Espaços nas pontas e vazios] → Trim na UI e `btrim` na RPC, com recusa de vazio nos dois planos; `not null` do banco segue como última defesa.
- [Estouro de `varchar(100)` com mensagem hostil do banco] → `maxLength={100}` nos inputs impede na origem; o banco permanece a defesa final para chamadas fora da UI.
