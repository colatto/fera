## Context

A modal de edição de usuário (`ModalEditarUsuario` em `src/routes/usuarios/usuarios.tsx`) já possui o estado `redefinicaoAberta`, que revela o formulário de nova senha; `Cancelar` e o sucesso da mutação de senha ambos executam `setRedefinicaoAberta(false)`. A modal não passa `showCloseButton` ao `DialogContent`, portanto não tem botão X — as saídas totais são ESC/clique fora e o botão `Voltar` do rodapé. Veja proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Modo exclusivo de redefinição dirigido pelo estado `redefinicaoAberta` existente, sem máquina de estados nova.
- Preservar o que o ADM digitou em nome e e-mail antes de abrir a redefinição.
- Zero mudança de backend: mesma ação `redefinir_senha`, mesmas regras e mensagens.

**Non-Goals:**

- Alterar Edge Function, regras de senha ou revogação de sessões.
- Adicionar botão X à modal ou mudar o comportamento de ESC/clique fora.
- Redesenhar a modal fora do modo exclusivo (layout atual permanece idêntico quando `redefinicaoAberta` é falso).

## Decisions

1. **Ocultar (renderização condicional) os botões, não desabilitar.** A linha de ações inteira some quando `redefinicaoAberta` é verdadeiro. Alternativa descartada: desabilitar os botões mantém o ruído visual que motivou o pedido — duas affordances de redefinição simultâneas e a ação destrutiva ao lado do sub-fluxo. Ocultar cobre ambos os rótulos (`Inativar`/`Reativar`) sem lógica por rótulo.

2. **Rodapé (`Voltar`/`Salvar`) também oculto.** Decisão do usuário para eliminar toda concorrência de interação durante a redefinição; a saída amigável do modo é `Cancelar`, e ESC/clique fora mantêm o comportamento atual (fecham a modal inteira). Alternativa descartada: manter o rodapé visível, preservando a concorrência entre "Salvar" e o sub-fluxo de senha.

3. **Campos Perfil/Nome/E-mail desabilitados, não ocultos.** Decisão do usuário. Manter os campos à vista preserva a veracidade da descrição da modal ("Altera perfil, nome e e-mail do usuário") e o contexto visual; o `disabled` sinaliza "agora não". Alternativas descartadas: manter habilitados (edição sem destino visível, a mesma classe de confusão do problema) e ocultar os campos (exigiria trocar também a descrição, escopo maior).

4. **Nenhum estado novo: `redefinicaoAberta` é o único predicado.** Os três efeitos (ocultar ações, ocultar rodapé, desabilitar campos) derivam dele, e a restauração do estado normal já existe — `Cancelar` e o sucesso da mutação zeram a flag. Alternativa descartada: um estado adicional "modo exclusivo" separado da revelação do campo, redundante com a única transição que o produz.

## Risks / Trade-offs

- [Edição de nome/e-mail não salva perdida se o ADM fechar a modal inteira por ESC/clique fora durante o modo exclusivo] → comportamento idêntico ao atual para qualquer edição não salva; não é regressão e não exige mitigação.
- [Salto de altura da modal ao entrar/sair do modo] → já ocorre hoje ao revelar o formulário; o modo exclusivo não adiciona categoria nova de mudança de layout.
- [`Inativar`/`Reativar` temporariamente indisponível durante a redefinição] → intencional e reversível (basta `Cancelar`); nenhuma capacidade é perdida, apenas adiada.
