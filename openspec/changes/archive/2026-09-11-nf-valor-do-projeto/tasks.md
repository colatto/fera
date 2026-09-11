## 1. Banco (Supabase remoto, via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto
- [x] 1.2 Criar a função `registrar_nota_fiscal(p_projeto bigint, p_numero varchar, p_data date) returns bigint`: mesmo corpo da atual, com `valor` derivado de `(select valor from public.projeto where id = p_projeto)` no INSERT e sem `p_valor`
- [x] 1.3 Conferir que o `grant execute` cobre a nova assinatura e que o app atual (chamada de 4 args) continua funcionando contra a função antiga em overload

## 2. Front

- [x] 2.1 Atualizar `registrarNotaFiscal` em `src/queries/fluxo.ts` para chamar a RPC sem valor
- [x] 2.2 Regenerar/atualizar `src/types/database.types.ts` (Args de `registrar_nota_fiscal` sem `p_valor`) a partir do estado remoto via MCP Supabase
- [x] 2.3 Em `DialogNotaFiscal` (`src/routes/projetos/projeto-detalhe.tsx`): receber `valorProjeto`, substituir o Input de valor por texto com `formatarMoeda` ("—" se nulo), validar apenas número + data e passar o novo conjunto de argumentos
- [x] 2.4 Passar `valorProjeto={adm.valor}` na instanciação do diálogo no pai

## 3. Referência declarativa e verificação

- [x] 3.1 Atualizar `banco.sql` com a nova definição de `registrar_nota_fiscal`
- [x] 3.2 Verificar no app: diálogo exibe o valor do projeto somente leitura, registro cria nota com valor igual ao do projeto, status vira `NOTA_EMITIDA` com evento na linha do tempo
- [x] 3.3 Verificar falha transacional preservada: número duplicado de nota continua bloqueando sem alterar o projeto
- [x] 3.4 Após o front no ar, remover via MCP a assinatura antiga `registrar_nota_fiscal(bigint, varchar, date, numeric)` e atualizar `banco.sql` (se ela constava com a assinatura antiga no grant, ajustar)
