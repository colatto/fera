# Requisitos do Sistema Fera

## Objetivo e plataforma

O Fera centraliza o ciclo de projetos da Fera Engenharia: cadastro, envio, OC, autorização, nota fiscal, recebimentos e histórico. Arquivos técnicos continuam fora do sistema; o projeto fornece o código `F-AAAA-NNNN` para localizá-los.

O banco é **PostgreSQL gerenciado pelo Supabase**. O projeto remoto é o único ambiente operacional: usa `public` para dados da aplicação e `auth.users` para credenciais. Não há tabela de senha nem armazenamento de hash em `public`.

### Governança do Supabase

Toda consulta, criação, alteração, implantação e validação de schema, Auth, RLS, funções, views, Edge Functions, segredos e dados ocorre exclusivamente pelo MCP Supabase conectado ao projeto remoto correto. Não se cria ambiente, banco, migration, seed, configuração ou Edge Function local; Supabase CLI e Docker não são alternativas de execução. Se o MCP Supabase não estiver disponível, a operação remota é bloqueada. `banco.sql` é a referência declarativa versionada do estado esperado, não um mecanismo de deploy.

## Frontend e implantação

- A stack de frontend ainda não está definida.
- O frontend será implantado pela Vercel.
- A interface consome o Supabase diretamente: Supabase Auth para sessão, `public.usuario` para navegação, RPCs para escritas e views para consultas e dashboards.
- A interface não é mecanismo de autorização nem contém lógica de proteção por perfil. RLS, permissões e guardas das RPCs no banco permanecem a proteção efetiva.

## Perfis e acesso

- Os perfis fixos são `ADM` e `OPER`; cada `public.usuario` é um perfil ativo associado 1:1 a `auth.users` pelo UUID.
- Usuário inativo não acessa dados nem executa operações.
- ADM administra usuários (por Edge Function/backend com credencial de serviço), cadastros, projetos, OC, autorização, nota, recebimentos e compatibilização.
- OPER consulta projetos, cadastros ativos, eventos e dashboard operacional; só pode enviar ou cancelar projeto pela RPC de status. Cancelamento exige motivo.
- OPER nunca lê nota fiscal, autorização, recebimentos, valores, previsões ou dashboard financeiro. A proteção é feita por RLS e permissões do banco, não pela interface.
- Clientes consultam projeções e dashboards por views/RPCs concedidas a `authenticated`; as tabelas de projeto, documentos e eventos não são lidas diretamente. Inserção/edição dos cadastros básicos é permitida somente ao ADM por RLS. Alterações do fluxo usam exclusivamente RPCs.

## Fluxo

`CADASTRADO → ENVIADO → OC_REGISTRADA → AUTORIZADO_FATURAMENTO → NOTA_EMITIDA → PAGO`.

`CANCELADO` é final e paralelo. Não volta ao fluxo, não recebe novos documentos/recebimentos e não compõe totais ativos ou financeiros. Toda mudança de status gera evento imutável; documentos são exibidos na linha do tempo por suas próprias tabelas, sem evento financeiro duplicado.

| Ação | Regra no banco |
|---|---|
| Criar projeto | ADM; reserva atômica de número, cria evento inicial e status `CADASTRADO` |
| Enviar | ADM/OPER; somente de `CADASTRADO`, grava `data_envio` |
| Vincular OC | ADM; somente projeto enviado e ativo; uma OC pode atender vários projetos |
| Autorizar faturamento | ADM; exige OC; uma autorização por projeto |
| Registrar nota | ADM; exige autorização; uma nota fiscal por projeto |
| Registrar recebimento | ADM; exige nota emitida; parcial permitido, sem exceder a nota |
| Pagar | Automático quando recebimentos somam exatamente o valor da nota |

## Modelo de dados e regras físicas

Os nomes físicos são `snake_case`. Entidades de negócio usam `bigint generated always as identity`; atores/auditoria usam `uuid` que referencia `usuario(id)`/`auth.users(id)`. Datas e horários usam `timestamptz`, flags usam `boolean`, valores usam `numeric(15,2)` e payloads complementares usam `jsonb`.

- `usuario`: `id`, `perfil`, `nome`, `email`, `ativo` e auditoria. Senhas pertencem exclusivamente ao Supabase Auth.
- `cliente`, `operadora` e `tipo_projeto`: cadastros inativáveis. CNPJ é opcional, somente dígitos e único quando presente. Operadora e tipo possuem nome único. Cadastros inativos não podem ser selecionados para novos projetos e só ADM os visualiza diretamente para manutenção.
- `tipo_projeto`: possui faixa inclusiva, próximo número, limite de parcelas e `is_ppi`. Faixas não PPI ficam em `0–1000`; PPI começa em `1001`; exclusão GiST impede sobreposição. O tipo cujo nome seja `Torre` deve possuir `limite_parcelas = 3`.
- `projeto`: número global único, ano, código único, cliente, operadora, identificadores, localização, responsável, status, OC opcional, compatibilização auditada, predecessor opcional e criador obrigatório. O predecessor deve estar cancelado e só pode ter um sucessor.
- `nota_fiscal`: pertence a exatamente um projeto, tem valor positivo e é a fonte financeira oficial. Previsão é calculada como `data_emissao + 30 dias`, sem persistência.
- `recebimento`: pertence a uma nota, tem data/valor positivo, respeita limite de parcelas e nunca ultrapassa a nota.
- `evento_projeto`: contém criação, alterações operacionais e status; não pode ser editado/excluído e `detalhes` não pode conter chaves financeiras.

Todas as FKs usam `on delete restrict`. Registros históricos não são apagados fisicamente. `numero` e `codigo_pasta` são imutáveis.

## Operações obrigatórias

As RPCs `criar_projeto`, `alterar_status_projeto`, `registrar_ordem_compra`, `vincular_ordem_compra`, `autorizar_faturamento`, `registrar_nota_fiscal`, `registrar_recebimento`, `confirmar_recebimentos_lote` e `definir_compatibilizacao_fundacao` são transacionais e validam o usuário autenticado. O lote falha integralmente se qualquer nota/parcela falhar.

Consultas e exportação usam filtros combináveis por código, cliente, identificadores, operadora, cidade, UF, tipo e status. `v_projetos_operacional` e `v_eventos_operacionais` são as fontes do OPER; `v_projetos_administrativo` é a projeção completa do ADM. `dashboard_operacional(data_inicial, data_final)` retorna status, enviados no período e enviados sem OC. `v_dashboard_financeiro`, com faturado, recebido e saldo, é exclusivo de ADM.

## Aceitação

- RLS impede consulta financeira e escrita administrativa por OPER.
- Criações concorrentes não duplicam número nem ultrapassam faixa.
- Estados dependentes só são alcançados pelas RPCs que registram seus documentos.
- Eventos, dados de auditoria, cancelamento, substituição, pagamentos parciais, limite de parcelas e quitação são validados no banco.
- Views operacionais não expõem documentos ou valores financeiros, e views administrativas retornam conjunto vazio para não-ADM.
