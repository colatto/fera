## Why

O código do projeto hoje é alocado por faixas numéricas definidas por tipo de projeto (não-PPI em 0–5000, PPI a partir de 5001), uma mecânica que deixará de ser válida. A numeração passa a ser um sequencial global por ano, o que elimina a configuração de faixas, simplifica o cadastro de tipos e remove limites artificiais de emissão.

## What Changes

- **BREAKING** — O código do projeto deixa de ser derivado de faixa por tipo e passa a ser um sequencial global por ano: `F-AAAA-NNNN`, iniciando em `0001` a cada ano, contado em nova tabela de sequência anual. A unicidade de `projeto.numero` passa a ser por `(ano, numero)`.
- **BREAKING** — `tipo_projeto` perde `faixa_inicial`, `faixa_final`, `faixa`, `proximo_numero` e `is_ppi`, com as constraints `tipo_faixa_valida`, `tipo_proximo_valido` e `tipo_faixas_sem_sobreposicao` e o trigger de próximo número automático. O cadastro de tipos passa a tratar apenas nome, limite de parcelas e situação; a regra de `Torre` com limite 1–3 permanece. O conceito de indicador PPI deixa de existir (só governava faixas).
- A RPC `criar_projeto` passa a alocar o número na sequência anual (lock de linha, mesmo padrão transacional atual), sem verificação de faixa esgotada.
- Limpeza de dados de teste: deleção de todos os projetos e registros dependentes (recebimentos, notas fiscais, autorizações de faturamento e eventos de projeto) para que a numeração comece em `0001` sem colisão com o histórico.
- Interface: formulário de tipo de projeto perde os campos de faixa e a lógica PPI; listagem de tipos perde as colunas Faixa e Próximo nº; o seletor de tipo na criação de projeto deixa de exibir o próximo número; traduções de erro ligadas a faixa são removidas do mapa de erros.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastros-basicos`: regras de formulário do tipo de projeto sem faixa e sem PPI (apenas nome e limite de parcelas, com Torre 1–3); remoção do requisito de próximo número automático do tipo.
- `fluxo-projetos`: criação de projeto com numeração sequencial anual `F-AAAA-NNNN` a partir de `0001`, sem cenário de faixa esgotada.
- `interface-web`: remoção dos exemplos de erro ligados a faixa (sobreposição de faixa, "Faixa esgotada") da regra de mensagens compreensíveis.

## Impact

- **Banco (via MCP Supabase; `banco.sql` atualizado como referência)**: alteração de `tipo_projeto` (colunas geradas, constraints, trigger), criação da tabela de sequência anual, reescrita do bloco de alocação da RPC `criar_projeto`, troca da unicidade de `projeto.numero` para `(ano, numero)`. Views, RLS e grants de leitura permanecem inalterados.
- **Dados**: deleção de todos os projetos e dependentes (`recebimento` → `nota_fiscal` → `autorizacao_faturamento` → `evento_projeto` → `projeto`, respeitando as FKs restrict); ordens de compra permanecem.
- **Frontend**: `src/routes/cadastros/cadastros-tipos.tsx`, `src/routes/projetos/projeto-novo.tsx`, `src/queries/cadastros.ts`, `src/lib/formato.ts`, `src/types/database.types.ts` (regenerar).
- **Documentação**: `requisitos.md` (descrição de `tipo_projeto` e numeração).
