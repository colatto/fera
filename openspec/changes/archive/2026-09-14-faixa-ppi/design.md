## Context

O ambiente operacional é o projeto remoto do Supabase, alterado exclusivamente via MCP Supabase; `banco.sql` é apenas a referência declarativa versionada (ver config do OpenSpec). Estado atual do remoto, após a limpeza executada antes desta mudança: zero projetos, eventos, notas, recebimentos e autorizações; quatro tipos de projeto — Torre (1–200, `proximo_numero` 8), Estrutural (201–400, 202), collo (401–500, 401) e PPI (1001–3000, 2004). A constraint `tipo_faixa_valida` vigente usa a fronteira antiga (não-PPI 0–1000, PPI ≥ 1001). Dois triggers limitam a migração: `tipo_proximo_automatico` (contador monotônico, proíbe redução manual; auto-eleva o contador quando a faixa inicial sobe acima dele) e `evento_imutavel` (não afeta este change).

Ver motivação em proposal.md; requisitos novos em specs/cadastros-basicos/spec.md.

## Goals / Non-Goals

**Goals:**
- Fronteira única 0–5000 (não-PPI) / 5001 (PPI) consistente entre constraint do banco, validação local do formulário, mensagens de erro e documentação.
- Tipo PPI existente em 5001–7000 com contador em 5001, sem nenhuma renumeração de projeto (não há mais projetos).
- Contadores não-PPI resetados para o início da própria faixa.

**Non-Goals:**
- Não altera `criar_projeto`, views, RLS nem qualquer outra função do banco.
- Não recadastra projetos nem restaura dados apagados.
- Não muda a regra geral de PPI com faixa final opcional — o 7000 é o valor do tipo existente, não da constraint.

## Decisions

1. **Migrar a faixa do PPI em vez de aboli-la na constraint.** Com a base sem projetos, mover a linha existente para 5001–7000 mantém a constraint limpa, sem exceção por id. Alternativa descartada: grandfather clause na constraint — sujaria a regra e permitiria novos tipos PPI abaixo de 5001 caso o tipo atual fosse apagado.

2. **`faixa_final` do PPI = 7000** (decisão do usuário), preservando a largura efetiva de 2000 números que a faixa antiga tinha. A constraint continua aceitando final nulo para outros tipos PPI, como hoje.

3. **Ordem de migração dentro de uma única transação**: (a) mover a faixa do PPI para 5001–7000 — o trigger `tipo_proximo_automatico` eleva o contador de 2004 para 5001 sozinho e o estado ainda satisfaz a constraint antiga (5001 ≥ 1001); (b) desabilitar o trigger, resetar `proximo_numero = faixa_inicial` dos não-PPI e reabilitá-lo — o reset satisfaz ambas as constraints porque a faixa não muda; (c) por último, drop + add da `tipo_faixa_valida` com a nova fronteira — só neste ponto a linha do PPI satisfaz a nova regra. A ordem inversa (constraint primeiro) falharia com violação de check na linha do PPI.

4. **Reset dos contadores não-PPI via desabilitação temporária do trigger**, tudo na mesma transação (`alter table ... disable trigger` é transacional). Alternativa descartada: manter 8/202 — deixaria números fantasma numa base sem projetos, contra a intenção de recomeço limpo decidida pelo usuário.

5. **Frontend espelha apenas os valores da fronteira**: limites e mensagens em `cadastros-tipos.tsx`, textos em `formato.ts`, default de faixa final de novo tipo não-PPI 1000 → 5000, auto-fill PPI 1001 → 5001. Nenhuma mudança estrutural de validação.

6. **`banco.sql` e `requisitos.md` atualizados como referência**, sem caráter de deploy.

## Risks / Trade-offs

- [Transação interrompida no meio] → todo o bloco roda em um único `execute_sql` com begin/commit; qualquer falha faz rollback completo; conferir contagens e `tg_enabled` dos triggers ao final.
- [Trigger de contadores permanecer desabilitado] → reabilitá-lo no mesmo bloco e verificar `pg_trigger.tgenabled` na verificação pós-migração.
- [Valor antigo esquecido no código/docs] → grep por `1001` e `0–1000`/`0 e 1000` no repo após a edição; os únicos pontos mapeados são os listados nas tasks.
- [Constraint nova rejeita linha existente] → base vazia de projetos e tipos conhecidos satisfazem a nova regra; a verificação pré-commit é a própria ordem de migração (decisão 3).
- [Rollback após criação de novos projetos] → só é trivial enquanto nenhum projeto for criado; após isso, reverter exigiria reavaliar contadores/faixas — documentado aqui como janela de segurança.

## Open Questions

(nenhuma — faixa final 7000 e reset dos contadores foram decididos pelo usuário.)
