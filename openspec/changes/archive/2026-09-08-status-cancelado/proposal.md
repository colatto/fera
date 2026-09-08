## Why

Hoje um projeto pode ser cancelado em qualquer status ativo do fluxo (inclusive `PAGO`), tanto na interface quanto na RPC `alterar_status_projeto`. Cancelar um projeto que já avançou no fluxo (enviado, com OC, nota emitida ou pago) distorce o histórico financeiro e operacional; o cancelamento deve ser uma correção de cadastro, possível apenas antes de o projeto entrar no fluxo.

## What Changes

- **BREAKING** A RPC `alterar_status_projeto` passa a aceitar a transição para `CANCELADO` somente quando o status atual do projeto for `CADASTRADO`; tentativas a partir de `ENVIADO`, `OC_REGISTRADA`, `AUTORIZADO_FATURAMENTO`, `NOTA_EMITIDA` ou `PAGO` falham com erro transacional.
- A interface do detalhe do projeto passa a oferecer o botão "Cancelar projeto" somente quando o status for `CADASTRADO` (junto da ação "Enviar projeto"); demais status não exibem a ação.
- A exigência de motivo para cancelar permanece inalterada, assim como quem pode cancelar (ADM e OPER).
- Consequência aceita: a substituição de projeto (que exige predecessor `CANCELADO`) passa a valer apenas para projetos que nunca avançaram de `CADASTRADO`.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o requisito "Cancelamento com motivo" passa a restringir o cancelamento ao status `CADASTRADO`, na interface e na RPC `alterar_status_projeto`.

## Impact

- **Banco (Supabase, via MCP)**: função `alterar_status_projeto` em `banco.sql` (referência declarativa) e no projeto remoto — condição da transição para `CANCELADO` e mensagem de erro para status não permitido.
- **Frontend**: `src/routes/projetos/projeto-detalhe.tsx` — visibilidade do botão "Cancelar projeto" (hoje controlada por `!cancelado`).
- **Comportamento existente preservado**: motivo obrigatório, evento de auditoria `ALTERACAO_STATUS`, bloqueio de ações em projeto `CANCELADO`.
