## Why

Os campos de senha nova do Fera são mascarados sem forma de revelar o texto digitado, então o usuário não consegue conferir o que digitou (Caps Lock ativo, layout de teclado, colagem de gerenciador de senha). O campo de confirmação de senha existe justamente para compensar esse mascaramento, gerando atrito desnecessário na troca da própria senha.

## What Changes

- Novo componente reutilizável `PasswordInput` (`src/components/ui/password-input.tsx`): campo de senha com botão de alternância de exibição (ícones `Eye`/`EyeOff` do lucide-react), com rótulos acessíveis.
- Alternância de exibição oferecida nos campos de senha nova/inicial:
  - Criação de usuário — campo "Senha inicial" (`usuarios.tsx`).
  - Redefinição de senha pelo ADM na modal de edição — campo "Nova senha" (`usuarios.tsx`).
  - Troca da própria senha — campo "Nova senha" (`minha-senha.tsx`).
- **BREAKING** (comportamento de interface, não de API): o campo "Confirmar nova senha" é removido da troca da própria senha — a conferência passa a ser feita visualmente pela exibição da senha. Saem o estado `confirmacao`, a validação de igualdade e o aviso "As senhas não coincidem."
- Campos de senha atual (login e "Minha senha") permanecem sem alternância: a credencial já é conhecida do usuário e o mascaramento preserva a discrição em telas compartilhadas.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `administracao-usuarios`: os requisitos de criação de usuário, redefinição pelo ADM e troca da própria senha passam a exigir que o campo de senha nova/inicial ofereça alternância de exibição do texto digitado; a troca da própria senha deixa de exigir campo de confirmação — a conferência é feita pela exibição da senha nova.

## Impact

- Código: `src/components/ui/password-input.tsx` (novo), `src/routes/usuarios/usuarios.tsx`, `src/routes/usuarios/minha-senha.tsx`.
- Specs: delta em `openspec/specs/administracao-usuarios/spec.md` (requisitos de criação, redefinição pelo ADM e troca da própria senha).
- Sem alteração de backend: Supabase Auth, Edge Function `admin-usuarios` e fluxo de dados permanecem intocados.
- Sem novas dependências: `lucide-react` e shadcn/ui já presentes.
