# Design — script-pasta-local

## Context

O cadastro e o detalhe do projeto seguem o padrão RPC + views: o detalhe lê `v_projetos_administrativo` (ADM) ou `v_projetos_operacional` (OPER) com `select("*")`, e os tipos vêm de `database.types.ts` gerado do projeto remoto. A ação "Editar" (`DialogEditarIdentificadores`, em `projeto-detalhe.tsx`) já existe: ADM-only, exclusiva de `CADASTRADO`, uma única mutation `editar_identificadores_projeto` com no-op quando nada muda e um evento `ALTERACAO_CADASTRAL`. A abertura de pasta é um recurso **fora do app**: navegador não abre caminho local de página https, então o clique precisa de um handler registrado na máquina do usuário (Windows), instalável sem admin. Toda alteração de banco é pelo MCP Supabase; `banco.sql` é a referência declarativa final. Decisões do usuário: pasta criada **antes** do cadastro, caminhos Windows (`P:\...`), OPER visualiza, edição só ADM, **campo entra no diálogo "Editar" e não no formulário "Novo projeto"** (disponível a partir do status `CADASTRADO`), validação do handler manual em máquina **Windows 11 com Google Chrome** — ambiente homologado declarado.

## Goals / Non-Goals

**Goals:**

- Pasta local opcional definida/corrigida pelo ADM no diálogo "Editar", enquanto o projeto está em `CADASTRADO`, sempre auditada.
- Exibição da pasta no detalhe para ADM e OPER, com cópia universal e abertura por protocolo `fera-pasta`.
- Handler + instalador Windows por usuário, com validação restritiva do caminho recebido.

**Non-Goals:**

- Campo no formulário "Novo projeto" ou parâmetro em `criar_projeto` — a criação fica intocada.
- Edição da pasta fora de `CADASTRADO` (segue a mesma restrição dos identificadores).
- Pasta na listagem, filtros, CSV ou linha do tempo (só o detalhe).
- Handler para macOS/Linux/mobile; caminhos UNC (`\\servidor\...`) — o padrão declarado é letra de unidade.
- Validar a existência da pasta no servidor (o banco não enxerga a máquina do usuário).
- Armazenar arquivos no sistema.

## Decisions

### D1 — Coluna `pasta_local varchar(500) null` com check de caminho Windows
Anulável (opcional), limite de 500 caracteres e constraint que aceita `null` ou caminho iniciado por letra de unidade + `:\`, sem caracteres de controle e aparado nas pontas. A validação definitiva é da RPC; a constraint fecha a porta para escritas fora das RPCs, no padrão dos checks existentes (`projeto_valor_positivo`, `ordem_compra_numero_normalizada`). Alternativa considerada: validar só na RPC — rejeitada porque deixa o invariante da tabela sem guarda física.

### D2 — `editar_identificadores_projeto` ganha `p_pasta_local varchar default null`
Um parâmetro opcional a mais na RPC de edição cadastral, mantendo o clique de "Editar" como **uma única operação transacional com um único evento** — o mesmo contrato de hoje, estendido. Semântica do parâmetro: `null` (ausente) preserva o vigente; string vazia/só de espaços limpa a pasta (`nullif(btrim(...), '')` → grava `null`); caminho preenchido é trimado, validado (`^[A-Za-z]:\\`, sem caracteres de controle) e gravado. O no-op existente se estende: só retorna sem evento quando identificadores **e** pasta estiverem idênticos aos vigentes. **Ritual de troca de assinatura** (mesmo do `valor-projeto`): `create or replace` com 4 parâmetros, `grant execute` da nova assinatura e `drop function` da antiga de 3. Com `default null`, chamadas antigas de 3 parâmetros continuam válidas durante a janela de deploy — sem quebra de contrato, ao contrário do que ocorria com `p_valor`, que era obrigatório.

Alternativa considerada: RPC dedicada `definir_pasta_local` chamada em paralelo pelo diálogo — rejeitada: dois caminhos de escrita para um clique significam dois eventos possíveis na linha do tempo, risco de sucesso parcial (identificadores gravados, pasta não) e abandono do padrão de mutation única do diálogo.

### D3 — Views: `p.pasta_local` anexada ao fim do select das duas projeções
`v_projetos_operacional` e `v_projetos_administrativo` ganham a coluna ao final — `create or replace view` exige colunas novas após as existentes; grants são preservados. As duas consultam `projeto` direto e a coluna herda a visibilidade da view: OPER passa a ver a pasta, o que é desejado (não é financeiro). A listagem continua com `select("*")` — a coluna passa a chegar ao front, mas a UI da listagem/CSV simplesmente não a exibe (decisão de escopo, spec `consulta-projetos`).

### D4 — Detalhe: campo no diálogo "Editar" existente; exibição com copiar + abrir no card
- `DialogEditarIdentificadores` ganha o campo "Pasta local (opcional)" (`maxLength` 500), pré-preenchido com o valor vigente a cada abertura (mesmo padrão de pre-fill do diálogo); vazio é enviado como `''` (limpa). A descrição do diálogo passa a mencionar a pasta na alteração auditada. Nenhum botão ou diálogo novo de pasta: a ação "Editar" existente cobre tudo, e a restrição de status é herdada de graça.
- Exibição no card "Dados do projeto": caminho em `font-mono` (longos truncam com `title`), botão "Copiar" (`navigator.clipboard.writeText` + toast) e âncora **Abrir pasta** com `href="fera-pasta:abrir?caminho=" + encodeURIComponent(caminho)`. Visível para ADM e OPER (ambas as projeções têm a coluna); cancelado continua exibindo. Pasta ausente: "—" sem botões.
- `queries/fluxo.ts`: `editarIdentificadoresProjeto` ganha o parâmetro de pasta (string trimada; `''` limpa).

### D5 — Handler em PowerShell + instalador `.cmd`, registro `HKCU`
Esquema `fera-pasta:abrir?caminho=` (URI opaca: nada vira "host" na normalização do navegador). Diretório `handler-pasta-local/` no repositório:

- `abrir-pasta.ps1` — recebe a URL em `%1`, decodifica (até duas passadas: o Chrome re-codifica a URL ao despachar protocolos customizados) e valida: casa com `^[A-Za-z]:\\` e sem caracteres de controle; falhou, encerra sem abrir nada. Válido: `Start-Process explorer.exe` com o caminho. Nenhuma outra execução com o conteúdo recebido.
- `instalar.cmd` — cria `HKCU\Software\Classes\fera-pasta` (`URL Protocol` vazio) com `shell\open\command` apontando para `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<caminho do ps1>" "%1"`; caminho do ps1 resolvido relativo ao instalador. Por usuário: sem elevação.
- `remover.cmd` — `reg delete` da chave.
- `README.md` — instalação, primeiro clique (diálogo do Chrome), remoção, ambiente homologado (Windows 11 + Google Chrome) e limitações (letra de unidade).

Alternativa considerada: executável assinado — rejeitado por custo/signing; PowerShell resolve e é auditável. Registro em `HKLM` — rejeitado por exigir admin por máquina.

### D6 — Tipos regenerados pelo MCP
`database.types.ts` regenerado após as views mudarem; as colunas fluem para `ProjetoOperacional` e `ProjetoAdministrativo` sem mudança de query (`select("*")`).

## Risks / Trade-offs

- [Pasta errada não pode ser corrigida após o envio] → consequência direta de restringir a edição a `CADASTRADO` (mesma regra dos identificadores, decisão do usuário). O detalhe continua exibindo o caminho registrado; abrir exceção de correção tardia seria mudança futura.
- [Handler não instalado em todas as máquinas] → cópia universal cobre o caso; distribuição do instalador é manual (sem canal de push pela web), documentada no README. Botão abrir degrada graciosamente no diálogo padrão do navegador.
- [Qualquer site pode invocar `fera-pasta:` com o handler instalado] → o Chrome confirma no primeiro uso por site; o pior caso é abrir um diretório. O handler valida letra de unidade e não executa nada além do Explorer, limitando o dano. Aceito como risco baixo.
- [O Chrome re-codifica a URL do protocolo] → handler decodifica até duas passadas antes de validar; caminho que continuar inválido é descartado sem abrir.
- [Caminho digitado errado persiste e o Explorer falha silenciosamente] → correção é barata enquanto o projeto está em `CADASTRADO` (reabrir "Editar"); sem tentativa de validar existência pelo lado do servidor, que não enxerga a máquina.
- [Semântica nulo-vs-vazio no parâmetro da RPC] → ausente preserva (compatibilidade com chamadas de 3 parâmetros), vazio limpa (intuição da UI: o campo vem pré-preenchido, apagar e salvar significa remover). Documentado na spec e no comentário da RPC.
- [Eventos repetidos se a edição for repetida sem mudanças] → no-op quando identificadores e pasta estão idênticos; mesmo trade-off já aceito.
- [Função antiga não dropada deixa RPC órfã concedida] → drop explícito na migração + verificação consultando `pg_proc` pela assinatura antiga.

## Migration Plan

Pelo MCP Supabase, nesta ordem:

1. `alter table public.projeto add column pasta_local varchar(500)` + constraint de caminho Windows (anulável).
2. `create or replace function editar_identificadores_projeto(...)` com `p_pasta_local varchar default null`; `grant execute` da nova assinatura de 4 parâmetros; `drop function` da assinatura antiga de 3.
3. `create or replace view v_projetos_operacional` e `v_projetos_administrativo` com `p.pasta_local` no fim.
4. Regenerar `database.types.ts`; atualizar o front (diálogo "Editar", card do detalhe, `queries/fluxo.ts`).
5. Atualizar `banco.sql` para o estado final.
6. Criar `handler-pasta-local/` (ps1, instalar.cmd, remover.cmd, README) — validação manual em máquina Windows pelo usuário.

Rollback: recriar as views sem a coluna, recriar `editar_identificadores_projeto` antigo (3 parâmetros) e dropar o novo, `drop column pasta_local` (dados de pasta são redigitáveis — baixo custo). O handler é removido por `remover.cmd`, sem relação com o banco.
