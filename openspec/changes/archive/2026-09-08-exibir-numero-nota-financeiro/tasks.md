## 1. Card Financeiro do detalhe

- [x] 1.1 Em `src/routes/projetos/projeto-detalhe.tsx`, adicionar antes de "Valor da nota" a linha condicional `LinhaFinanceira` "Número da nota" com valor `${adm.numero_nota_fiscal} (${formatarData(adm.data_emissao)})`, renderizada apenas quando `adm.numero_nota_fiscal` existir

## 2. Verificação

- [x] 2.1 Conferir no detalhe de um projeto com nota registrada (perfil ADM): linha exibe número + data de emissão em pt-BR, e as demais linhas permanecem inalteradas
- [x] 2.2 Conferir no detalhe de um projeto sem nota registrada (perfil ADM): linha ausente, card como antes
