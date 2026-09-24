## Why

Na modal "Editar usuário", ao acionar `Redefinir senha`, o formulário de nova senha se soma à linha de ações (`Redefinir senha`/`Inativar`) e ao rodapé (`Voltar`/`Salvar`), que permanecem visíveis: ficam duas affordances de redefinição simultâneas, uma ação destrutiva convivendo com um sub-fluxo focado e campos editáveis sem o botão Salvar à vista — tudo isso confunde o ADM sobre qual interação pertence a qual operação.

## What Changes

- Enquanto o campo de nova senha estiver revelado, a modal de edição opera em modo exclusivo de redefinição:
  - A linha de ações (`Redefinir senha` e `Inativar`/`Reativar`) fica **oculta** (ocultação, não desabilitação).
  - O rodapé da modal (`Voltar`/`Salvar`) fica **oculto**.
  - Os campos Perfil, Nome e E-mail ficam **desabilitados**.
- `Cancelar` (ou a confirmação da redefinição) restaura a modal ao estado normal: linha de ações e rodapé reaparecem e os campos voltam a habilitar, preservando o que foi digitado em nome e e-mail.
- Nenhuma mudança de backend, Edge Function ou fluxo de dados: a redefinição continua pela mesma ação `redefinir_senha` com as mesmas regras (mínimo de 6 caracteres, revogação de sessões, não reativação de inativo).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `administracao-usuarios`: o requisito de redefinição de senha pelo ADM passa a exigir o modo exclusivo da modal de edição durante a revelação do campo de nova senha — ações e rodapé ocultos, campos desabilitados — e a restauração do estado normal ao cancelar ou confirmar.

## Impact

- Código: `src/routes/usuarios/usuarios.tsx` (modal `ModalEditarUsuario` — renderização condicional da linha de ações e do rodapé, atributo `disabled` nos campos).
- Sem impacto em Supabase (schema, Auth, RLS, Edge Functions), API ou dependências.
