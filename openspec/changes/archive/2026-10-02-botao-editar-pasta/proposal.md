# Proposal

## Why

A pasta local de um projeto só pode ser escrita pela RPC `editar_identificadores_projeto`, que exige status `CADASTRADO`: um projeto que avança no fluxo (até Pago) sem pasta cadastrada fica sem como incluir ou corrigir o caminho depois. Além disso, o botão Copiar do caminho é redundante para a operação e será substituído pela ação de edição na mesma posição.

## What Changes

- **BREAKING**: o botão **Copiar** da linha "Pasta local" no detalhe do projeto deixa de existir para todos os perfis (ADM e OPER) — a spec atual exige cópia universal, inclusive em projeto cancelado.
- Novo botão **"Editar"** na linha "Pasta local", somente para ADM, que abre um diálogo exclusivo da pasta: permite **alterar** o caminho existente ou **incluir** um quando não há (campo único, pré-preenchido com o caminho vigente, vazio limpa).
- O botão fica visível em **todos os status, exceto Cancelado**; em `CADASTRADO` fica **oculto** porque o "Editar" do cabeçalho já edita a pasta junto com os identificadores.
- Nova RPC `editar_pasta_local` no Supabase: exige ADM, recusa apenas status `CANCELADO`, valida o caminho como a RPC atual (padrão Windows `X:\`, sem caracteres de controle, 500 caracteres), não altera nada quando o valor é idêntico ao vigente e grava um único evento `Alteração cadastral` na linha do tempo quando muda.
- O botão "Abrir pasta" (protocolo `search-ms`) permanece exatamente como está, com a mesma regra de emissão por caminho válido.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `consulta-projetos`: o requisito "Pasta local no detalhe do projeto" perde a exigência de cópia universal do caminho (requisito reescrito e cenários de cópia removidos/ajustados); a exibição do caminho e a ausência neutra quando não definida permanecem.
- `abertura-pasta-local`: a cópia deixa de ser o "caminho universal" e fallback da abertura — propósito ajustado e cenários de confirmação negada/protocolo bloqueado e de caminho fora do padrão reescritos sem referência à cópia.
- `fluxo-projetos`: novo requisito de edição da pasta local — ação rotulada "Editar" na linha da pasta, ADM, qualquer status exceto `CANCELADO`, oculta em `CADASTRADO`, RPC dedicada `editar_pasta_local` com as regras de validação e de evento. O requisito atual "Edição de identificadores em CADASTRADO" permanece intocado.

## Impact

- **Frontend**: `src/routes/projetos/projeto-detalhe.tsx` (linha da pasta: remove Copiar, adiciona Editar por perfil/status, novo diálogo de pasta), `src/queries/fluxo.ts` (nova função de mutação chamando a RPC).
- **Banco (Supabase remoto via MCP)**: criação da função `public.editar_pasta_local(bigint, varchar)` e do `grant execute` correspondente; `banco.sql` atualizado como referência declarativa versionada (não é mecanismo de deploy).
- **Specs**: três capacidades modificadas (`consulta-projetos`, `abertura-pasta-local`, `fluxo-projetos`).
- **Sem mudança**: views, RLS, fluxo de status, listagem, exportação CSV e a RPC `editar_identificadores_projeto`.
