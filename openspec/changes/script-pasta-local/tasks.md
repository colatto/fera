# Tasks — script-pasta-local

## 1. Banco (MCP Supabase)

- [x] 1.1 Verificar conexão do MCP com o projeto remoto correto e inspecionar o estado atual de `projeto`, `editar_identificadores_projeto` e das duas views (conferir que a coluna ainda não existe)
- [x] 1.2 `alter table public.projeto add column pasta_local varchar(500)` + constraint: `null` ou `btrim` estável, casando `^[A-Za-z]:\\` e sem caracteres de controle
- [x] 1.3 `create or replace function editar_identificadores_projeto(p_id bigint, p_identificador_cliente varchar, p_identificador_operadora varchar, p_pasta_local varchar default null)` — guarda ADM + status `CADASTRADO` como hoje; trim: `null` preserva o vigente, vazio limpa, caminho preenchido valida `^[A-Za-z]:\\` sem caracteres de controle; no-op somente quando identificadores e pasta estiverem idênticos aos vigentes; `update` atômico + um único evento `ALTERACAO_CADASTRAL` quando algo muda
- [x] 1.4 `grant execute` da nova assinatura de 4 parâmetros e `drop function` da assinatura antiga de 3; confirmar em `pg_proc` que só a nova existe e está concedida
- [x] 1.5 `create or replace view v_projetos_operacional` e `v_projetos_administrativo` com `p.pasta_local` anexada ao fim do select; conferir que os grants de select das views foram preservados

## 2. Referência declarativa e tipos

- [x] 2.1 Atualizar `banco.sql` com o estado final: coluna + constraint na tabela, `editar_identificadores_projeto` com nova assinatura, grants e as duas views — `criar_projeto` permanece como está
- [x] 2.2 Regenerar `src/types/database.types.ts` pelo MCP (`generate_typescript_types`) e conferir que `pasta_local` aparece nas duas projeções

## 3. Frontend — detalhe

- [x] 3.1 `src/queries/fluxo.ts`: `editarIdentificadoresProjeto` ganha o parâmetro da pasta (string trimada; `''` significa limpar) na chamada da RPC
- [x] 3.2 `DialogEditarIdentificadores` ganha o campo "Pasta local (opcional)" (`maxLength` 500), pré-preenchido com o valor vigente a cada abertura; identificadores continuam obrigatórios; pasta preenchida valida `^[A-Za-z]:\\` sem caracteres de controle, bloqueando antes da RPC; descrição do diálogo passa a mencionar a pasta
- [x] 3.3 Linha "Pasta local" no card "Dados do projeto" — caminho em `font-mono` com truncamento, visível para ADM e OPER, "—" quando ausente, cancelado incluído
- [x] 3.4 Botão "Copiar" com `navigator.clipboard.writeText` + toast de confirmação, disponível para qualquer perfil quando a pasta existe
- [x] 3.5 Âncora "Abrir pasta" com `href="search-ms:query=&crumb=location=" + encodeURIComponent(caminho)`, somente quando a pasta existe e o caminho casa com o padrão validado

## 4. Verificação

- [x] 4.1 Via MCP: consultas de sanidade nas duas views retornando `pasta_local` para um projeto existente; constraint recusa caminho inválido; RPC: edição definindo pasta, limpar pasta com campo vazio, no-op com tudo idêntico, recusa fora de `CADASTRADO` e por não ADM
- [x] 4.2 `npm run build` (`tsc -b && vite build`) passando sem erro
- [x] 4.3 Revisão dos cenários das specs contra a implementação (edição com/sem pasta, limpar, inválidos, no-op, permissões e status, exibição por perfil, cópia, ausência na listagem/CSV)
- [ ] 4.4 Entregar ao usuário o roteiro de validação manual em máquina Windows 11 com Google Chrome (ambiente homologado): primeira abertura com a confirmação de protocolo do Chrome, janela do Explorador posicionada na pasta — incluindo caminho com espaços e acentos —, aberturas seguintes diretas, confirmação negada sem erro na aplicação, cópia do caminho como alternativa e nenhuma instalação necessária; ajustar a codificação da âncora se o caminho chegar distorcido (o Chrome pode re-codificar ao despachar o protocolo)
