# Valor do projeto

## Why

O projeto é criado hoje sem valor comercial: o formulário "Novo projeto" não captura quanto o projeto vale, impedindo que a carteira seja acompanhada financeiramente pelo ADM — o dashboard financeiro só enxerga o que já virou nota fiscal, e o detalhe/consulta não exibem o valor contratado.

## What Changes

- Novo campo **Valor** no formulário "Novo projeto", obrigatório, monetário (`numeric(15,2)`), positivo.
- O valor é **imutável após a criação**: não há edição posterior, nenhuma RPC de alteração será criada.
- O valor **não é registrado no evento de criação** da linha do tempo (respeitando a constraint `evento_detalhes_sem_financeiro`).
- **Visibilidade exclusiva de ADM** em todas as superfícies: projeção administrativa da listagem, "Dados do projeto" no detalhe, CSV de exportação de ADM e dashboard financeiro.
- Dashboard financeiro ganha a métrica **"Projetos"**: soma do valor dos projetos não cancelados.
- Projeção operacional (OPER), CSV de OPER e views operacionais permanecem **sem** qualquer coluna de valor do projeto.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `fluxo-projetos`: o requisito "Criação de projeto" passa a exigir o campo Valor obrigatório e positivo, imutável, gravado pela RPC `criar_projeto` sem constar no evento de criação.
- `consulta-projetos`: a projeção administrativa (listagem, detalhe e CSV de ADM) passa a exibir o valor do projeto; a projeção operacional permanece sem o campo.
- `painel-dashboards`: o dashboard financeiro do ADM passa a exibir a métrica "Projetos" (soma do valor dos projetos não cancelados) ao lado de faturado/recebido/saldo.

## Impact

- **Banco (deploy exclusivo via MCP Supabase; `banco.sql` atualizado como referência declarativa):**
  - Coluna `valor numeric(15,2) not null check (valor > 0)` em `public.projeto` (preenchimento retroativo dos projetos existentes é requisito de dados, tratado em tasks).
  - RPC `criar_projeto` ganha `p_valor numeric`; a linha de `grant execute` que lista a assinatura da função muda junto.
  - `v_projetos_administrativo` ganha a coluna `valor`; `v_projetos_operacional` permanece inalterada.
  - `v_dashboard_financeiro` ganha a métrica de soma dos valores de projetos não cancelados.
- **Frontend:**
  - `src/routes/projetos/projeto-novo.tsx` — campo Valor com o padrão de entrada monetária já usado nas notas fiscais (vírgula decimal, validação local de positivo).
  - `src/queries/fluxo.ts` — `ParametrosCriacao` ganha `p_valor`.
  - `src/routes/projetos/projetos-listar.tsx` — coluna na projeção administrativa e no CSV de ADM.
  - `src/routes/projetos/projeto-detalhe.tsx` — linha "Valor" em "Dados do projeto" (ADM).
  - `src/queries/dashboards.ts` e `src/routes/dashboards/dashboard-financeiro.tsx` — métrica "Projetos".
  - `src/types/database.types.ts` — regenerado a partir do schema remoto via MCP.
- **Compatibilidade:** a assinatura da RPC `criar_projeto` muda de forma não retrocompatível (novo parâmetro); como a única chamadora é esta aplicação, publicadas na mesma janela, sem versionamento adicional.
