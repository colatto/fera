# Proposal

## Why

A Receita Federal implementou o CNPJ alfanumérico: as 12 primeiras posições passam a admitir letras maiúsculas (A–Z) e números (0–9), mantendo 14 caracteres com os dois dígitos verificadores numéricos no final. A RFB já emitiu o primeiro CNPJ alfanumérico e a migração dos existentes é automática em julho de 2026. Hoje o Fera rejeita qualquer letra no cadastro de clientes — o filtro do formulário só aceita dígitos e a constraint do banco exige `^[0-9]{14}$` —, então um cliente com CNPJ alfanumérico não poderia ser cadastrado.

## What Changes

- Formato aceito de CNPJ passa a ser `^[0-9A-EHJ-NPR-TV-Z]{12}[0-9]{2}$`: 12 posições com números e letras maiúsculas (exceto I, O, U, Q e F, que a RFB não emite por ambiguidade visual) e 2 dígitos numéricos de DV no final. CNPJs numéricos existentes continuam válidos (dígito é subconjunto do novo formato).
- O campo CNPJ do formulário de clientes converte automaticamente minúsculas para maiúsculas antes de validar; caracteres inválidos (letras proibidas, minúsculas que resultam em letra proibida, pontuação e máscara) continuam sendo bloqueados no `onChange`, sem atualizar o campo.
- O campo deixa de usar teclado numérico (`inputMode="numeric"`), que impediria digitar letras em dispositivos móveis, e os textos do formulário (descrição do diálogo, placeholder e mensagem de validação local) passam a descrever o formato alfanumérico.
- A constraint `cliente_cnpj_formato` no Supabase remoto é alterada para a mesma regex, exclusivamente via MCP Supabase; `banco.sql` é atualizado como referência declarativa na mesma mudança.
- A tradução de erros em `formato.ts` ganha a entrada da check `cliente_cnpj_formato` (defesa extra: hoje uma violação dessa check chegaria crua à tela).
- Fora de escopo: validação de dígito verificador (o sistema não valida DV nem hoje, nem no formato antigo), migração de dados (não há: todo CNPJ numérico já satisfaz o novo formato) e mudança no índice único parcial `cliente_cnpj_unico`.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: o requisito "Regras de formulário dos cadastros" passa a definir CNPJ alfanumérico (letras maiúsculas exceto I/O/U/Q/F nas 12 primeiras posições, DV numérico nas 2 últimas, conversão automática de minúsculas) no lugar de "somente com dígitos", com cenários novos para letra aceita, letra proibida, minúscula convertida e letra na posição do DV; o bloqueio de pontuação/máscara permanece.

## Impact

- `src/routes/cadastros/cadastros-clientes.tsx` — filtro do campo, `inputMode`, placeholder, descrição do diálogo e mensagem de validação local.
- `banco.sql` — linha da constraint `cliente_cnpj_formato` (referência declarativa).
- Supabase remoto — alteração da constraint `cliente_cnpj_formato` somente via MCP Supabase (projeto remoto é o único ambiente operacional; se o MCP não estiver disponível, a operação remota é interrompida e o bloqueio reportado).
- `src/lib/formato.ts` — nova entrada em `MENSAGENS_CONSTRAINT`.
- Spec `cadastros-basicos` — requisito e cenários de formulário.
- Sem alteração em: tipos gerados (`cnpj: string | null` segue), queries (`inserirCliente`/`atualizarCliente`), índice único, demais cadastros.
