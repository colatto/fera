# human-timeline

## Why

A linha do tempo do detalhe do projeto (perfil ADM) está exibindo JSON cru como descrição de eventos — por exemplo `{"origem":"cadastro"}` em eventos de criação e `{"marcada":true}` em compatibilização de fundação — porque `montarItensAdm` usa `JSON.stringify(evento.detalhes)` como fallback de descrição. Além de feio, expõe identificadores internos (o evento de substituição carrega `projeto_anterior_id`) e não implementa nenhum requisito da spec `consulta-projetos`, que é omissa sobre como `detalhes` deve ser apresentado.

## What Changes

- Substituir o fallback `JSON.stringify(evento.detalhes)` em `montarItensAdm` por um formatador por tipo de evento, que traduz `detalhes` para texto em linguagem natural em pt-BR.
- Humanizar somente o evento com detalhe útil hoje: `COMPATIBILIZACAO_FUNDACAO` (`marcada` verdadeira/falsa → texto distinto).
- Omitir a descrição originada de `detalhes` para os demais tipos: `CRIACAO` (o título "Criação" já resume), `SUBSTITUICAO` (decisão de produto: omitir) e qualquer tipo sem humanização definida.
- A linha do tempo MUST NOT exibir JSON cru nem identificadores internos vindos de `detalhes`, em nenhum fallback — fechando a lacuna na spec `consulta-projetos`.
- Item opcional (executar somente se decidido): mascarar a coluna `detalhes` de `v_eventos_operacionais` para perfil não-ADM (`case when usuario_adm()`), eliminando a sobreexposição de payload para OPER, que nunca renderiza esse campo.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Detalhe do projeto com linha do tempo" passa a exigir que os `detalhes` dos eventos sejam apresentados em linguagem natural por tipo de evento, sem JSON cru ou identificadores internos, com omissão quando não houver humanização definida.

## Impact

- `src/routes/projetos/projeto-detalhe.tsx` — função `montarItensAdm`: remoção do `JSON.stringify`, novo formatador de `detalhes` por tipo de evento.
- `openspec/specs/consulta-projetos/spec.md` — novo requisito sobre apresentação de `detalhes` na linha do tempo (via delta da mudança).
- Sem mudanças de schema, RPCs ou views no núcleo da correção (frontend apenas).
- Item opcional, se ativado: view `v_eventos_operacionais` no projeto remoto Supabase (somente via MCP Supabase) + `banco.sql` como referência declarativa versionada.
