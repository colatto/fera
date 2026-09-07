# Proposal: add-frontend

## Why

O backend do Fera está completo e operacional no Supabase remoto — Auth, RLS nas 10 tabelas, 9 RPCs transacionais, 7 views de projeção e a Edge Function `admin-usuarios` —, mas só é acessível por consultas diretas ao banco: não existe interface. A stack de frontend estava expressamente indefinida (`requisitos.md`); a exploração concluída definiu a stack (Vite + React SPA, Tailwind + shadcn/ui, TanStack Query + supabase-js, deploy Vercel) e este change a materializa.

## What Changes

- Novo aplicativo SPA no repositório: **Vite + React + TypeScript**, criado na raiz ao lado de `banco.sql`, `requisitos.md` e `feralogo.jpg`.
- Camada de dados no cliente: `@supabase/supabase-js` + TanStack Query — leitura exclusivamente pelas views (`v_projetos_operacional`, `v_projetos_administrativo`, `v_eventos_operacionais`, `v_ordens_compra_administrativo`, dashboards), escrita exclusivamente pelas RPCs do fluxo, administração de usuários pela Edge Function `admin-usuarios`.
- Sessão pelo Supabase Auth (e-mail/senha) no cliente; guarda de rota client-side apenas como experiência — a proteção efetiva permanece no banco, como exigem `requisitos.md` e as specs `sessao-acesso`/`gestao-usuarios`.
- Navegação orientada pelo perfil `ADM`/`OPER` lido de `public.usuario` (linha própria).
- Identidade visual Fera: tema dark navy derivado de `feralogo.jpg` (navy `#2E3A5C`, wordmark branco itálico, letter-spacing largo) aplicado via Tailwind CSS + shadcn/ui.
- Deploy estático na Vercel com rewrite SPA para rotas client-side.
- Variáveis de ambiente renomeadas para a convenção Vite: `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`; `AUTH_ADM_*`/`AUTH_OPER_*` permanecem locais, fora do bundle.
- **Nenhuma alteração no Supabase**: schema, RLS, RPCs, views, Edge Functions e Auth permanecem como estão; o frontend é consumidor fino.

## Capabilities

### New Capabilities

- `interface-web`: shell da SPA — bootstrap, login/logout, guarda de rota como UX, sessão expirada/revogada, navegação por perfil, identidade visual Fera (tema/wordmark) e comportamento de rota única sob refresh direto na Vercel.
- `consulta-projetos`: listagem e detalhe de projetos com filtros combináveis (código, cliente, identificadores, operadora, cidade, UF, tipo, status), projeção distinta por perfil, timeline de eventos/documentos no detalhe e exportação da consulta.
- `fluxo-projetos`: operações do fluxo na interface — criar projeto, enviar, cancelar com motivo, OC (registrar/vincular), autorizar faturamento, nota fiscal, recebimentos (individual e lote) e compatibilização de fundação — todas via RPC, com feedback do erro transacional do banco.
- `painel-dashboards`: dashboard operacional por período (status, enviados, enviados sem OC) e dashboard financeiro exclusivo ADM (faturado, recebido, saldo).
- `cadastros-basicos`: manutenção ADM de clientes, operadoras e tipos de projeto (incluindo inativação), com regras de formulário refletindo as constraints do banco.
- `administracao-usuarios`: interface ADM para gestão de usuários pela Edge Function `admin-usuarios` (criar, inativar/reativar, alterar perfil/dados, redefinir senha) e troca da própria senha via Supabase Auth.

### Modified Capabilities

Nenhuma. As specs existentes (`sessao-acesso`, `gestao-usuarios`) definem comportamento de banco/Auth e já estabelecem que a interface não é mecanismo de proteção; o frontend consome esses contratos sem alterá-los.

## Impact

- **Código**: frontend novo na raiz do repositório (`package.json`, `src/`, `public/`, `vite.config.ts`, `vercel.json`, `.gitignore`, ajustes em `.env`); nenhum arquivo de backend existe para ser alterado.
- **Dependências**: react, react-dom, react-router, @supabase/supabase-js, @tanstack/react-query, tailwindcss, shadcn/ui e apoios (detalhadas em design.md).
- **Banco/Supabase**: nenhum impacto — sem migrations, sem mudança de RLS/RPC/view/Edge Function; `banco.sql` intocado.
- **Deploy**: projeto Vercel (build `vite build`, output `dist/`), variáveis `VITE_SUPABASE_*` no ambiente da Vercel e rewrite SPA; quando houver domínio de produção, ajustar Site URL/redirects do Auth no projeto remoto exclusivamente pelo MCP Supabase.
- **Segurança de repositório**: `.gitignore` cobrindo `.env` (contém credenciais de teste `AUTH_*`) e `node_modules`.
