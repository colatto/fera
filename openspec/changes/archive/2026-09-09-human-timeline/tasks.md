# Tasks — human-timeline

## 1. Verificação de dados (questão aberta do design)

- [x] 1.1 Via MCP Supabase, consultar eventos `COMPATIBILIZACAO_FUNDACAO` existentes e conferir o tipo de `detalhes->'marcada'` (booleano vs string); se houver ocorrências com string, estender a guarda do formatador (design D3) para aceitá-las

## 2. Formatador de detalhes no frontend (núcleo — Opção A)

- [x] 2.1 Criar helper `descricaoDetalhesEvento` em `src/routes/projetos/projeto-detalhe.tsx`, colocalizado com `montarItensAdm`, com mapa por tipo de evento e guarda de tipo estrita (design D2/D3): `COMPATIBILIZACAO_FUNDACAO` com `marcada` booleana → "Fundação marcada como compatibilizada" / "Compatibilização desmarcada"; demais tipos e formas inesperadas de `detalhes` → `undefined`
- [x] 2.2 Substituir o fallback `JSON.stringify(evento.detalhes)` em `montarItensAdm` pelo helper, preservando a precedência `motivo_cancelamento ?? detalhes`
- [x] 2.3 Conferir que `montarItensOperacional` permanece sem descrição originada de `detalhes` (sem regressão)

## 3. Validação do comportamento (spec `consulta-projetos`)

- [x] 3.1 Na interface como ADM, abrir detalhe de projeto com evento de compatibilização de fundação marcada e desmarcada: descrições humanizadas distintas, sem JSON cru
- [x] 3.2 Na interface como ADM, abrir detalhe com eventos de criação e substituição: sem descrição de detalhes, sem `{"origem":"cadastro"}` nem `{"projeto_anterior_id":...}`
- [x] 3.3 Na interface como OPER, abrir o mesmo detalhe: linha do tempo inalterada (eventos sem documentos, valores ou JSON)
- [x] 3.4 Rodar `npm run build` sem erros

## 4. Item opcional B — mascarar `detalhes` para não-ADM na view (executar somente se decidido)

- [x] 4.1 Via MCP Supabase, aplicar a nova definição de `v_eventos_operacionais` com `case when public.usuario_adm() then e.detalhes end as detalhes` (design D5)
- [x] 4.2 Espelhar a nova definição da view em `banco.sql` (referência declarativa versionada)
- [x] 4.3 Validar payload pós-alteração: ADM recebe `detalhes` como antes; OPER recebe `detalhes` nulo
