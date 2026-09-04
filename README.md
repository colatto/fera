# Fera

Sistema web que centraliza o ciclo de projetos da Fera Engenharia: cadastro, envio, ordem de compra (OC), autorização de faturamento, nota fiscal, recebimentos e histórico completo por projeto. Arquivos técnicos permanecem fora do sistema; o código do projeto (`F-AAAA-NNNN`) serve para localizá-los.

## Arquitetura

O backend é **PostgreSQL gerenciado pelo Supabase** (projeto remoto único): Auth por e-mail/senha, RLS em todas as tabelas, RPCs transacionais para todo o fluxo, views de projeção/dashboards e a Edge Function `admin-usuarios` para gestão de usuários com credencial de serviço.

O frontend é uma **SPA consumidora fina** que fala direto com o Supabase — não há API intermediária:

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  SPA Vite + React + TS      │        │  Supabase (projeto remoto)       │
│                             │        │                                  │
│  React Router ── rotas      │──────▶ │  Auth (e-mail/senha)             │
│  TanStack Query ── cache    │──────▶ │  Views (leitura, por perfil)     │
│  supabase-js ── cliente     │──────▶ │  RPCs (escritas do fluxo)        │
│  Tailwind 4 + shadcn/ui     │──────▶ │  Edge Function admin-usuarios    │
│                             │        │  RLS = proteção efetiva          │
└─────────────────────────────┘        └──────────────────────────────────┘
```

- **Leitura** exclusivamente pelas views (`v_projetos_operacional`, `v_projetos_administrativo`, `v_eventos_operacionais`, dashboards).
- **Escrita** exclusivamente pelas RPCs do fluxo (`criar_projeto`, `alterar_status_projeto`, `registrar_ordem_compra`, `vincular_ordem_compra`, `autorizar_faturamento`, `registrar_nota_fiscal`, `registrar_recebimento`, `confirmar_recebimentos_lote`, `definir_compatibilizacao_fundacao`).
- **Autorização**: a interface não é mecanismo de proteção — a guarda de rotas no cliente é só experiência. RLS e permissões do banco são a proteção efetiva (OPER nunca lê dados financeiros, mesmo forçando URLs).

### Fluxo de status do projeto

```
CADASTRADO → ENVIADO → OC_REGISTRADA → AUTORIZADO_FATURAMENTO → NOTA_EMITIDA → PAGO
     │
     └──▶ CANCELADO (final e paralelo; não volta ao fluxo)
```

Toda mudança de status gera evento imutável exibido na linha do tempo do projeto.

### Perfis

| Perfil | Acesso |
|---|---|
| `ADM` | Completo: usuários, cadastros, dashboard financeiro, todo o fluxo, valores e notas fiscais |
| `OPER` | Consulta projetos/cadastros/eventos e dashboard operacional; pode enviar ou cancelar projeto (cancelamento exige motivo); nunca acessa dados financeiros |

## Estrutura do repositório

```
├── src/
│   ├── routes/          # telas (projetos, dashboards, cadastros, usuários, login)
│   ├── queries/         # consultas Supabase + TanStack Query por domínio
│   ├── lib/             # cliente Supabase, auth, constantes, formatação
│   ├── components/      # shell, estados, linha do tempo e UI (shadcn/ui)
│   ├── router.tsx       # rotas e guarda de perfil ADM
│   └── types/           # tipos gerados do schema do banco
├── banco.sql            # referência declarativa versionada do estado esperado do banco
├── requisitos.md        # requisitos do sistema
├── openspec/            # especificações e changes (fluxo spec-driven)
├── vite.config.ts       # Vite + Tailwind + alias @/ + CSP (produção no index.html)
└── vercel.json          # build estático + rewrite SPA
```

## Acessando o frontend localmente

### Pré-requisitos

- **Node.js 20.19+ ou 22.12+** (recomendado 22+) e npm
- Credenciais do projeto Supabase (URL e chave publishable)

### Passos

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente** — copie o exemplo e preencha com os valores do projeto Supabase:

   ```bash
   cp .env.example .env
   ```

   ```dotenv
   VITE_SUPABASE_URL=https://<projeto>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<chave publishable>
   ```

   Essas variáveis são públicas por design (empacotadas no bundle); a proteção dos dados é a RLS. As credenciais de teste `AUTH_ADM_*`/`AUTH_OPER_*` não têm prefixo `VITE_` e nunca são empacotadas.

3. **Rodar em desenvolvimento**

   ```bash
   npm run dev
   ```

   Acesse **http://localhost:5173** e entre com e-mail/senha (Supabase Auth). A navegação se adapta ao perfil (`ADM`/`OPER`) lido de `public.usuario`.

4. **Build e preview de produção** (opcional)

   ```bash
   npm run build     # tsc -b && vite build → saída em dist/
   npm run preview   # serve o build localmente
   ```

   Em produção o CSP do `index.html` vale integralmente; em dev, o Vite relaxa temporariamente o CSP para permitir o HMR do React (ajuste automático em `vite.config.ts`).

### Implantação

Deploy estático na **Vercel** (`vite build`, output `dist/`, rewrite SPA para rotas client-side — ver `vercel.json`). As variáveis `VITE_SUPABASE_*` devem estar configuradas no ambiente da Vercel.
