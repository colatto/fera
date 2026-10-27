# Tasks

## 1. Consulta de projetos

- [x] 1.1 Em `src/queries/projetos.ts`, adicionar campo `responsavel: string` a `FiltrosProjetos` e `filtrosVazios` e, em `montarConsulta`, aplicar `.eq("responsavel_interno", filtros.responsavel)` quando preenchido. Verificar: `npm run build` passa (type check do objeto de filtros usado no contexto e na listagem).

## 2. Opções do filtro Responsável

- [x] 2.1 Em `src/queries/projetos.ts`, criar `listarResponsaveis(perfil)`: consultar somente a coluna `responsavel_interno` na view do perfil, deduplicar ignorando nulos, ordenar alfabeticamente; adicionar chave `responsaveis(perfil)` em `chavesProjetos`. Verificar: `npm run build` passa.
- [x] 2.2 Definir constante com as contas internas ocultas ("Fernanda/R3", "Operacional/R3") e excluí-las somente da lista de opções retornada por `listarResponsaveis`. Verificar: `npm run build` passa e a função não altera a consulta de projetos.

## 3. Painel de filtros

- [x] 3.1 Em `src/routes/projetos/projetos-listar.tsx`, fazer `FiltroTexto` e `FiltroSelect` aceitarem classe de largura opcional e aplicar as larguras em `lg` (Código `w-24`, Operadora `w-28`, UF `w-12`, Compatibilizados `w-24`, demais `flex-1`) com `lg:flex lg:flex-nowrap` no container, mantendo `grid-cols-2` e `md:grid-cols-5` em telas menores. Verificar: `npm run build` passa e o painel fica em uma linha em `lg`, duas linhas de 5 no `md` e duas colunas no mobile.
- [x] 3.2 Adicionar o `FiltroSelect` "Responsável" imediatamente após "Operadora" e antes de "Tipo", alimentado por `listarResponsaveis` com a chave de cache nova, ligado a `mudarFiltro("responsavel", …)`. Verificar: o filtro aparece na posição nos perfis ADM e OPER, e selecionar um nome retorna à primeira página com a consulta filtrada.

## 4. Verificação integrada

- [x] 4.1 Como ADM no navegador: filtrar por um responsável real retorna somente os projetos dele; com "Todos", projetos de "Fernanda/R3" e "Operacional/R3" seguem visíveis com o nome da conta na coluna "Responsável" e nas opções não aparecem; o filtro combina com status e UF; "Limpar filtros" restaura; abrir detalhe e voltar preserva o filtro.
- [x] 4.2 Como OPER no navegador: mesmas verificações do 4.1, confirmando que as opções carregam sem acesso de leitura à tabela `usuario` (RLS) e que nenhuma coluna financeira aparece.
- [x] 4.3 Exportar CSV com o filtro "Responsável" aplicado: o arquivo contém exatamente o subconjunto exibido, com a coluna "Responsável" e sem colunas novas nos dois perfis.

## Workflow follow-up

- Arquivar a change após a revisão do projeto (`/opsx:archive`).
