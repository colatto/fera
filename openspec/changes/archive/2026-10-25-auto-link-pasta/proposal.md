# Proposal

## Why

A pasta local de um projeto nasce vazia e depende de digitação manual do ADM seguindo a convenção `P:\_OBRAS_<ano>\<código>` — mas esse caminho é integralmente derivável dos dados que o próprio banco gera na criação (o ano e o código `F-AAAA-NNNN` reservados na mesma transação). Preencher automaticamente elimina a digitação e o erro de transcrição, e a ação "Abrir pasta" (spec `abertura-pasta-local`) passa a funcionar desde o primeiro segundo de vida do projeto.

## What Changes

- A RPC `criar_projeto` passa a gravar a pasta local na mesma transação da criação, montada como `P:\_OBRAS_<ano>\<codigo_pasta>` — por exemplo `P:\_OBRAS_2026\F-2026-0042`.
- A base `P:\_OBRAS_` é fixa no sistema (hardcoded na RPC); o ano é o mesmo ano do código gerado. A virada do ano é automática e sem manutenção: projetos criados em 2027 nascem com `P:\_OBRAS_2027\F-2027-NNNN`, sem nenhuma atualização de configuração.
- Projetos existentes não são alterados (sem backfill): quem tem pasta manual mantém, quem está sem pasta continua sem.
- O valor automático é apenas o valor inicial: a pasta permanece editável e limável normalmente pelos requisitos existentes ("Edição de identificadores em CADASTRADO" e "Edição da pasta local em qualquer status ativo").
- O sistema apenas registra o caminho; a pasta física na unidade `P:` continua sendo criada pelo processo externo da equipe, e a ausência da pasta física no disco não constitui erro da aplicação.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o requisito "Criação de projeto" passa a exigir que a criação defina a pasta local no formato `P:\_OBRAS_<ano>\<codigo_pasta>`, com o ano derivado do mesmo ano do código gerado na mesma transação.

## Impact

- **Supabase remoto (via MCP)**: recriação da função `criar_projeto` com a montagem da pasta no INSERT (base fixa no corpo da função) e reemissão do grant de execute para `authenticated` — a recriação de função derruba grants existentes.
- **`banco.sql`**: referência declarativa atualizada com o novo corpo da função (não é mecanismo de deploy).
- **Frontend**: nenhuma mudança — o formulário "Novo projeto" não ganha campo; o detalhe do projeto e o botão "Abrir pasta" passam a exibir a pasta automaticamente porque já leem `pasta_local` hoje.
- **Sem mudanças**: assinatura da RPC (parâmetros e retorno idênticos), `database.types.ts`, views, RLS, as RPCs de edição de pasta, linha do tempo (o evento `CRIACAO` permanece sem detalhes da pasta), exportação CSV e dashboards.
