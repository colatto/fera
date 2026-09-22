# Proposal: script-pasta-local

## Why

Os arquivos técnicos de cada projeto vivem em uma pasta local (unidade `P:\`) fora do sistema; hoje o código `F-AAAA-NNNN` é a única âncora para localizá-la, e o caminho completo mora na memória de cada um. Registrar a pasta no projeto e permitir abri-la com um clique elimina essa busca manual — sem mover o armazenamento de arquivos para dentro do sistema, preservando a filosofia atual.

## What Changes

- Novo campo opcional **Pasta local** (`projeto.pasta_local`, `varchar(500) null`), informado e corrigido pelo ADM no diálogo **Editar** do detalhe do projeto, disponível enquanto o status é `CADASTRADO`. O formulário "Novo projeto" permanece inalterado.
- A RPC `editar_identificadores_projeto` ganha o parâmetro opcional `p_pasta_local varchar default null` — campo vazio limpa a pasta, ausente preserva o vigente; a edição continua transacional, com um único evento. Chamadas com a assinatura antiga de 3 parâmetros seguem válidas durante o deploy (default), mas a assinatura antiga é dropada e o grant reemitido.
- Exibição da pasta no detalhe do projeto para ADM e OPER (não é dado financeiro), com botão **Copiar caminho** e botão **Abrir pasta**.
- **Abrir pasta** via protocolo customizado `fera-pasta:abrir?caminho=...` + handler local por máquina (Windows 11), instalado por usuário sem admin; o primeiro clique mostra a confirmação de protocolo do Google Chrome ("Abrir pasta?").
- Copiar caminho funciona sempre — fallback universal caso o handler não esteja instalado.

## Capabilities

### New Capabilities

- `abertura-pasta-local`: mecanismo de abertura da pasta local a partir do navegador — emissão do link pelo protocolo `fera-pasta`, contrato do handler local (decodificar, validar caminho com letra de unidade, abrir o Explorer), instalador por usuário e fallback de cópia.

### Modified Capabilities

- `fluxo-projetos`: a edição cadastral em `CADASTRADO` passa a abranger também a pasta local opcional, com validação de caminho Windows, no-op quando nada muda e evento auditado; a criação de projeto não muda.
- `consulta-projetos`: o detalhe do projeto exibe a pasta local para ADM e OPER quando definida (com cópia), e indica ausência quando não definida.

## Impact

- **Supabase remoto (via MCP)**: `alter table projeto add column pasta_local`; recriação de `editar_identificadores_projeto` com nova assinatura + reemissão de grant + drop da assinatura antiga; recriação de `v_projetos_operacional` e `v_projetos_administrativo` (coluna acrescentada ao fim do select). `criar_projeto` não muda.
- **`banco.sql`**: referência declarativa atualizada (não é mecanismo de deploy).
- **Frontend**: `projeto-detalhe.tsx` (dialog "Editar" ganha o campo; exibição + copiar + abrir no card), `queries/fluxo.ts` (assinatura da mutation), `src/types/database.types.ts` (regenerado a partir do projeto remoto). `projeto-novo.tsx` não muda.
- **Novo artefato fora do app**: script do handler + instalador Windows (por usuário, `HKCU`), versionados no repositório com instruções; validação é manual em máquina Windows 11 com Google Chrome (ambiente homologado declarado).
- **Sem mudanças**: formulário "Novo projeto", listagem de projetos (nenhuma coluna nova), exportação CSV, dashboards, RLS (a coluna herda a política da tabela).
