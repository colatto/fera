# Design

## Context

O shell (`src/components/shell.tsx`) é um flex row com sidebar e `<main>` que hoje não tem rodapé; a tela de login (`src/routes/login.tsx`) é uma coluna centralizada (`min-h-svh`, `gap-8`) com o logo e o Card de acesso. `package.json` declara `"version": "0.1.0"` e nenhum código a lê. O build é `vite build` na Vercel; a CSP do `index.html` é restritiva, mas não rege navegação por link. Ver proposal.md para a motivação e a delta spec para o comportamento esperado.

## Goals / Non-Goals

**Goals:**

- Uma única fonte de verdade para a linha institucional, reutilizada no login e no shell.
- Versão correta por construção: cada commit carrega a própria versão; o build apenas a lê.
- Contador de versão independente do histórico de commits (sobrevive a rebase/squash sem recalcular nada).

**Non-Goals:**

- Versionamento por tags Git ou SemVer convencional (o esquema é o contador com carry a cada 9).
- Exibir a versão fora do rodapé (menus, modais, título da aba).
- Alterar CSP, dependências do npm ou qualquer recurso do Supabase.
- Sincronizar a contagem com máquinas ou CI que não rodem o hook (limite aceito, ver Riscos).

## Decisions

### D1 — Versão como estado no `package.json`, avançada por hook de pre-commit

O campo `version` do `package.json` passa a ser a fonte viva da versão. Um hook de pre-commit (`.githooks/pre-commit`, versionado no repo, ativado com `git config core.hooksPath .githooks`) roda um script Node curto que lê a versão atual, avança o contador em 1 com carry de dígito a cada 9 e regrava o `package.json` antes de o commit ser criado, já o incluindo (`git add`). Assim cada commit contém a própria versão.

Alternativas rejeitadas:

- **Contar commits no build** (`git rev-list --count HEAD` + offset): depende do histórico — exatamente o que se quis desligar — e cria o risco de clone raso na Vercel.
- **`npm version`**: incrementa semântica de SemVer (0.1.9 → 0.1.10, não 0.2.0) e cria commit/tag por padrão; não atende ao carry a cada 9.
- **Arquivo de versão separado**: segunda fonte de verdade além do `package.json`, sujeita a divergência.

O script de incremento é determinístico: `patch + 1`; se passar de 9, `patch = 0` e `minor + 1`; se `minor` passar de 9, `minor = 0` e `major + 1`.

### D2 — Injeção da versão no build via `define`

O `vite.config.ts` lê o `package.json` no carregamento da configuração e define a constante `__VERSAO_APP__` com o valor de `version`; `src/vite-env.d.ts` declara o tipo da constante. O componente só consome a constante.

Alternativa rejeitada: importar o `package.json` direto no componente (Vite aceita JSON) — embutiria nome, dependências e scripts no bundle do cliente por causa de um campo; o `define` injeta só a string.

### D3 — Componente único `RodapeSistema` com variação responsiva de texto

`src/components/rodape-sistema.tsx` renderiza a linha completa; os trechos que encurtam no mobile (`F.E.R.A. Projetos e Engenharia` e `Solicitar suporte` → `Suporte`) alternam por classes responsivas (`hidden`/`inline`), sem variantes de componente. Os dois links usam `target="_blank"` e `rel="noopener noreferrer"`. O ano vem de `new Date().getFullYear()` no cliente. Estilo: texto pequeno e esmaecido sobre o fundo existente, consistente com a paleta derivada do logotipo (spec interface-web).

### D4 — Posicionamento: fluxo no login, sticky no shell

No login, a linha é o terceiro elemento da coluna centralizada (logo, Card, rodapé), sem posicionamento fixo — a modal permanece o centro visual. No shell, `<main>` passa a ser flex column e o rodapé é o último filho com `sticky bottom-0`, cobrindo a área de conteúdo (fora da sidebar) com o fundo da própria página e respiro próprio: permanece colado no canto inferior direito durante toda a rolagem sem sobrepor visualmente tabelas e cards. Alinhamento do texto à direita no shell; centrado no login.

Alternativa rejeitada: `position: fixed` com offset calculado da largura da sidebar — acoplamento frágil a uma medida de layout que pode mudar. A rota `nao-encontrado`, já renderizada dentro do shell, herda o rodapé sem trabalho extra.

## Risks / Trade-offs

- [Commit com `--no-verify`, `--amend` ou feito fora desta máquina não avança o contador] → Limitação aceita e documentada; o contador é intencionalmente independente do total de commits. Single-dev, fluxo local.
- [`core.hooksPath` é configuração local: um clone novo não ativa o hook] → Documentar o comando único no README do projeto.
- [Rodapé sticky reduz alguns pixels úteis no fim da viewport] → Faixa fina, fundo da própria página e texto esmaecido; sobreposição visual com conteúdo é evitada pelo respiro próprio.
- [Dois formatos de texto (completo/encurta­do) podem divergir] → Ambos vivem no mesmo componente; a forma encurtada é apenas ocultação de trechos.

## Migration Plan

Commit único do feature: componente, integrações, `vite.config.ts`, hook versionado e README — esse commit exibe v0.1.0 (o hook ainda não está ativo nele). Em seguida, `git config core.hooksPath .githooks` na máquina; o commit seguinte já entra com v0.1.1, validando o hook. Rollback: reverter o commit e `git config --unset core.hooksPath`; não há dados nem backend afetados.

## Open Questions

(nenhuma — decisões fechadas na exploração com o usuário)
