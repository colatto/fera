## Why

O centro de custo do projeto hoje aparece na linha do tempo (embutido na descrição do documento "Ordem de compra") e na exportação CSV, mas não no card "Financeiro" do detalhe do projeto — o resumo financeiro termina em "Ordem de compra" e o ADM precisa recorrer à linha do tempo para ver o centro de custo, embora ele seja um atributo financeiro do projeto gravado junto ao vínculo da OC.

## What Changes

- O card "Financeiro" do detalhe do projeto (perfil ADM) passa a exibir uma linha "Centro de custo" logo abaixo da linha "Ordem de compra", somente quando o projeto tiver centro de custo informado.
- Nenhuma mudança de dados, query, banco ou perfil: o campo `centro_custo` já está disponível na projeção administrativa usada pelo card.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Centro de custo na projeção administrativa" passa a exigir também a linha "Centro de custo" no card "Financeiro" do detalhe ADM, posicionada abaixo de "Ordem de compra", exibida apenas quando o projeto tiver centro de custo.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx`: inclusão de uma `LinhaFinanceira` condicional no card "Financeiro".
- Sem alteração em `banco.sql`, queries (`src/queries/projetos.ts`), tipos ou CSV.
