## 1. Banco de dados (via MCP Supabase)

- [x] 1.1 `apply_migration`: dropar e recriar a constraint `tipo_torre_limite_parcelas` em `public.tipo_projeto` com a nova condição `check (lower(nome) <> 'torre' or limite_parcelas between 1 and 3)` (drop + add no mesmo lote)
- [x] 1.2 Verificar via `execute_sql` que os dados existentes (Estrutural=1, Torre=3) satisfazem a nova constraint e que o nome da constraint foi preservado

## 2. Formulário de tipos de projeto

- [x] 2.1 Em `src/routes/cadastros/cadastros-tipos.tsx`, renderizar o campo "Limite de parcelas" como `Select` com opções 1, 2 e 3 quando `lower(nome) === "torre"`, mantendo o input numérico livre para os demais nomes (design D2)
- [x] 2.2 Ajustar `validarTipo`: para Torre, bloquear valor fora de 1..3 com mensagem "O tipo Torre deve ter limite de parcelas entre 1 e 3." (design D4)
- [x] 2.3 Confirmar que o valor NÃO é alterado ao renomear para Torre (Select sem opção correspondente e bloqueio no salvar) — sem lógica de reset (design D3)
- [x] 2.4 Atualizar a descrição do diálogo ("O tipo Torre exige limite de 3 parcelas." → "entre 1 e 3") e o comentário de regras no topo do arquivo

## 3. Mensagens e documentação

- [x] 3.1 Em `src/lib/formato.ts`, atualizar o texto de `tipo_torre_limite_parcelas` para "O tipo Torre exige limite de parcelas entre 1 e 3." (mantendo a chave)
- [x] 3.2 Atualizar `banco.sql:34` (condição da constraint) e `requisitos.md:51` (regra "Torre" para `limite_parcelas` entre 1 e 3)

## 4. Validação

- [x] 4.1 `npm run build` (ou lint disponível) sem erros
- [x] 4.2 Validação funcional no navegador: salvar Torre com 1 e com 2; Torre com 4 falha com mensagem em português; tipo não-Torre com 4 é salvo; rename para Torre com valor 5 exibe Select vazio e bloqueia no salvar (cenários do delta spec)
