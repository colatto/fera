# Design

## Context

A modal `Editar usuário` (`DialogEditarUsuario` em `src/routes/usuarios/usuarios.tsx`) é o hub das ações do usuário: seção `Ações do usuário` com `Redefinir senha` e `Inativar`/`Reativar`. A identidade da sessão já está disponível na árvore de rotas: o loader da rota `shell` chama `exigirSessao()` e devolve `SessaoAtual` (sessão + `usuario` com `id`, `nome`, `email`, `perfil`), consumido pelo shell com `useRouteLoaderData("shell")` (`src/components/shell.tsx`).

O casamento entre os dois mundos é direto: `public.usuario.id = auth.uid()` (spec `sessao-acesso`) e `v_usuarios_manutencao` projeta esse mesmo `id` (`banco.sql`), logo o `id` do usuário em edição identifica o próprio registro do logado quando igual ao `id` do usuário da sessão. Detalhe de tipo: `UsuarioManutencao.id` é `string | null`.

Ver proposal.md para a motivação; ver delta de specs para o comportamento exigido.

## Goals / Non-Goals

**Goals:**

- Modal de edição, para o próprio usuário logado, exibindo apenas perfil, nome e e-mail com `Voltar`/`Salvar`.
- Modal de edição, para os demais usuários, comportamento idêntico ao atual.

**Non-Goals:**

- Guarda na Edge Function `admin-usuarios` contra chamada direta com alvo igual ao chamador — a função vive fora deste repositório e o escopo decidido é somente interface.
- Alterar a tabela (segue exibindo `Editar` para todos, inclusive o próprio usuário) ou a página `Minha senha`.

## Decisions

1. **Identidade via `useRouteLoaderData("shell")` dentro de `DialogEditarUsuario`** — mesmo padrão já usado pelo shell; o loader da rota já carregou a linha própria em `public.usuario`, então nenhuma consulta nova é necessária. Alternativas descartadas: consultar `public.usuario` de novo (redundante) e receber o usuário da sessão como prop de `Usuarios` (acoplaria o pai a dados de sessão sem ganho).
2. **Ocultar o bloco inteiro (separador + título + botões), não só os botões** — deixar apenas os botões de fora produziria um separador e um título `Ações do usuário` órfãos. Com o bloco recolhido, a modal do próprio usuário termina nos campos e no rodapé `Voltar`/`Salvar`.
3. **Comparação tolerante a nulo** — `usuario.id` nulo nunca é tratado como próprio (não há como o próprio registro vir sem `id`); o predicado só casa com ids não nulos e iguais.
4. **Escopo somente interface (decisão do usuário na exploração)** — a interface deixa de oferecer as ações sobre o próprio registro, mas a autoridade continua na função. A auto-inativação/auto-redefinição por chamada direta à `admin-usuarios` segue possível e fica registrada como risco conhecido.

## Risks / Trade-offs

- [Chamada direta à `admin-usuarios` com alvo igual ao chamador permanece possível] → Guarda permanece responsabilidade da função; risco conhecido, fora de escopo desta mudança.
- [Regressão na modal de outros usuários] → A mudança é condicional a um único predicado; a validação manual compara a modal do próprio usuário (sem seção) e de outro usuário (inalterada).

## Migration Plan

Sem migração de dados nem mudança de infraestrutura: deploy do frontend. Rollback: reverter o commit da implementação.

## Open Questions

Nenhuma.
