# Proposal

## Why

O sistema não oferece ao usuário nenhum canal visível de suporte nem identificação institucional: não há como saber qual versão está em execução — informação essencial no atendimento — nem alcançar a agenda de suporte sem pedir a link a alguém. O rodapé institucional resolve os três pontos de uma vez, com a marca R3 presente no login e no sistema.

## What Changes

- Novo componente reutilizável `RodapeSistema`: a linha `R3 © {ano} F.E.R.A. Projetos e Engenharia · v{versão} · Solicitar suporte`, discreta, com `R3` apontando para `https://ruatrez.com` e `Solicitar suporte` para `https://calendly.com/suporter3/agenda`, ambos abrindo em nova aba.
- Linha exibida logo abaixo da modal da tela de login.
- Linha exibida no shell, fora da sidebar, no canto inferior direito da área de conteúdo, em linha única sempre visível; no mobile o texto é encurtado (`R3 © {ano} · v{versão} · Suporte`).
- Ano corrente obtido do relógio do navegador, sem manutenção manual.
- Versão exibida = campo `version` do `package.json` do commit construído, injetada no build. O `package.json` passa a ser a fonte viva da versão (inicia em `0.1.0`) e um hook de pre-commit soma +1 no contador a cada novo commit, com carry de dígito a cada 9 (v0.1.9 → v0.2.0, v0.9.9 → v1.0.0, v1.9.9 → v2.0.0) — a contagem desconsidera o histórico de commits.
- Sem alteração de backend, de CSP ou de dependências.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `interface-web`: novos requisitos de rodapé institucional (textos, links, posicionamento no login e no shell) e de versão exibida correspondente ao `package.json` do commit construído.

## Impact

- Código: `src/components/rodape-sistema.tsx` (novo), `src/routes/login.tsx`, `src/components/shell.tsx`, `vite.config.ts`, `src/vite-env.d.ts`, `package.json` (campo `version` passa a evoluir por commit).
- Versionamento: `.githooks/pre-commit` (novo, versionado no repo) com script de incremento; configuração única `git config core.hooksPath .githooks`.
- Specs: delta em `openspec/specs/interface-web/spec.md`.
- Sem alteração no Supabase (schema, Auth, RLS, Edge Functions) nem nas dependências do npm.
