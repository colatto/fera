## 1. Banco — coluna e migração de dados (MCP Supabase)

- [x] 1.1 `alter table projeto add column centro_custo varchar(100)` (nullable, sem constraint)
- [x] 1.2 Migração da decisão: `update projeto set centro_custo = 'SPSPSP' where codigo_pasta = 'F-2026-0002'`
- [x] 1.3 Copiar CC das OCs de projeto único: OC 15235 → F-2026-5001 ("PR155") e OC 32 → F-2026-5007 ("MGPRZ003")
- [x] 1.4 Conferir unicidade com `select` (nenhum valor duplicado; F-2026-0204 e F-2026-5009 sem CC) e criar `create unique index` em `projeto.centro_custo`

## 2. Banco — RPCs e views (MCP Supabase)

- [x] 2.1 Recriar `registrar_ordem_compra(p_numero, p_data)` sem `p_centro`, preservando o guard de ADM e a unicidade de número
- [x] 2.2 Recriar `vincular_ordem_compra(p_projeto, p_oc, p_centro default null)` com `btrim` (vazio → null), guard de ADM, exigência de `ENVIADO`, `update projeto` aplicando OC + CC na mesma transação, evento `ENVIADO → OC_REGISTRADA`, e captura de `unique_violation` (23505) re-levantando "Centro de custo já pertence a outro projeto"
- [x] 2.3 Reemitir `grant execute` para as novas assinaturas das duas RPCs
- [x] 2.4 Recriar `v_projetos_administrativo` trocando `oc.centro_custo` por `p.centro_custo` (mantendo `numero_oc`/`data_oc` do join)
- [x] 2.5 Recriar `v_ordens_compra_administrativo` sem a coluna `centro_custo`
- [x] 2.6 `alter table ordem_compra drop column centro_custo` e validar no banco os cenários da spec (vínculo com CC, sem CC, CC duplicado recusado transacionalmente)

## 3. Frontend

- [x] 3.1 `src/queries/fluxo.ts`: `registrarOrdemCompra(p_numero, p_data)` sem CC; `vincularOrdemCompra(p_projeto, p_oc, p_centro)` com CC opcional
- [x] 3.2 `src/routes/projetos/projeto-detalhe.tsx` (`DialogOrdemCompra`): mover o campo "Centro de custo (opcional)" para fora do bloco do modo "Registrar nova" (válido nos dois modos), remover CC da chamada de registro e enviá-lo na vinculação; manter toast/erro fiel ao banco
- [x] 3.3 `src/types/database.types.ts` (manual): `ordem_compra` sem `centro_custo`; `projeto` com a coluna nova; `Functions` com as assinaturas novas; views sem/ com CC conforme o passo 2
- [x] 3.4 Conferir que linha do tempo (`montarItensAdm`) e CSV ADM (`projetos-listar.tsx`) continuam compilando lendo `centro_custo` da projeção ADM, agora do projeto — sem mudança de renderização

## 4. Referência e verificação final

- [x] 4.1 Atualizar `banco.sql` (coluna de projeto com unique index, coluna removida da OC, RPCs, views, grants)
- [x] 4.2 `npm run build` (`tsc -b`) sem erros; checagem manual no app: diálogo com campo único de CC nos dois modos, vínculo com CC refletindo na linha do tempo, CC duplicado exibindo a mensagem do banco sem alterar estado
