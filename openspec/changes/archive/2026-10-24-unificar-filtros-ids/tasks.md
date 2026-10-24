# Tasks

## 1. Camada de consulta

- [x] 1.1 Em `src/queries/projetos.ts`, substituir `identificadorCliente` e `identificadorOperadora` por um campo único `identificador` em `FiltrosProjetos` e em `filtrosVazios`; verificar com `npm run build` que o `tsc` não aponta nenhum uso restante dos campos antigos
- [x] 1.2 Em `montarConsulta`, aplicar o filtro único como `.or("identificador_cliente.ilike.%X%,identificador_operadora.ilike.%X%")` com o termo aparado e sem vírgulas (decisão 3 do design); verificar no dev que a requisição gerada carrega uma única condição `or=` com os dois `ilike` (aba rede do navegador)

## 2. Interface da listagem

- [x] 2.1 Em `src/routes/projetos/projetos-listar.tsx`, trocar os dois `FiltroTexto` ("ID. cliente" e "ID. operadora") por um único com rótulo "ID cliente/oper." ligado a `filtros.identificador`, na posição entre Cliente e Operadora, e ajustar a grade de `lg:grid-cols-9` para `lg:grid-cols-8`; verificar no dev, nos perfis ADM e OPER, que o campo aparece na posição correta sem célula vazia na grade

## 3. Verificação de comportamento

- [x] 3.1 Na página Projetos do dev, validar os cenários da spec: termo contido no identificador de cliente retorna os projetos; termo contido no identificador de operadora retorna os projetos; termo combinado com Cliente e Status aplica AND com o OR dos identificadores; termo sem correspondência exibe estado vazio; "Limpar filtros" restaura a consulta sem filtros; colunas "ID. cliente" e "ID. operadora" da tabela e do CSV exportado permanecem distintas
- [x] 3.2 Rodar `npm run build` e confirmar sucesso sem erros de tipo

## Workflow follow-up

- Arquivar o change (`/opsx:archive`) após a verificação dos cenários da spec.
