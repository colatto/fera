# Design

## Context

Hoje a pasta local só é escrita pela RPC `editar_identificadores_projeto` (`banco.sql:202`), que exige status `CADASTRADO`; a criação do projeto (`criar_projeto`) não aceita pasta. No detalhe (`src/routes/projetos/projeto-detalhe.tsx`), a linha "Pasta local" oferece Copiar (qualquer perfil, inclusive cancelado) e Abrir pasta (caminho válido), e a função `copiarCaminhoPasta` vive no próprio arquivo. A validação de caminho Windows já existe nos dois lados: `pastaValida` no front e as mesmas regras dentro da RPC. Regras do projeto: operação de banco exclusivamente pelo MCP Supabase no remoto; `banco.sql` é referência declarativa, não mecanismo de deploy.

## Goals / Non-Goals

**Goals:**
- Permitir ao ADM alterar/incluir a pasta local em qualquer status, exceto `CANCELADO`, por ação própria na linha da pasta.
- Remover a cópia do caminho de todas as superfícies e perfis.
- Manter intocadas a RPC `editar_identificadores_projeto`, o fluxo de status, views, RLS e a ação Abrir pasta.

**Non-Goals:**
- Editar identificadores fora de `CADASTRADO` (fica restrito como hoje).
- Novo tipo de evento na linha do tempo ou nova validação de caminho.
- Qualquer mudança na listagem, filtros, CSV ou no protocolo `search-ms`.

## Decisions

- **D1 — RPC nova dedicada `editar_pasta_local(p_id bigint, p_pasta_local varchar)`, em vez de relaxar a RPC existente.** A `editar_identificadores_projeto` mistura três campos sob a regra "só CADASTRADO"; relaxá-la para a pasta criaria duas vigências diferentes dentro da mesma função e acoplaria o Diálogo de identificadores a um comportamento que não pediu. A RPC nova: `security definer`, exige `usuario_adm()`, recusa somente `CANCELADO`, reaproveita exatamente as regras de validação da RPC atual (btrim, `^[A-Za-z]:\\`, sem caracteres de controle, 500 caracteres), não grava nada quando o valor é idêntico ao vigente e grava um único evento `ALTERACAO_CADASTRAL` quando muda. Alternativa descartada: parâmetro extra "modo" na RPC atual.
- **D2 — Semântica de parâmetro simples: o valor enviado é o estado final.** Ao contrário da RPC atual (que preserva a pasta vigente quando o parâmetro vem `null`, por compatibilidade de deploy), a RPC nova não precisa dessa janela: o diálogo sempre envia o estado final — `null`/vazio limpa, preenchido troca. Menos um caso de borda para testar.
- **D3 — Evento reutiliza `ALTERACAO_CADASTRAL`** (rótulo existente "Alteração cadastral", sem detalhes). Criar tipo novo exigiria enum nova + humanização, sem valor de negócio: o evento diz o que importa (houve alteração cadastral, por quem, quando).
- **D4 — UI: botão rotulado "Editar" na linha da pasta, diálogo próprio `DialogEditarPasta`.** O botão aparece para ADM na linha "Pasta local" — colado ao caminho — exceto em `CADASTRADO` (o "Editar" do cabeçalho já edita a pasta) e `CANCELADO`; aparece também junto ao placeholder "—" quando não há pasta (é o caso "incluir"). Como os dois "Editar" nunca coexistem, o rótulo curto não ambigua — segue o padrão atual em que o botão do cabeçalho se chama "Editar" e o diálogo se intitula especificamente. O diálogo segue o padrão de pre-fill na abertura dos diálogos existentes (`useEffect` por `aberto`, como `DialogRecebimento`): um campo, validação local com a `pastaValida` já existente, vazio permitido. A mutação nova em `src/queries/fluxo.ts` chama a RPC pelo padrão `useAcaoFluxo`.
- **D5 — Copiar removido de vez: função `copiarCaminhoPasta`, ícone `Copy` e botão saem do detalhe.** As specs `consulta-projetos` e `abertura-pasta-local` são atualizadas na mesma change (deltas), inclusive o propósito da spec principal de abertura, editado diretamente. O OPER fica sem ação sobre a pasta — decisão do usuário, registrada na proposal.
- **D6 — Deploy: migration via MCP Supabase (`create or replace`-equivalente: `create function` + `grant execute`), depois código.** A RPC nova é aditiva — nada de schema de tabela, view ou grant existente muda — então não há janela de incompatibilidade entre remoto e front: um front antigo simplesmente não chama a função nova.

## Risks / Trade-offs

- [OPER perde o fallback de cópia do caminho] → Aceito (decisão do usuário). O caminho segue visível no detalhe com o texto completo no `title`; se um dia doer, reabrir a spec de consulta é pontual.
- [Fallback da abertura enfraquecido quando o Chrome recusa o protocolo] → Aceito; a abertura continua não causando erro (spec `abertura-pasta-local`), apenas não há mais cópia de um clique.
- [Dois botões "Editar" na mesma tela] → Eliminado por construção: o inline é oculto exatamente em `CADASTRADO`, onde o do cabeçalho existe.
- [ADM editar pasta de projeto já faturado/pago] → É o objetivo (correção de ponteiro para arquivos); a alteração fica auditada pelo evento na linha do tempo.

## Migration Plan

1. No remoto, via MCP Supabase: criar `public.editar_pasta_local(bigint, varchar)` e conceder `grant execute` a `authenticated` (junto às demais funções do mesmo grant).
2. Atualizar `banco.sql` (definição da função + linha do grant) para manter a referência declarativa fiel ao remoto.
3. Publicar o front (remoção do Copiar, botão Editar, diálogo e mutação nova).
4. Rollback: `drop function public.editar_pasta_local(bigint, varchar)` e revert do front — a RPC nova não é referenciada por nada além do front novo.

## Open Questions

(nenhuma — todas as decisões de produto foram fechadas no explore: cópia some para todos; todos os status exceto Cancelado; diálogo só da pasta; oculto em CADASTRADO; rótulo "Editar".)
