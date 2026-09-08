## Why

Ao salvar um cadastro que viola uma restrição do banco (ex.: operadora com nome já existente), a interface exibe ao usuário o texto cru do Postgres — `duplicate key value violates unique constraint "operadora_nome_key"` — porque `mensagemDeErro` (src/lib/formato.ts) apenas repassa `erro.message` do PostgREST. A decisão de validar no servidor (spec `cadastros-basicos`) permanece correta; o que falta é traduzir a restrição recebida em mensagem compreensível em português.

## What Changes

- `mensagemDeErro` passa a traduzir violações de constraint do Postgres em mensagens amigáveis em português, num único ponto central — as telas não mudam individualmente.
- Tradução dirigida por mapa `constraint → mensagem`: nome da constraint extraído da mensagem via código de erro Postgres (`23505` unique, `23P01` exclusion, `23514` check).
- Cobertura inicial das constraints alcançáveis pelas escritas da interface: `operadora_nome_key`, `cliente_cnpj_unico`, `tipo_projeto_nome_key`, `tipo_faixas_sem_sobreposicao` e checks de negócio (`tipo_faixa_valida`, `tipo_proximo_valido`, `tipo_torre_limite_parcelas`).
- Quando o campo `details` do PostgREST informa o valor duplicado (ex.: `Key (nome)=(Vivo) already exists.`), a mensagem traduzida inclui esse valor.
- Erros não mapeados e mensagens `RAISE EXCEPTION` das RPCs (já em português: "Faixa esgotada", "Tipo inexistente ou inativo" etc.) continuam exibidos como hoje — o tradutor não interfere neles.
- Nenhuma mudança em banco, RLS, Edge Functions ou na estratégia de escritas diretas; sem validação duplicada client-side.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `interface-web`: novo requisito de legibilidade dos erros exibidos em operações de escrita — violação de constraint do banco MUST ser exibida como mensagem em português compreensível para o usuário, nunca como texto cru de erro do banco.
- `cadastros-basicos`: o requisito "Regras de formulário dos cadastros" passa a exigir que a mensagem de restrição do banco seja exibida de forma traduzida e legível (unicidade de nome/CNPJ, sobreposição de faixa, `Torre` com limite de parcelas), em vez do texto cru do Postgres.

## Impact

- **`src/lib/formato.ts`** — único ponto de mudança: `mensagemDeErro` ganha o tradutor e o mapa de constraints.
- Todas as telas que exibem erros via `mensagemDeErro` (cadastros de clientes/operadoras/tipos, novo projeto, detalhe do projeto, minha senha, estados de consulta) herdam a tradução sem alteração.
- Sem impacto em `banco.sql`, schema, RLS, Edge Functions ou no wrapper `admin-usuarios` (que já produz mensagens próprias em português).
