## 1. Banco remoto (via MCP Supabase)

- [x] 1.1 Aplicar migração (`apply_migration`) com `CREATE OR REPLACE FUNCTION public.editar_identificadores_projeto(p_id bigint, p_identificador_cliente varchar, p_identificador_operadora varchar) returns void` conforme a decisão 1 do design: gate `usuario_adm()` com `errcode 42501`; `SELECT ... FOR UPDATE`; recusa de status diferente de `CADASTRADO`; `btrim` nos parâmetros com recusa de vazio pós-trim; no-op sem `UPDATE` nem evento quando ambos os valores pós-trim são iguais aos vigentes; `UPDATE` único dos dois campos; `INSERT` de evento `ALTERACAO_CADASTRAL` sem `detalhes`
- [x] 1.2 Ler o estado de volta via MCP: assinatura presente em `pg_proc` e recusa transacional de chamada sem perfil ADM
- [x] 1.3 Atualizar `banco.sql` com a nova função junto às demais funções públicas

## 2. Tipos gerados

- [x] 2.1 Regenerar `src/types/database.types.ts` via MCP (`generate_typescript_types`) e conferir que `editar_identificadores_projeto` consta em `Database["public"]["Functions"]`

## 3. Frontend

- [x] 3.1 Adicionar `editarIdentificadoresProjeto` em `src/queries/fluxo.ts`: wrapper de `supabase.rpc` com trim dos dois identificadores, seguindo o padrão das demais funções de fluxo
- [x] 3.2 Criar `DialogEditarIdentificadores` em `src/routes/projetos/projeto-detalhe.tsx`: pre-fill refeito a cada abertura via `useEffect` (padrão do `DialogRecebimento`), `maxLength={100}` nos inputs, validação local trim/não vazio bloqueando o botão, toasts de sucesso e erro, mutação por `useAcaoFluxo`
- [x] 3.3 Incluir o botão "Editar" no grupo de ações de `CADASTRADO` condicionado a `ehAdm`, abrindo o diálogo (variante e posição coerentes com "Enviar projeto" e "Cancelar projeto")

## 4. Verificação

- [x] 4.1 `npm run build` sem erros de tipo
- [x] 4.2 Teste no app com usuário ADM: edição válida reflete no detalhe e na listagem; evento "Alteração cadastral" com autor e data aparece na linha do tempo; submissão sem alteração não cria evento; OPER não vê o botão; projeto fora de `CADASTRADO` não vê o botão; campo vazio ou só de espaços bloqueia o envio
