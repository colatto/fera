## 1. Deduplicação no banco remoto (via MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto; se indisponível, bloquear e reportar
- [x] 1.2 Reapontar o projeto 8 (F-2026-0005): `update projeto set ordem_compra_id = 4 where id = 8 and ordem_compra_id = 5`
- [x] 1.3 Deletar a OC duplicada vinculada: `delete from ordem_compra where id = 5 and not exists (select 1 from projeto where ordem_compra_id = 5)`
- [x] 1.4 Deletar a OC órfã: `delete from ordem_compra where id = 2 and not exists (select 1 from projeto where ordem_compra_id = 2)`
- [x] 1.5 Conferir que não restam duplicatas: `select numero, count(*) from ordem_compra group by numero having count(*) > 1` deve retornar vazio

> Nota de execução (2026-09-08): o banco remoto já tinha uma terceira OC "202" (id 6,
> vinculada ao projeto 9), registrada após a exploração. Mesmo padrão de D3: projeto 9
> reapontado para a OC id 4 e OC id 6 deletada (valores para recriação: numero "202",
> data_oc 2026-09-08, centro null, registrado_por fc48b5d0-d512-4477-9470-037c3b79763b).

## 2. Constraints no banco remoto (via MCP Supabase)

- [x] 2.1 `alter table ordem_compra add constraint ordem_compra_numero_normalizada check (numero = btrim(numero))`
- [x] 2.2 `alter table ordem_compra add constraint ordem_compra_numero_unico unique (numero)`
- [x] 2.3 Validar no `pg_constraint` que as duas constraints existem e que o projeto 8 aponta para a OC id 4

## 3. Front

- [x] 3.1 Em `src/lib/formato.ts`, adicionar ao `MENSAGENS_CONSTRAINT`: `ordem_compra_numero_unico` → "Já existe uma ordem de compra com o número X." (forma sem valor: "Já existe uma ordem de compra com este número.") e `ordem_compra_numero_normalizada` → "O número da ordem de compra não pode começar ou terminar com espaços." (ambas as formas)

## 4. Referência declarativa e verificação final

- [x] 4.1 Atualizar `banco.sql`: acrescentar as duas constraints à definição de `ordem_compra`
- [x] 4.2 Verificação ponta a ponta: tentar registrar OC com número existente pela interface (esperado toast "Já existe uma ordem de compra com o número X."), registrar OC com número inédito (esperado sucesso) e vincular OC existente a outro projeto (esperado sucesso)

> Nota de execução 4.2 (2026-09-08): três cenários validados pela interface no projeto de
> teste F-2026-0007 (id 10) com a fixture ADM `adm.validacao@fera.teste` temporamente
> reativada (desbanida + ativa + senha provisória), restaurada ao estado original ao final
> (banida até 2126, inativa, senha descartada). Resultados: duplicado "202" → toast
> "Já existe uma ordem de compra com o número 202." (details do PostgREST presente, forma
> com valor); número inédito → OC criada e vinculada com sucesso; "Vincular existente" com
> a OC "202" → sucesso. Estado do projeto 10 restaurado (CADASTRADO, sem OC, sem envio) e
> OC de teste deletada; os eventos imutáveis da linha do tempo do projeto 10 (envio e duas
> vinculações) permanecem como registro de auditoria da validação.
