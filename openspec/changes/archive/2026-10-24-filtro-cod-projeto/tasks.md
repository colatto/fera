# Tasks

## 1. Filtro na camada de consultas

- [x] 1.1 Adicionar o campo `codigo: string` a `FiltrosProjetos` e a `filtrosVazios` em `src/queries/projetos.ts`, e aplicar em `montarConsulta` o filtro `.ilike("codigo_pasta", "%" + termo aparado + "%")` quando o campo estiver preenchido, combinado (AND) com os demais filtros; verificar com `npm run build` que a compilação passa

## 2. Filtro na interface da listagem

- [x] 2.1 Em `src/routes/projetos/projetos-listar.tsx`, adicionar `FiltroTexto` rotulado "Código" (campo `codigo`) como primeiro item do grid de filtros, antes de "Status", e mudar a classe do grid de `lg:grid-cols-8` para `lg:grid-cols-9`; verificar no app (`npm run dev`) que "Código" renderiza como primeiro filtro e que os nove filtros cabem em uma linha em tela larga, nos perfis ADM e OPER

## 3. Verificação de integração

- [x] 3.1 Exercitar no app os cenários da spec: busca por substring contida no código (ex.: `F-2024` e `0001`) sem diferenciar maiúsculas nos perfis ADM e OPER; código combinado com cliente e status retornando somente a interseção; "Limpar filtros" restaurando a consulta sem filtros; exportação CSV exportando exatamente o subconjunto filtrado; combinação sem resultado exibindo estado vazio, não erro
