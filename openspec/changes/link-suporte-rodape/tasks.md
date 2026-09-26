# Tasks

## 1. Versão no build

- [x] 1.1 Em `vite.config.ts`, ler o campo `version` do `package.json` no carregamento da configuração e definir a constante `__VERSAO_APP__` via `define`; declarar o tipo da constante em `src/vite-env.d.ts` — verificar com `npm run build` que a constante compila e que o bundle contém a versão `0.1.0` (ex.: buscar a string no `dist`)

## 2. Componente do rodapé

- [x] 2.1 Criar `src/components/rodape-sistema.tsx`: linha `R3 © {ano} F.E.R.A. Projetos e Engenharia · v{__VERSAO_APP__} · Solicitar suporte` com ano de `new Date().getFullYear()`, links `R3` → `https://ruatrez.com` e `Solicitar suporte` → `https://calendly.com/suporter3/agenda` (`target="_blank"`, `rel="noopener noreferrer"`), texto pequeno/esmaecido e trechos de encurtamento alternados por classes responsivas (`R3 © {ano} · v{versão} · Suporte` em viewport estreito) — verificar por inspeção do JSX que os dois formatos e os dois links existem

## 3. Integração no login

- [x] 3.1 Em `src/routes/login.tsx`, acrescentar `RodapeSistema` como último elemento da coluna centralizada, abaixo do Card, centrado e discreto, sem deslocar a modal do centro — verificar em `npm run dev` (viewport larga e estreita) a posição, o ano corrente, a versão e os links abrindo em nova aba

## 4. Integração no shell

- [x] 4.1 Em `src/components/shell.tsx`, tornar `<main>` flex column e acrescentar `RodapeSistema` como último filho com `sticky bottom-0`, alinhado à direita, cobrindo a área de conteúdo (fora da sidebar) com fundo da própria página e respiro próprio — verificar em `npm run dev` que a linha fica no canto inferior direito, fora da sidebar, e permanece visível com a página rolada (listagem de projetos longa)
- [x] 4.2 Verificar que o rodapé do shell não sobrepõe visualmente o conteúdo ao rolar (tabelas e cards terminam legíveis acima da faixa) e que a rota `nao-encontrado` herda o rodapé

## 5. Versionamento por commit

- [x] 5.1 Criar `.githooks/pre-commit` (versionado) executando script Node que lê o `version` do `package.json`, avança o contador em 1 com carry de dígito a cada 9 e regrava o arquivo, seguido de `git add package.json` — verificar executando o script com versões de teste (0.1.0 → 0.1.1, 0.1.9 → 0.2.0, 0.9.9 → 1.0.0, 1.9.9 → 2.0.0) e restaurando `0.1.0`
- [x] 5.2 Documentar no README o comando único de ativação (`git config core.hooksPath .githooks`) e a regra da versão (+1 por commit, carry a cada 9, `--no-verify` não avança) — verificar que o comando descrito funciona em cópia de teste do repositório

## 6. Validação integrada

- [x] 6.1 Confirmar `npm run build` e tipagem sem erros e validar os cenários da delta spec: linha completa abaixo da modal no login, linha completa no canto inferior direito do shell sempre visível, forma encurtada em viewport estreito, ano corrente, dois links em nova aba e versão igual no login e no shell
- [ ] 6.2 Validar o ciclo de versionamento ponta a ponta: commit do feature exibindo v0.1.0, ativação do hook (`git config core.hooksPath .githooks`) e commit seguinte entrando com v0.1.1 (conferir `package.json` e o bundle)
