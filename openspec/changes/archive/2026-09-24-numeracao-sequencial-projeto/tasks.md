## 1. Banco — limpeza de dados de teste (via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto
- [x] 1.2 Numa transação única, apagar na ordem das FKs: `recebimento`, `nota_fiscal`, `autorizacao_faturamento`, `evento_projeto`, `projeto`; ordens de compra permanecem
- [x] 1.3 Verificar que as tabelas apagadas estão vazias e que tipos/clientes/operadoras/ordens de compra permanecem

## 2. Banco — nova numeração sequencial anual (via MCP Supabase)

- [x] 2.1 Criar `public.sequencia_projeto` (ano smallint PK com check 2000–9999, proximo_numero not null default 1 com check >= 1, atualizado_em)
- [x] 2.2 Trocar a unicidade de `projeto`: remover `unique (numero)` e criar `unique (ano, numero)`
- [x] 2.3 Apertar o check de `projeto.numero` de `>= 0` para `>= 1`

## 3. Banco — RPC e remoção das faixas (via MCP Supabase)

- [x] 3.1 Reescrever `criar_projeto`: validar tipo ativo sem `for update`, alocar número via `insert ... on conflict (ano) do update ... returning` em `sequencia_projeto`, remover verificação de faixa esgotada e incremento de `proximo_numero`; manter demais validações, formato do código e evento de criação
- [x] 3.2 Remover de `tipo_projeto` na ordem: constraint `tipo_faixas_sem_sobreposicao`, constraints `tipo_faixa_valida` e `tipo_proximo_valido`, trigger `tipo_proximo_automatico` e função `fn_proximo_automatico`, colunas geradas `faixa` → `faixa_inicial`/`faixa_final`, colunas `is_ppi` e `proximo_numero` (manter `tipo_torre_limite_parcelas`)
- [x] 3.3 Validar por consulta que `tipo_projeto` ficou com apenas nome, limite_parcelas, ativo e timestamps, e que as grants existentes continuam válidas

## 4. Frontend — remoção da mecânica de faixas

- [x] 4.1 `cadastros-tipos.tsx`: diálogo com apenas Nome e Limite de parcelas (remover inputs de faixa, `ehNomePpi`, auto-preenchimento de 5001 e validações de faixa), listagem sem colunas "Faixa" e "Próximo nº" e descrição do cabeçalho/diálogo sem menção a faixas
- [x] 4.2 `queries/cadastros.ts`: remover `faixa_inicial`/`faixa_final` de `ValoresTipoProjeto`
- [x] 4.3 `projeto-novo.tsx`: remover o sufixo "— próximo número N" da opção do seletor de tipo
- [x] 4.4 `lib/formato.ts`: remover as entradas `tipo_faixas_sem_sobreposicao`, `tipo_faixa_valida` e `tipo_proximo_valido` do mapa de erros
- [x] 4.5 Regenerar/atualizar `types/database.types.ts` a partir do schema remoto pós-migração
- [x] 4.6 Rodar build/lint do frontend e corrigir referências quebradas

## 5. Documentação de referência

- [x] 5.1 Atualizar `banco.sql`: tabela `sequencia_projeto`, constraints novas de `projeto`, `tipo_projeto` reduzida, `criar_projeto` reescrita, sem mecânica de faixas
- [x] 5.2 Atualizar `requisitos.md`: descrição de `tipo_projeto` (sem faixa/`is_ppi`) e numeração sequencial anual na nota de concorrência

## 6. Validação ponta a ponta

- [x] 6.1 Criar tipo de projeto novo (ex.: nome comum e `Torre`) apenas com nome e limite de parcelas; conferir listagem sem colunas de numeração
- [x] 6.2 Criar dois projetos de tipos diferentes no ano corrente e conferir códigos `F-AAAA-0001` e `F-AAAA-0002`, independentemente do tipo
- [x] 6.3 Conferir que o seletor de tipo no novo projeto exibe apenas o nome e que o diálogo de sucesso mostra o código gerado
- [x] 6.4 Conferir fluxos intactos: envio/OC/nota/recebimento num dos projetos criados, e dashboards refletindo as criações
