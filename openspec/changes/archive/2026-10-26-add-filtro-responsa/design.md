# Design

## Context

A coluna "Responsável" já é exibida na listagem, no detalhe e no CSV dos dois
perfis: `responsavel_interno` (nome do usuário) sai das views
`v_projetos_administrativo` e `v_projetos_operacional` por join feito dentro
da própria view, então chega a OPER sem depender da RLS de `usuario` — que
restringe a leitura dessa tabela à própria linha
(`usuario_leitura`, banco.sql:307). Os filtros existentes combinam no servidor
(`montarConsulta`, src/queries/projetos.ts) e o estado da consulta vive no
contexto acima das rotas, que serializa o objeto de filtros inteiro
(src/routes/projetos/contexto-consulta.tsx). Os selects de Cliente, Operadora
e Tipo são alimentados por tabelas de cadastro pequenas; responsável interno
não tem tabela própria acessível pelos dois perfis.

## Goals / Non-Goals

**Goals:**
- Filtro por responsável interno funcional para ADM e OPER sem nenhuma
  alteração de banco, view, RLS ou tipo gerado.
- Opções do filtro úteis: só quem de fato responde por algum projeto visível
  ao perfil.
- Painel com os 10 filtros em uma linha em telas grandes, encolhendo os
  quatro filtros com folga de espaço.

**Non-Goals:**
- Editar o responsável pela consulta (vedado pelo requisito "Responsável
  interno visível na consulta").
- Ocultar da listagem os projetos das contas internas — elas somem
  apenas das opções do filtro.
- Alterar CSV, exportação, detalhe ou colunas da tabela.
- Qualquer recurso de banco (views, grants, RLS, tipos regenerados).

## Decisions

**1. Fonte das opções: valores em uso na view do perfil, deduplicados no
cliente.** Consulta `responsavel_interno` (coluna única, sem filtros) na view
do próprio perfil; dedupe, descarte de nulos e ordenação no cliente; cache por
perfil em `chavesProjetos`.
Alternativas descartadas: listar usuários ativos (como faz `projeto-novo`) —
bloqueado para OPER pela RLS `usuario_leitura` e exigiria nova view/RPC
expondo nomes de usuários, enfraquecendo uma fronteira existente; além de
listar gente sem projeto; criar cadastro próprio de responsáveis —
desproporcional, duplicaria dado que já vive em `usuario`.

**2. Exclusão das contas internas por constante no frontend.** Constante
`["Fernanda/R3", "Operacional/R3"]` filtra apenas a lista de opções, nunca as
linhas da consulta. Decisão do usuário na exploração. Alternativas
descartadas: regra generalizada por sufixo "/R3" (convenção de nomenclatura
não confirmada) e flag nova em `usuario` (peso de banco e de gestão de
usuários desproporcional a um filtro).

**3. Casamento por igualdade exata** (`eq("responsavel_interno", valor)`),
consistente com os demais selects de valor único (cliente, operadora, tipo).
Substring via `ilike` foi descartada: seletor não digita termo livre.

**4. Layout: flex com larguras explícitas em `lg`.** O container atual
(`grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9`) passa a trocar para flex
em `lg` (`lg:flex lg:flex-nowrap` sobre o mesmo elemento — as classes de
grid-template ficam inertes sob flex), com: Código `w-24`, Operadora `w-28`,
UF `w-12`, Compatibilizados `w-24`, demais `flex-1`. Em mobile/md o grid atual
é mantido (10 filtros = duas linhas de 5 no md). `FiltroTexto` e
`FiltroSelect` passam a aceitar classe de largura opcional. Alternativa
descartada: `lg:grid-cols-10` uniforme — encolheria todos os filtros, quando o
pedido foi encolher especificamente os quatro com folga.

**5. Posição após "Operadora".** Espelha a ordem das colunas da tabela
(Operadora → Responsável → Tipo), como a coluna já faz desde
`2026-10-22-add-responsa-project`.

## Risks / Trade-offs

- [Consulta extra por perfil para as opções] → coluna única, sem filtros e
  cacheada por perfil; escala atual é modesta (paginação client-side, 50
  linhas/página).
- [Constante pode defasar se surgir nova conta interna] → consequência
  consciente da decisão 2; cobrir um novo nome é editar uma constante. Regra
  generalizada pode ser reavaliada se o padrão "/R3" vier a ser convenção.
- [`usuario.nome` não tem restrição de unicidade no esquema] → dois usuários
  homônimos colapsariam em uma opção e o `eq` retornaria os projetos de
  ambos; aceitável e idêntico ao comportamento atual da coluna exibida.
- [Responsável inativado continua nas opções enquanto tiver projeto] →
  correto: a fonte é a responsabilidade histórica dos projetos, não o quadro
  ativo de usuários.
- [`responsavel_interno` nulo (left join) nunca vira opção] → dedupe ignora
  nulos; "Todos" não aplica restrição, como nos demais selects.

## Migration Plan

Sem componente de banco: deploy de frontend e rollback por revert. Nenhuma
ordenação de implantação importa além de código e interface juntos numa
única entrega.

## Open Questions

Nenhum — as decisões de escopo e as alternativas foram fechadas na
exploração com o usuário.
