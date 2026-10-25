# Tasks

## 1. Banco — enum e RPC (via MCP Supabase)

- [x] 1.1 Adicionar o valor `ALTERACAO_VALOR` ao enum `project_event_type` com `apply_migration` e verificar com `execute_sql` que `enum_range(NULL::public.project_event_type)` o lista
- [x] 1.2 Recriar a RPC `editar_identificadores_projeto` com o parâmetro `p_valor numeric default null` (drop da assinatura de 4 parâmetros, create da nova com validação `p_valor > 0`, eventos por natureza — `ALTERACAO_CADASTRAL` para identificadores/pasta e `ALTERACAO_VALOR` para valor, no-op com os quatro inputs idênticos) e re-conceder `execute` a `authenticated` na mesma migração; verificar com `execute_sql` que `pg_proc` registra a assinatura nova sem a antiga e que `has_function_privilege` retorna true para `authenticated`
- [x] 1.3 Atualizar `banco.sql` como referência versionada (enum na declaração do tipo, função recriada, grant com a assinatura nova) e verificar por `grep` que os três pontos estão coerentes com o que foi aplicado

## 2. Front-end — tipos e rótulos

- [x] 2.1 Regenerar `src/types/database.types.ts` pelo MCP (`generate_typescript_types`) e verificar que `npm run build` compila com `ALTERACAO_VALOR` presente no enum `project_event_type` e na assinatura de `editar_identificadores_projeto`
- [x] 2.2 Adicionar o rótulo `"Alteração do valor"` para `ALTERACAO_VALOR` em `ROTULOS_EVENTO` (`src/lib/constantes.ts`) e verificar que `npm run build` passa (o `Record` exige a chave nova)

## 3. Front-end — diálogo de edição

- [x] 3.1 Estender `editarIdentificadoresProjeto` em `src/queries/fluxo.ts` com o parâmetro de valor na chamada da RPC e verificar que `npm run build` compila com a chamada tipada
- [x] 3.2 Incluir o campo "Valor (R$)" no diálogo de edição de `src/routes/projetos/projeto-detalhe.tsx`: pré-preenchido com o valor vigente a cada abertura (mesmo padrão dos demais campos), validação local de monetário e positivo habilitando o Salvar apenas com valor válido, envio do valor na submissão e ajuste do texto do diálogo; verificar na UI que o campo abre preenchido em projeto `CADASTRADO`, que valor vazio/zero/negativo desabilita o Salvar e que valores com vírgula são aceitos

## 4. Verificação de comportamento de ponta a ponta

- [x] 4.1 Exercitar os cenários do delta de `fluxo-projetos`: alterar só o valor (um único evento "Alteração do valor" sem detalhes, valor refletido no detalhe e na listagem de ADM), alterar identificador e valor no mesmo envio (um evento de cada natureza), submeter sem mudanças (no-op, sem evento), confirmar que a RPC recusa valor não positivo e status fora de `CADASTRADO`, e que a linha do tempo da OPER exibe o evento "Alteração do valor" com autor e data, sem qualquer montante

## Workflow follow-up

- Arquivar o change (`/opsx:archive`) após revisão e verificação dos cenários.
- Confirmar o resultado arquivado na spec principal de `fluxo-projetos`.
