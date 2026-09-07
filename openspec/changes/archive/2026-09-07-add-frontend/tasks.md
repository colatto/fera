# Tasks: add-frontend

## 1. Scaffold do app

- [x] 1.1 Criar o app Vite (react-ts) na raiz do repositório, mantendo `banco.sql`, `requisitos.md` e `feralogo.jpg` intactos
- [x] 1.2 Instalar dependências: `react-router`, `@supabase/supabase-js`, `@tanstack/react-query`, `@tanstack/react-table`, `recharts`
- [x] 1.3 Configurar Tailwind CSS v4 + shadcn/ui e gerar os componentes base (Button, Input, Select, Table, Dialog, Card, Badge, Toast/Sonner)
- [x] 1.4 Ajustar `.env` para `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` (mantendo `AUTH_*` sem prefixo), versionar `.env.example` e criar `.gitignore` cobrindo `.env` e `node_modules`
- [x] 1.5 Copiar `feralogo.jpg` para `public/` e criar `vercel.json` com rewrite SPA (`/(.*)` → `/index.html`)

## 2. Fundação — spec `interface-web`

- [x] 2.1 Definir tokens do tema navy em `src/index.css` (navy `#2E3A5C`, branco, cinza-azulado, azul de ação) e dark mode como tema único
- [x] 2.2 Criar client Supabase em `src/lib/supabase.ts` e gerar `src/types/database.types.ts` pelo MCP (`generate_typescript_types`)
- [x] 2.3 Montar o data router (React Router v7) com layouts de autenticação e do shell, provider do TanStack Query e página not-found interna
- [x] 2.4 Implementar a tela de login: erro único sem revelar e-mail, leitura da própria linha em `public.usuario` pós-login e sessão encerrada com mensagem quando a linha não existir ou estiver inativa
- [x] 2.5 Implementar guarda de sessão no loader (redireciona ao login preservando a rota de retorno) e de perfil ADM nas rotas administrativas, com degradação para estado sem dados
- [x] 2.6 Tratar `onAuthStateChange`: limpeza do cache de queries e redirecionamento ao login sem loop quando a sessão expirar/for revogada (inclui usuário inativado em uso)
- [x] 2.7 Implementar shell com sidebar navy (wordmark do logo no topo), navegação montada pelo perfil do usuário, logout e exibição do nome/perfil
- [x] 2.8 Criar componentes de estado padronizados (carregando, vazio, erro de consulta) e usá-los nas telas

## 3. Consulta de projetos — spec `consulta-projetos`

- [x] 3.1 Criar `src/queries/projetos.ts` com leitura por perfil (`v_projetos_operacional` para OPER, `v_projetos_administrativo` para ADM) tipada pelos tipos gerados
- [x] 3.2 Implementar listagem com TanStack Table e colunas por perfil, com ordenação e paginação
- [x] 3.3 Implementar filtros combináveis (código, cliente, identificadores, operadora, cidade, UF, tipo, status) com limpeza e estado vazio explícito
- [x] 3.4 Implementar o detalhe do projeto com linha do tempo cronológica: eventos (`v_eventos_operacionais` para OPER; leitura completa para ADM) e, para ADM, documentos (OC, autorização, nota, recebimentos) e previsão de recebimento (emissão + 30 dias)
- [x] 3.5 Implementar exportação CSV client-side da consulta corrente (separador `;`, BOM UTF-8, colunas conforme o perfil)

## 4. Fluxo de projetos — spec `fluxo-projetos`

- [x] 4.1 Implementar mutações RPC com feedback transacional e invalidação de cache (listas, detalhe, timeline, dashboards), sem aplicação otimista
- [x] 4.2 Formulário de criação de projeto (`criar_projeto`) com seletores restritos a cadastros ativos, predecessor opcional e exibição do código `F-AAAA-NNNN` gerado
- [x] 4.3 Ação de enviar projeto (`alterar_status_projeto`) para ADM/OPER em status `CADASTRADO`
- [x] 4.4 Ação de cancelar com motivo obrigatório validado localmente e desativação das ações de fluxo para projeto `CANCELADO`
- [x] 4.5 Ações financeiras do ADM: registrar/vincular OC, autorizar faturamento, registrar nota fiscal e registrar recebimento individual
- [x] 4.6 Lançamento de recebimentos em lote (`confirmar_recebimentos_lote`) com tratamento de falha integral
- [x] 4.7 Toggle de compatibilização de fundação (`definir_compatibilizacao_fundacao`) refletido no detalhe

## 5. Dashboards — spec `painel-dashboards`

- [x] 5.1 Criar `src/queries/dashboards.ts` com `dashboard_operacional(data_inicial, data_final)`/`v_dashboard_operacional` e `v_dashboard_financeiro`
- [x] 5.2 Implementar dashboard operacional com seletor de período, distribuição por status, enviados no período e enviados sem OC (Recharts), exibindo zeros para período sem dados
- [x] 5.3 Implementar dashboard financeiro (faturado, recebido, saldo) restrito à navegação do ADM

## 6. Cadastros básicos — spec `cadastros-basicos`

- [x] 6.1 Criar `src/queries/cadastros.ts` e telas de manutenção exclusivas ADM com listas de ativos e inativos para clientes, operadoras e tipos
- [x] 6.2 Implementar inativação/reativação e edição, sem ação de exclusão física
- [x] 6.3 Implementar validações locais dos formulários (CNPJ opcional somente dígitos, nomes obrigatórios, faixa inclusiva/próximo número/limite de parcelas/PPI no tipo) e exibição das restrições do banco (unicidade, sobreposição, `Torre` com limite 3)

## 7. Administração de usuários — spec `administracao-usuarios`

- [x] 7.1 Criar wrapper da Edge Function `admin-usuarios` em `src/lib/adminUsuarios.ts` com parse de erros `{ erro }` por status HTTP
- [x] 7.2 Implementar listagem pela `v_usuarios_manutencao` (ativos e inativos com perfil, nome, e-mail)
- [x] 7.3 Implementar criação de usuário (perfil, nome, e-mail, senha inicial ≥ 6) exibindo conflitos de e-mail duplicado
- [x] 7.4 Implementar alteração de perfil/nome/e-mail com exibição da negação de salvaguarda do último ADM ativo
- [x] 7.5 Implementar inativação/reativação com feedback da revogação de sessão e da salvaguarda de último ADM
- [x] 7.6 Implementar redefinição de senha pelo ADM (nova senha ≥ 6, sessões do alvo revogadas, inativo não reativado)
- [x] 7.7 Implementar troca da própria senha com comprovação da credencial atual, sem alterar dados do perfil

## 8. Deploy na Vercel — design D8

- [x] 8.1 Validar `vite build` localmente e o comportamento de refresh direto em rotas internas (`vercel dev` ou preview)
- [x] 8.2 Inicializar o repositório Git, commit inicial e push para o GitHub
- [x] 8.3 Importar o repositório na Vercel, configurar as variáveis `VITE_SUPABASE_*` e publicar
- [x] 8.4 Verificar o app publicado com as credenciais de teste `AUTH_ADM_*`/`AUTH_OPER_*` (login, navegação por perfil, logout)
- [x] 8.5 Quando o domínio de produção for definido, ajustar Site URL/redirects do Auth no projeto remoto exclusivamente pelo MCP Supabase
