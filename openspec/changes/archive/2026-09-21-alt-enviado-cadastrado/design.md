## Context

O fluxo de status é executado exclusivamente por RPCs transacionais no banco; `alterar_status_projeto` (banco.sql:161) é o único ponto de transição manual e hoje aceita apenas `CADASTRADO → ENVIADO` e `CADASTRADO → CANCELADO` (com motivo). Todo o resto cai no erro `"Transição manual não autorizada"`. No frontend, as ações do fluxo usam o hook `useAcaoFluxo` (sem aplicação otimista, invalidação pós-confirmação — ver comentários em `src/queries/fluxo.ts`), e as ações do detalhe vivem em blocos condicionais por status em `projeto-detalhe.tsx`. O cancelamento de projeto já tem diálogo de confirmação no detalhe (`setCancelando`), padrão a reaproveitar.

Em `ENVIADO` o projeto não tem OC, centro de custo, autorização, nota nem recebimentos — esses atributos só são gravados nas transições seguintes, que também mudam o status. O único dado residual do envio é `data_envio`.

## Goals / Non-Goals

**Goals:**
- Permitir desfazer o envio (`ENVIADO → CADASTRADO`) para ADM e OPER, com confirmação na interface.
- Manter os dashboards consistentes após a reversão (projeto revertido deixa de contar como enviado).
- Zero mudança de assinatura, grants, tipos gerados ou schema de tabelas.

**Non-Goals:**
- Reversões a partir de `OC_REGISTRADA` ou posteriores (envolveriam desvincular OC e/ou centro de custo, imutável por spec).
- Motivo obrigatório ou opcional na reversão — decisão do usuário: sem motivo.
- Alterar a semântica de `data_envio` para projetos que não foram revertidos.

## Decisions

**D1 — Reaproveitar `alterar_status_projeto` com um novo `elsif`, em vez de RPC nova.** É o gateway único das transições manuais; o grant execute (banco.sql:308) já cobre a função e não muda, `database.types.ts` permanece válido e a gravação do evento `ALTERACAO_STATUS` no fim da função é reaproveitada sem código novo. Alternativa descartada: RPC dedicada `reverter_envio_projeto` — duplicaria o padrão de evento e exigiria grant e tipos novos para o mesmo efeito.

O novo branch entra antes do `else`, entre o envio e os branches de cancelamento (condições disjuntas por `p_novo`, a ordem entre eles é indiferente):

```sql
elsif p_novo = 'CADASTRADO' and v.status = 'ENVIADO' then
  update public.projeto set status = p_novo, data_envio = null where id = p_id;
```

A recusa de estados inválidos cai no `else` existente; a mensagem do spec ("a reversão exige status `ENVIADO`") vem da interface ao tratar o erro transacional.

**D2 — Limpar `data_envio` na reversão, em vez de filtrar por status nos indicadores.** "Enviados sem OC" conta `data_envio is not null and ordem_compra_id is null and status <> 'CANCELADO'` (banco.sql:269): mantendo a data, um projeto revertido continuaria contando como enviado. Limpar a data corrige os dois indicadores e a exibição (coluna "Envio" na listagem, campo no detalhe) de uma vez, sem espalhar a regra pelos consumidores. O re-envio posterior grava a data nova pelo `coalesce(p_data_envio, current_date)` já existente. Alternativa descartada: preservar a data como histórico — o histórico do envio já fica na linha do tempo pelos eventos.

**D3 — Permissão: manter `usuario_ativo()`, sem exigir ADM.** Simetria com o envio (spec: "A interface MUST oferecer envio a ADM e OPER"): quem pode comprometer o projeto pode desfazer o compromisso. Nenhuma alteração no guard da RPC; a interface oferece o botão a ambos os perfis em `ENVIADO`.

**D4 — Botão "Cancelar envio" com diálogo de confirmação no detalhe, seguindo o padrão do "Cancelar projeto".** Estado local `setRevertendo` + diálogo de confirmação (sem campo de texto) + mutation via `useAcaoFluxo(() => retornarEnvio(id))`; a invalidação genérica pós-fluxo já cobre listagem, detalhe, eventos e dashboards. Posicionado à esquerda de "Ordem de compra" no bloco exclusivo de `ENVIADO`; visível a ADM e OPER (o bloco "Ordem de compra" continua restrito a ADM). Sem aplicação otimista: sucesso exibe toast e o estado muda só pós-RPC; falha exibe a mensagem do banco.

## Risks / Trade-offs

- [Usuário OPER desfaz envio que o ADM já comunicou ao cliente] → Ação tem confirmação explícita e fica auditada na linha do tempo (autor e data); risco aceito como custo da simetria com o envio.
- [`data_envio` limpa perde a referência da data original fora da linha do tempo] → O evento `ENVIADO → CADASTRADO` preserva quando o envio ocorreu via histórico de eventos; exibição sem data é coerente com o status.
- [Chamada direta à RPC fora da interface em status inválido] → Recusada pelo banco no `else` existente; nenhuma superfície nova de abuso (mesma permissão `usuario_ativo()` vigente).

## Migration Plan

1. Atualizar `banco.sql` (referência declarativa) e aplicar `create or replace function public.alterar_status_projeto(...)` pelo MCP Supabase no projeto remoto — mudança aditiva de comportamento, sem dados a migrar; rollback é re-aplicar a versão anterior da função.
2. Frontend: wrapper `retornarEnvio` em `src/queries/fluxo.ts`, botão + diálogo em `projeto-detalhe.tsx`; nenhum tipo gerado muda.
