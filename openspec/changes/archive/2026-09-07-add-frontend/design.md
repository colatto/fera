# Design: add-frontend

## Context

O backend está íntegro e operacional no Supabase remoto (Auth, RLS nas 10 tabelas, 9 RPCs transacionais, 7 views e a Edge Function `admin-usuarios` com contrato `{ acao, ...params }` e erros `{ erro }` HTTP 400/401/403/404/409/500), gerido exclusivamente pelo MCP Supabase — sem artefatos locais de Supabase. O repositório ainda não tem frontend: somente `banco.sql` (referência declarativa), `requisitos.md`, `feralogo.jpg` e `.env` (que hoje nomeia `NEXT_PUBLIC_SUPABASE_*` e credenciais de teste `AUTH_*`). Este design cobre a criação da SPA do zero; nada no Supabase muda.

## Goals / Non-Goals

**Goals:**
- SPA consumidora fina: sessão pelo Supabase Auth no cliente, leitura pelas views, escrita pelas RPCs, administração de usuários pela Edge Function — zero lógica de autorização no cliente.
- Experiência completa por perfil (ADM/OPER) com identidade visual derivada de `feralogo.jpg`.
- Deploy estático na Vercel com recarregamento direto de qualquer rota.
- Type-safety das queries/mutações a partir dos tipos reais do banco remoto.

**Non-Goals:**
- Qualquer alteração em schema, RLS, RPCs, views, Edge Functions ou configuração Auth do Supabase (exceto Site URL/redirects quando houver domínio de produção, via MCP).
- Camada de servidor própria (BFF, API routes, SSR): não há servidor no frontend.
- Cache offline/PWA, internacionalização (interface em pt-BR) e upload de arquivos técnicos (fora do sistema por requisitos).

## Decisions

### D1 — Base: Vite + React 19 + TypeScript SPA
Decisão da exploração, confirmada pelo usuário. A autenticação é e-mail/senha sem fluxos OAuth, então a SPA não sofre as dores de redirect; o requisito de interface fina elimina a necessidade de servidor. *Alternativa rejeitada:* Next.js App Router — o prefixo `NEXT_PUBLIC_` do `.env` sugeria essa direção, mas @supabase/ssr com middleware só pagaria o custo com SSR/OAuth, que o app não usa.

### D2 — Roteamento: React Router v7 em modo library
Data router com `createBrowserRouter`, guarda de sessão no `loader` das rotas protegidas e preserve-return-URL ao redirecionar ao login. Rotas administrativas agrupadas sob um layout cujo loader verifica perfil ADM — degradação para estado "sem dados" quando o banco negar (spec `interface-web`). *Alternativa rejeitada:* TanStack Router — boa integração com TanStack Query, mas ecossistema/exemplos com shadcn ainda menores.

### D3 — UI: Tailwind CSS v4 + shadcn/ui, tema dark navy derivado do logo
Tokens CSS em `src/index.css` mapeados do logotipo: navy `#2E3A5C` (fundo do shell/sidebar), branco (wordmark e destaque), cinza-azulado `#5A6B94` (muted), azul de ação para links/botões primários. Wordmark: `feralogo.jpg` em `public/` na tela de login e topo da sidebar; rótulos de seção em caixa alta com letter-spacing largo, ecoando o subtítulo do logo. Dark mode como tema único (sem toggle) — o logo é escuro e o app é interno. Gráficos dos dashboards com Recharts. Tabelas com TanStack Table + composição shadcn (Table) para filtros combináveis e ordenação.

### D4 — Dados: supabase-js + TanStack Query v5, queries por domínio
Client único em `src/lib/supabase.ts` (URL/publishable key de `import.meta.env`). Cache e invalidação por TanStack Query: cada mutação de fluxo invalida as chaves de listas, detalhe, timeline e dashboards correspondentes (ex.: `alterar_status_projeto` → `['projetos']`, `['projeto', id]`, `['eventos', id]`, `['dashboards']`). Sem aplicação otimista em ações do fluxo (spec `fluxo-projetos`). Módulos `src/queries/{projetos,dashboards,cadastros,usuarios}.ts` concentram leituras (views) e mutações (RPCs/Edge Function).

### D5 — Tipos gerados do banco remoto via MCP
`mcp__supabase__generate_typescript_types` gera `src/types/database.types.ts` — mesma fonte da verdade do banco, sem duplicar contratos à mão. Regenerar sempre que o banco remoto mudar (governança MCP). `banco.sql` permanece a referência declarativa para leitura.

### D6 — Sessão no cliente
`supabase-js` com `persistSession` (localStorage) e refresh automático. Pós-login, leitura da própria linha em `public.usuario`: linha ausente/inativa → `signOut` + mensagem de acesso indisponível (spec `interface-web`); linha presente → perfil no contexto de navegação. `onAuthStateChange` com `SIGNED_OUT`/token invalidado limpa o cache do TanStack Query e redireciona ao login sem loop — inclui o usuário inativado durante o uso (renovação negada derruba a sessão). A troca da própria senha usa `supabase.auth.updateUser` com reautenticação (`signInWithPassword` prévia) para comprovar a credencial atual.

### D7 — Variáveis de ambiente
Renomear para a convenção Vite: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key é pública por design; a proteção dos dados é RLS). `AUTH_ADM_*`/`AUTH_OPER_*` permanecem em `.env` local para testes manuais/e2e sem prefixo `VITE_` — nunca empacotadas. Versionar `.env.example` com os nomes (sem valores) e `.gitignore` cobrindo `.env` e `node_modules`. *Alternativa rejeitada:* `envPrefix` aceitando `NEXT_PUBLIC_` — mantém nome legado confuso à toa.

### D8 — Deploy Vercel
`vercel.json` com rewrite SPA (`/(.*)` → `/index.html`), framework preset Vite (`vite build` → `dist/`). Variáveis `VITE_SUPABASE_*` no projeto da Vercel. Domínio de produção, quando existir, exigirá ajuste de Site URL/redirects do Auth no projeto remoto exclusivamente pelo MCP Supabase (bloquear e reportar se indisponível). Fluxo: `git init` + push para GitHub → import do repositório na Vercel.

### D9 — Edge Function `admin-usuarios`
Chamadas por `supabase.functions.invoke('admin-usuarios', { body: { acao, ...params } })`; erros lidos de `FunctionsHttpError` com parse do JSON `{ erro }` e exibição da mensagem (409 de conflito, 400 de validação, 403 de guarda). Senha inicial/nova digitada pelo ADM é enviada na chamada autenticada e não retida em estado após a operação (spec `administracao-usuarios`).

### D10 — Formatação e exportação
Datas e moeda sempre pt-BR (`Intl`, BRL, fuso do usuário); exportação CSV gerada no cliente a partir dos dados carregados na consulta corrente, com separador `;` e BOM UTF-8 (compatibilidade Excel pt-BR), sem dependência externa.

## Risks / Trade-offs

- [Refresh token em localStorage é legível por XSS] → superfície pequena, sem scripts de terceiros (CSP restritiva no `index.html`); o dano máximos é o que o próprio perfil já lê — a proteção de escrita e dos dados ADM permanece no banco. Aceito pelo modelo de interface fina do `requisitos.md`.
- [OPER força URL administrativa] → degradação para estado "sem dados" (especificado), sem quebra; não é vetor de proteção, é consequência assumida.
- [Rewrite SPA mascara 404 real de rotas inexistentes] → router interno exibe página not-found própria; aceitável em app fechado.
- [Tipos desatualizam se o banco remoto evoluir] → regeneração via MCP faz parte do fluxo de qualquer mudança futura no banco.
- [Site URL do Auth não configurada para o domínio de produção] → login e-mail/senha cotidiano não depende disso (confirmação automática na criação via Edge Function); configurar via MCP ao definir o domínio.

## Migration Plan

Aplicação nova, sem estado a migrar: implementar, validar em `npm run dev` com o `.env` local e publicar. Rollback = despublicar o projeto na Vercel/remover a pasta `src` — o banco jamais é tocado. Sequência de publicação: repositório Git inicial → GitHub → import na Vercel → variáveis → deploy → verificação com as credenciais de teste `AUTH_*`.

## Open Questions

- Domínio de produção (e consequente Site URL/redirects do Auth e domínio Vercel) — decidível depois, não altera specs, estrutura nem tarefas.
- Nome do repositório GitHub/projeto Vercel — idem.
