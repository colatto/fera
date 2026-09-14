## 1. Migração no banco remoto (MCP Supabase)

- [x] 1.1 Confirmar que o MCP Supabase está conectado ao projeto remoto correto.
- [x] 1.2 Em uma única transação: mover a faixa do tipo PPI para 5001–7000 (o trigger `tipo_proximo_automatico` eleva o contador para 5001); desabilitar o trigger, resetar `proximo_numero = faixa_inicial` dos tipos não-PPI e reabilitá-lo; dropar a constraint `tipo_faixa_valida` e recriá-la com não-PPI 0–5000 (final obrigatória) e PPI a partir de 5001 (final opcional).
- [x] 1.3 Verificar pós-migração: Torre 1–200 com contador 1, Estrutural 201–400 com 201, collo 401–500 com 401, PPI 5001–7000 com 5001; constraint nova presente; trigger `tipo_proximo_automatico` habilitado (`pg_trigger.tgenabled`).

## 2. Referência declarativa e requisitos

- [x] 2.1 Atualizar a constraint `tipo_faixa_valida` em `banco.sql` para a fronteira 0–5000 / 5001.
- [x] 2.2 Atualizar a regra de faixa em `requisitos.md` (não-PPI `0–5000`, PPI começa em `5001`).

## 3. Frontend

- [x] 3.1 Em `src/routes/cadastros/cadastros-tipos.tsx`: validação local (PPI exige faixa inicial ≥ 5001; não-PPI exige faixa entre 0 e 5000 com final obrigatória até 5000), default de faixa final para novo tipo não-PPI 1000 → 5000, auto-preenchimento PPI 1001 → 5001 e texto de ajuda da faixa.
- [x] 3.2 Em `src/lib/formato.ts`: mensagem da constraint `tipo_faixa_valida` com a nova fronteira (PPI a partir de 5001, demais 0–5000).

## 4. Verificação

- [x] 4.1 Grep por resíduos da fronteira antiga (`1001`, `0–1000`, `0 e 1000`, `> 1000`, `?? 1000`) em `src/`, `banco.sql` e `requisitos.md`.
- [x] 4.2 Build e smoke test da tela de tipos: novo tipo não-PPI aceita faixa até 5000; digitar `PPI` auto-preenche 5001 e limpa o final; violar a regra exibe a mensagem traduzida.
