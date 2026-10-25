# Proposal

## Why

O valor de um projeto é digitado no momento da criação e hoje é imutável: um erro de digitação só pode ser corrigido cancelando o projeto e criando outro, o que desperdiça um número da sequência anual e polui o histórico. Enquanto o projeto está em `CADASTRADO` ele ainda não entrou no fluxo financeiro (sem envio, OC, nota ou recebimento), então corrigir o valor nessa janela é seguro e não gera nenhuma inconsistência contábil.

## What Changes

- O diálogo "Editar" do detalhe do projeto (já restrito a `CADASTRADO` e ADM) passa a incluir um campo **Valor (R$)** pré-preenchido com o valor vigente, além dos identificadores e da pasta local.
- O valor submetido é validado localmente como monetário e positivo, no mesmo padrão da criação.
- A RPC `editar_identificadores_projeto` ganha o parâmetro `p_valor` (`numeric`, ausente preserva o vigente), com atualização transacional do valor junto aos demais campos.
- Quando o valor muda, a linha do tempo registra um evento dedicado **"Alteração do valor"** — novo valor de enum `ALTERACAO_VALOR` — sem detalhes dos montantes, visível também para OPER apenas como rótulo.
- Mudança de valor e mudança cadastral num mesmo envio gravam um evento por natureza ("Alteração cadastral" + "Alteração do valor"); envio idêntico aos vigentes continua sendo no-op.
- A imutabilidade do valor permanece para todo status fora de `CADASTRADO` (inclusive após cancelamento, que continua preservando o valor gravado).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: três requisitos mudam — "Criação de projeto" perde a frase de imutabilidade absoluta do valor; "Imutabilidade do valor do projeto" passa a permitir alteração exclusivamente na janela `CADASTRADO` por ADM; "Edição de identificadores em CADASTRADO" passa a cobrir também o campo Valor, sua validação, o parâmetro da RPC e o evento "Alteração do valor".

## Impact

- **Banco (via MCP Supabase; `banco.sql` como referência versionada)**: novo valor de enum em `project_event_type`, parâmetro `p_valor` na RPC `editar_identificadores_projeto`, grant de execute com a assinatura nova.
- **Front-end**: diálogo de edição em `src/routes/projetos/projeto-detalhe.tsx` (campo Valor e validação), wrapper em `src/queries/fluxo.ts`, rótulo em `src/lib/constantes.ts`, tipos em `src/types/database.types.ts`.
- **Sem impacto**: projeções de consulta (`v_projetos_administrativo`/`v_projetos_operacional`), dashboards (leem o valor vivo), nota fiscal e recebimentos (a nota fotografa o valor só na emissão, que ocorre após a janela editável), spec `consulta-projetos` (OPER já vê todos os tipos de evento pela view, sem mudança).
