## 1. Correção do layout do `DialogLote`

- [x] 1.1 Em `src/routes/projetos/projeto-detalhe.tsx`, trocar `className="max-w-2xl"` do `DialogContent` do `DialogLote` por `sm:max-w-2xl`
- [x] 1.2 Na linha do item (grid), trocar `grid-cols-[1fr_auto_auto_auto]` por `grid-cols-[minmax(0,1fr)_auto_auto_auto]` e adicionar `min-w-0` ao wrapper flex da coluna da nota
- [x] 1.3 Adicionar `className="w-full"` ao `SelectTrigger` da linha do item

## 2. Verificação no navegador

- [x] 2.1 Com o dev server no ar e login ADM (credenciais `AUTH_ADM_*` do `.env`), reproduzir o fluxo em um projeto com nota emitida e saldo: abrir "Lote de recebimentos", adicionar item e selecionar a nota — conferir que seletor, data, valor, ✕ e rodapé permanecem dentro da caixa da modal, com o rótulo truncado (cenários da spec `interface-web`)
- [x] 2.2 Adicionar um segundo item, selecionar nota em ambos e conferir que as linhas e o rodapé permanecem contidos; abrir o dropdown e conferir que o rótulo completo continua legível nele
- [x] 2.3 Conferir que a modal do lote abre com largura ampliada (2xl) em janela larga e que as demais modais do detalhe (recebimento, nota fiscal, OC) permanecem na largura padrão inalteradas

## 3. Encerramento

- [x] 3.1 Rodar `npm run build` para garantir que o TypeScript compila sem erros
- [x] 3.2 Rodar `openspec validate corre-modal` e arquivar o change após aprovação
