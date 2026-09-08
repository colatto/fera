## 1. Implementação

- [x] 1.1 Adicionar em `src/lib/formato.ts` o mapa declarativo constraint → mensagem (7 entradas da design.md D3) e o parser do valor duplicado a partir de `details` (`Key (coluna)=(valor) ...`)
- [x] 1.2 Estender `mensagemDeErro`: interceptar apenas erros com código Postgres `23505`/`23P01`/`23514`, extrair o nome da constraint de `message` (`/constraint "([^"]+)"/`) e devolver a tradução — com o valor quando `details` o informar, sem valor na forma degradada caso contrário; todo o resto (RPCs, falha de rede, constraints fora do mapa) segue o caminho atual (D4)

## 2. Verificação

- [x] 2.1 `npm run build` passa sem erros de tipo
- [x] 2.2 No navegador como ADM: salvar operadora com nome já existente → toast exibe "Já existe uma operadora com o nome "…"" (ou forma sem valor), sem nenhum texto de constraint; cadastro não criado
- [x] 2.3 Salvar cliente com CNPJ já cadastrado → mensagem amigável de CNPJ duplicado; nada gravado
- [x] 2.4 Em tipo de projeto: nome duplicado, faixa que sobrepõe outra e tipo Torre com limite de parcelas diferente de 3 → cada uma com sua mensagem amigável; nada gravado
- [x] 2.5 Disparar uma rejeição de RPC com mensagem própria (ex.: "Faixa esgotada" ao esgotar número, ou "Tipo inexistente ou inativo") → mensagem exibida sem alteração, confirmando o pass-through
