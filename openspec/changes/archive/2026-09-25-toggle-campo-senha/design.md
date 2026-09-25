## Context

O Fera tem 6 campos de senha em 3 telas (login; criação e redefinição na administração de usuários; troca da própria senha), todos `Input` shadcn com `type="password"` mascarado e sem forma de revelar o texto. `lucide-react` já é dependência e não existe componente de senha na pasta `src/components/ui/`. A modal de redefinição do ADM opera em modo exclusivo já especificado em `administracao-usuarios` — a mudança não pode afetá-lo. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Permitir conferir o texto digitado nos campos de senha nova/inicial (criação, redefinição pelo ADM, troca da própria senha).
- Um único componente reutilizável, com acessibilidade (rótulo e estado anunciados).
- Eliminar o campo "Confirmar nova senha" da troca da própria senha — a conferência passa a ser visual.

**Non-Goals:**

- Não adicionar alternância ao login nem ao campo de senha atual de "Minha senha".
- Não alterar backend: Supabase Auth, Edge Function `admin-usuarios`, fluxos e mensagens permanecem.
- Não alterar o modo exclusivo de redefinição nem os fluxos de validação existentes (mínimo de 6 caracteres, comprovação da credencial atual).

## Decisions

1. **Componente único `PasswordInput` em `src/components/ui/password-input.tsx`.** Wrapper do `Input` shadcn com botão de ícone (`Eye`/`EyeOff`) posicionado à direita dentro do campo (`pr-10` no input para o texto não correr sob o ícone) e estado de visibilidade interno. Alternativa descartada: estado local de visibilidade repetido por tela — 3 cópias do mesmo comportamento e risco de divergência de acessibilidade.
2. **Escopo cirúrgico: alternância somente nos 3 campos de senha nova/inicial.** Login e "senha atual" ficam mascarados: a credencial já é conhecida do usuário e esses campos tendem a ser digitados em contexto menos privado, onde o mascaramento protege contra ombros alheios. Alternativa descartada (alternância em todos os campos): consistência maior, mas expõe a credencial atual sem necessidade.
3. **Alternância substitui a confirmação em "Minha senha".** O campo de confirmação existe para compensar o mascaramento; com o texto visível sob demanda, ele vira atrito. Saem o estado `confirmacao`, a comparação `novaSenha === confirmacao` e o aviso "As senhas não coincidem."; a validação de salvamento passa a exigir apenas credencial atual preenchida e mínimo de caracteres. Alternativa descartada (manter ambos): zero risco, mas duplica o custo de digitação para o usuário.
4. **Alternância por troca do atributo `type` (`password` ↔ `text`).** Prática consolidada, acessível e sem dependências. Alternativa descartada (`-webkit-text-security` via CSS): comportamento inconsistente entre navegadores. O botão usa `type="button"` (para não submeter formulário), `aria-label` variável ("Mostrar senha"/"Ocultar senha") e `aria-pressed`; `autoComplete="new-password"` e `id`/`Label` existentes são preservados.
5. **Visibilidade persiste quando o formulário limpa os campos.** Após salvar, os estados de texto voltam a vazio, mas o componente não reinicia a visibilidade — campo vazio torna isso inofensivo e evita sincronização extra entre tela e componente.

## Risks / Trade-offs

- [Senha visível na tela durante redefinição pelo ADM] → alternância é escolha explícita do ADM, transiente (volta ao mascarado por clique) e o campo é limpo após a operação.
- [Troca de `type` pode alterar comportamento de gerenciadores de senha] → prática amplamente adotada; `autoComplete` preservado mantém o preenchimento automático funcionando.
- [Sem confirmação, um erro de digitação só é percebido no próximo login] → mitigado pela conferência visual; no caso de redefinição pelo ADM as sessões do alvo são revogadas e o erro se manifesta imediatamente.
- [Validação duplicada removida pode reduzir rede de segurança] → o requisito mínimo de 6 caracteres e a comprovação da credencial atual permanecem intactos.

## Migration Plan

Mudança exclusivamente de front-end: nenhum recurso do Supabase é criado ou alterado (contexto do projeto: operações remotas só via MCP Supabase — não há nenhuma nesta mudança). Deploy pelo build do Vite; rollback é revert do commit.

## Open Questions

(nenhuma)
