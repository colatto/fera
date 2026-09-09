## 1. Limpeza de dado (Supabase remoto via MCP)

- [x] 1.1 Excluir as notas fiscais de teste: `DELETE FROM public.nota_fiscal WHERE id IN (2, 3)` (NF "100" dos projetos 2 e 3; sem recebimentos vinculados)
- [x] 1.2 Repor status do projeto 3 para `AUTORIZADO_FATURAMENTO` (`UPDATE public.projeto SET status='AUTORIZADO_FATURAMENTO' WHERE id=3`), deixando o projeto 2 (`CANCELADO`) como está
- [x] 1.3 Verificar que não restam números com espaços nas pontas: `SELECT id FROM public.nota_fiscal WHERE numero <> btrim(numero)` deve retornar vazio

## 2. Constraints no banco (Supabase remoto via MCP)

- [x] 2.1 Criar `nota_fiscal_numero_unico`: `ALTER TABLE public.nota_fiscal ADD CONSTRAINT nota_fiscal_numero_unico UNIQUE (numero)`
- [x] 2.2 Criar `nota_fiscal_numero_normalizada`: `ALTER TABLE public.nota_fiscal ADD CONSTRAINT nota_fiscal_numero_normalizada CHECK (numero = btrim(numero))`
- [x] 2.3 Confirmar que ambos aparecem em `pg_constraint` para `public.nota_fiscal`

## 3. Referência declarativa e mensagens (arquivos locais)

- [x] 3.1 Atualizar `banco.sql`: adicionar os constraints `nota_fiscal_numero_normalizada` e `nota_fiscal_numero_unico` na definição de `public.nota_fiscal`, espelhando o padrão usado em `ordem_compra`
- [x] 3.2 Adicionar em `MENSAGENS_CONSTRAINT` (`src/lib/formato.ts`): `nota_fiscal_numero_unico` → comValor "Já existe uma nota fiscal com o número X." / semValor "Já existe uma nota fiscal com este número."; `nota_fiscal_numero_normalizada` → "O número da nota fiscal não pode começar ou terminar com espaços."
- [x] 3.3 Rodar `npm run build` (ou lint do projeto) e confirmar que nada quebra

## 4. Validação dos cenários do spec

- [x] 4.1 Número inédito: registrar NF em um projeto `AUTORIZADO_FATURAMENTO` → cria nota, status `NOTA_EMITIDA` (reverter o dado de teste depois)
- [x] 4.2 Número duplicado: tentar registrar NF com o número da nota criada em 4.1, em outro projeto autorizado → falha transacional, projeto permanece `AUTORIZADO_FATURAMENTO`, toast "Já existe uma nota fiscal com o número X."
- [x] 4.3 OC duplicada: tentar registrar OC com número existente → toast amigável da OC segue funcionando (regressão do comportamento já existente)
- [x] 4.4 Limpar os dados de teste criados na validação (nota de 4.1 e eventuais resíduos), deixando o remoto apenas com o estado intencional
