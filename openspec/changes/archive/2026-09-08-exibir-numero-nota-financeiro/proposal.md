## Why

O card "Financeiro" do detalhe do projeto exibe o valor da nota registrada, mas não o seu número nem a data de emissão; o ADM precisa recorrer à linha do tempo (ou ao banco) para identificar qual nota foi emitida, embora os dados já estejam disponíveis na projeção que a tela consome.

## What Changes

- Incluir a linha "Número da nota" no card "Financeiro" do detalhe do projeto (visível ao ADM), exibindo o número seguido da data de emissão entre parênteses, no mesmo padrão da linha "Ordem de compra".
- A linha aparece somente quando o projeto tem nota fiscal registrada; sem nota, o card permanece como está.
- Nenhuma alteração de banco, views, RPCs ou permissões: `numero_nota_fiscal` e `data_emissao` já são expostos por `v_projetos_administrativo` e já chegam ao cliente pelo tipo `ProjetoAdministrativo`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `consulta-projetos`: o detalhe do projeto para ADM passa a exibir o número da nota fiscal e a data de emissão no resumo financeiro do card "Financeiro".

## Impact

- `src/routes/projetos/projeto-detalhe.tsx` — card "Financeiro", seção ADM (`LinhaFinanceira` adicional).
- Sem mudanças no Supabase (schema, views, RLS, RPCs) nem nas queries do frontend.
