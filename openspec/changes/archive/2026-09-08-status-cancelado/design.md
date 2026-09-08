## Context

A transição para `CANCELADO` é executada exclusivamente pela RPC `alterar_status_projeto` (ver `banco.sql:162-173`), que hoje aceita o cancelamento a partir de qualquer status ativo, exigindo apenas motivo não vazio. Na interface, o botão "Cancelar projeto" é exibido quando `!cancelado` (`src/routes/projetos/projeto-detalhe.tsx`, bloco de ações do cabeçalho), ou seja, em todos os status menos `CANCELADO` — inclusive `PAGO`. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Restringir o cancelamento ao status `CADASTRADO` no banco (fonte da verdade) e na interface.
- Manter inalterados: exigência de motivo, evento de auditoria `ALTERACAO_STATUS`, bloqueio de ações em projeto `CANCELADO`, e permissão de cancelamento para ADM e OPER.

**Non-Goals:**

- Não criar mecanismo de reversão de status nem cancelamento "administrativo" para projetos avançados.
- Não alterar quem pode cancelar (papel ADM/OPER) nem a regra de substituição em si.
- Não mexer em outras transições da mesma RPC (a regra `CADASTRADO → ENVIADO` permanece).

## Decisions

1. **Enforcement no banco, condição na transição existente.** Na função `alterar_status_projeto`, a branch de cancelamento passa a exigir `v.status = 'CADASTRADO'`:

   ```sql
   elsif p_novo = 'CANCELADO' and v.status = 'CADASTRADO' and nullif(btrim(p_motivo),'') is not null then ...
   ```

   Alternativa considerada: validar só no frontend — rejeitada porque a RPC é a única porta de escrita de status e qualquer cliente poderia contornar a UI; o banco é onde todas as demais validações de fluxo já vivem (OC requer ENVIADO, nota requer autorização etc.), então o cancelamento segue o mesmo padrão.

2. **Mensagem de erro específica.** O cancelamento fora de `CADASTRADO` cai no `else` da função, que hoje levanta `Transição manual não autorizada`. Em vez de reutilizar essa mensagem genérica, acrescenta-se tratamento dedicado com erro claro (ex.: `Cancelamento exige projeto em status CADASTRADO`), para que o usuário entenda a regra e não confunda com erro de permissão. A interface já exibe a mensagem transacional do banco sem tratamento especial.

3. **Botão de cancelar apenas no branch `CADASTRADO` da UI.** O botão "Cancelar projeto" deixa de ficar no bloco comum `!cancelado` e passa a ser renderizado junto de "Enviar projeto", dentro do branch `status === "CADASTRADO"`. Alternativa considerada: botão sempre visível porém desabilitado — rejeitada porque o padrão da página já é renderizar condicionalmente as ações de cada status, e um botão desabilitado sem explicação não comunica a regra.

4. **Consequência na substituição: aceita e documentada.** Como `criar_projeto` exige predecessor `CANCELADO`, a substituição passa a valer apenas para projetos que nunca saíram de `CADASTRADO`. Decisão do negócio registrada no proposal; nenhum caminho de reversão é criado.

5. **Implantação da função via MCP Supabase.** Conforme as operações do projeto, a alteração da função é aplicada no projeto remoto pelo MCP Supabase (`create or replace function`), e `banco.sql` é atualizado como referência declarativa versionada — não é mecanismo de deploy.

## Risks / Trade-offs

- [Projetos avançados que precisassem ser desfeitos ficam sem saída no sistema] → Decisão de negócio consciente (proposal); casos excepcionais tratados fora do sistema.
- [Cliente desatualizado (cache) ainda exibe o botão em outros status] → A chamada falha na RPC com erro transacional claro; estado permanece inalterado, conforme o requisito.
- [Testes manuais dependem de projetos em cada status] → A verificação se concentra em dois pontos: cancelar projeto `CADASTRADO` (sucesso) e tentar cancelar projeto `ENVIADO`+ (falha com mensagem específica); os demais status usam o mesmo caminho de código.
