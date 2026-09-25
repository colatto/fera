## 1. Componente reutilizável

- [x] 1.1 Criar `src/components/ui/password-input.tsx`: wrapper do `Input` shadcn com alternância de exibição — botão de ícone (`Eye`/`EyeOff` do lucide-react) à direita, `pr-10` no input, troca do `type` entre `password` e `text`, botão com `type="button"`, `aria-label` ("Mostrar senha"/"Ocultar senha") e `aria-pressed`, repassando todas as demais props ao `Input`

## 2. Administração de usuários

- [x] 2.1 Em `src/routes/usuarios/usuarios.tsx`, substituir o `Input` do campo "Senha inicial" (criação de usuário) por `PasswordInput`, preservando `id`, `Label`, `autoComplete` e vínculo com o estado `senha`
- [x] 2.2 Em `src/routes/usuarios/usuarios.tsx`, substituir o `Input` do campo "Nova senha" da redefinição pelo ADM por `PasswordInput`, mantendo o modo exclusivo da modal intacto

## 3. Troca da própria senha

- [x] 3.1 Em `src/routes/usuarios/minha-senha.tsx`, substituir o `Input` do campo "Nova senha" por `PasswordInput`, preservando `autoComplete="new-password"`
- [x] 3.2 Remover o campo "Confirmar nova senha": estado `confirmacao`, comparação `novaSenha === confirmacao`, aviso "As senhas não coincidem." e o termo da validação de salvamento que exige igualdade

## 4. Validação

- [x] 4.1 Verificar build e tipagem (`tsc`/Vite) sem erros
- [x] 4.2 Validar os cenários da delta spec: alternância visível/oculto nos três campos, modo exclusivo da modal preservado, tela "Minha senha" sem campo de confirmação, login e "senha atual" sem alternância
