# Tasks

## 1. Composição da tela de login

- [x] 1.1 Em `src/routes/login.tsx`, mover o `<img>` do wordmark para dentro da `Card` como primeiro filho, centralizado (`mx-auto`), mantendo `src="/feralogo.jpg"`, `alt="Fera"`, `w-56 max-w-full rounded-lg`, e verificar que o código compila sem o `<img>` fora da card
- [x] 1.2 No mesmo arquivo, trocar o fundo do container externo para `bg-[oklch(0.322_0.054_268.8)]` e adicionar `bg-[oklch(0.363_0.079_264.8)]` na `Card`, verificando com `npm run build` que o TypeScript e o Tailwind aceitam as classes
- [x] 1.3 Solicitado durante o apply: centralizar `CardTitle` ("Acesso ao sistema") e `CardDescription` ("Entre com suas credenciais para continuar.") com `text-center`, verificando com `npm run build`

## 2. Verificação visual

- [x] 2.1 Com `npm run dev`, abrir a tela de login e conferir: wordmark dentro da modal acima do formulário, fundo da modal `oklch(0.363 0.079 264.8)` mais claro que o fundo da tela `oklch(0.322 0.054 268.8)`, wordmark se fundindo com a modal sem retângulo visível, rodapé R3 imediatamente abaixo da modal
- [x] 2.2 Abrir uma tela interna autenticada (ex.: projetos) e conferir que o fundo e as cards seguem os tokens do tema, sem alteração
