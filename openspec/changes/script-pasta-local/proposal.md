# Proposal: script-pasta-local

## Why

Os arquivos técnicos de cada projeto vivem em uma pasta local (unidade `P:\`) fora do sistema; hoje o código `F-AAAA-NNNN` é a única âncora para localizá-la, e o caminho completo mora na memória de cada um. Registrar a pasta no projeto e permitir abri-la com um clique elimina essa busca manual — sem mover o armazenamento de arquivos para dentro do sistema, preservando a filosofia atual.

## What Changes

- Novo campo opcional **Pasta local** (`projeto.pasta_local`, `varchar(500) null`), informado e corrigido pelo ADM no diálogo **Editar** do detalhe do projeto, disponível enquanto o status é `CADASTRADO`. O formulário "Novo projeto" permanece inalterado.
- A RPC `editar_identificadores_projeto` ganha o parâmetro opcional `p_pasta_local varchar default null` — campo vazio limpa a pasta, ausente preserva o vigente; a edição continua transacional, com um único evento. Chamadas com a assinatura antiga de 3 parâmetros seguem válidas durante o deploy (default), mas a assinatura antiga é dropada e o grant reemitido.
- Exibição da pasta no detalhe do projeto para ADM e OPER (não é dado financeiro), com botão **Copiar caminho** e botão **Abrir pasta**.
- **Abrir pasta** via protocolo **nativo do Windows** `search-ms:query=&crumb=location=<caminho codificado>` (Windows 11) — nada é instalado na máquina; o primeiro clique mostra a confirmação de protocolo externo do Google Chrome e o Windows posiciona o Explorador na pasta.
- Copiar caminho funciona sempre — caminho universal quando a confirmação é negada ou o protocolo está bloqueado por política do navegador.

## Capabilities

### New Capabilities

- `abertura-pasta-local`: mecanismo de abertura da pasta local a partir do navegador **sem instalação local** — emissão do link pelo protocolo nativo `search-ms` do Windows (restrito ao caminho validado), confirmação de protocolo externo do navegador na primeira ativação e cópia do caminho como caminho universal.

### Modified Capabilities

- `fluxo-projetos`: a edição cadastral em `CADASTRADO` passa a abranger também a pasta local opcional, com validação de caminho Windows, no-op quando nada muda e evento auditado; a criação de projeto não muda.
- `consulta-projetos`: o detalhe do projeto exibe a pasta local para ADM e OPER quando definida (com cópia), e indica ausência quando não definida.

## Impact

- **Supabase remoto (via MCP)**: `alter table projeto add column pasta_local`; recriação de `editar_identificadores_projeto` com nova assinatura + reemissão de grant + drop da assinatura antiga; recriação de `v_projetos_operacional` e `v_projetos_administrativo` (coluna acrescentada ao fim do select). `criar_projeto` não muda.
- **`banco.sql`**: referência declarativa atualizada (não é mecanismo de deploy).
- **Frontend**: `projeto-detalhe.tsx` (dialog "Editar" ganha o campo; exibição + copiar + abrir no card), `queries/fluxo.ts` (assinatura da mutation), `src/types/database.types.ts` (regenerado a partir do projeto remoto). `projeto-novo.tsx` não muda.
- **Nenhum artefato fora do app**: a abertura usa o protocolo nativo do Windows (`search-ms:`), registrado pelo próprio sistema — não há handler, instalador nem registro manual de protocolo; validação é manual em máquina Windows 11 com Google Chrome (ambiente homologado declarado).
- **Sem mudanças**: formulário "Novo projeto", listagem de projetos (nenhuma coluna nova), exportação CSV, dashboards, RLS (a coluna herda a política da tabela).
