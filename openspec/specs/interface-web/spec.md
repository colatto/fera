## Purpose

Define o shell da aplicação web do Fera: autenticação na interface, sessão no cliente, guarda de rotas como experiência (não como proteção), navegação orientada por perfil, identidade visual derivada do logotipo oficial e comportamento de recarregamento direto de rotas.

## Requirements

### Requirement: Login na interface
A interface MUST autenticar por e-mail e senha exclusivamente pelo Supabase Auth. Falha de credencial MUST produzir mensagem única, sem revelar se o e-mail existe. Após autenticar, a interface MUST carregar a própria linha de `public.usuario` para montar a navegação; autenticado cuja linha não exista ou esteja inativa MUST ter a sessão encerrada pela interface e ser mantido fora do shell com mensagem de acesso indisponível.

#### Scenario: Login válido
- **WHEN** um usuário ativo autentica com e-mail e senha válidos
- **THEN** entra no shell e a navegação é montada conforme o perfil da própria linha em `public.usuario`

#### Scenario: Credenciais inválidas
- **WHEN** a autenticação usa credenciais inválidas
- **THEN** a interface exibe mensagem única de falha e permanece na tela de login

#### Scenario: Autenticado sem perfil ativo
- **WHEN** a autenticação é aceita mas a linha do usuário em `public.usuario` não existe ou está inativa
- **THEN** a interface encerra a sessão, exibe mensagem de acesso indisponível e retorna ao login

### Requirement: Logout
A interface MUST permitir encerrar a sessão a qualquer momento, retornando à tela de login; após o logout, consultas MUST exigir nova autenticação e o estado de sessão local MUST estar limpo.

#### Scenario: Logout encerra acesso
- **WHEN** o usuário autenticado encerra a sessão
- **THEN** a interface volta ao login e nenhum dado da aplicação é obtido sem nova autenticação

### Requirement: Guarda de rota como experiência
Rotas internas sem sessão válida MUST redirecionar à tela de login. A guarda de rota é experiência de uso, não proteção: a interface MUST NOT apresentar-se como mecanismo de autorização, e o acesso forçado a rota administrativa por URL MUST degradar para estado sem dados quando o banco negar a leitura, sem quebrar a aplicação.

#### Scenario: Anônimo acessa rota interna
- **WHEN** um visitante sem sessão abre uma rota interna
- **THEN** é redirecionado ao login e, após autenticar, retorna à rota pretendida

#### Scenario: OPER força URL administrativa
- **WHEN** um usuário OPER navega diretamente a uma rota de conteúdo administrativo
- **THEN** a interface não obtém os dados protegidos e apresenta estado de dados indisponíveis, permanecendo utilizável

### Requirement: Sessão inválida durante o uso
Quando a sessão perde validade durante o uso (expiração, renovação negada ou revogação por inativação), a interface MUST redirecionar ao login com mensagem de sessão encerrada, sem repetir indefinidamente tentativas de renovação e sem exibir dados obtidos com a sessão anterior.

#### Scenario: Sessão revogada por inativação
- **WHEN** o ADM inativa um usuário que está com a aplicação aberta
- **THEN** a interface da vítima passa a redirecionar ao login e o acesso só retorna após reativação e nova autenticação

### Requirement: Navegação orientada por perfil
A navegação MUST refletir o perfil do próprio usuário: ADM alcança projetos, dashboards operacional e financeiro, cadastros, fluxo financeiro e administração de usuários; OPER alcança projetos, dashboard operacional e eventos. Entradas administrativas MUST NOT ser oferecidas a OPER na navegação.

#### Scenario: Menu por perfil
- **WHEN** ADM e OPER autenticam
- **THEN** o menu do ADM inclui as áreas administrativas e financeiras e o do OPER inclui somente as áreas operacionais

### Requirement: Identidade visual Fera
A interface MUST aplicar identidade visual derivada do logotipo oficial (`feralogo.jpg`): tema escuro em navy profundo com o wordmark presente na tela de login e no shell, texto de destaque em branco e hierarquia tipográfica compatível com o logotipo (caixa alta com espaçamento largo nos rótulos).

#### Scenario: Wordmark e paleta presentes
- **WHEN** a aplicação é aberta em qualquer tela
- **THEN** o wordmark do logotipo é exibido na entrada e no shell e os componentes seguem a paleta navy/branco derivada do logotipo

### Requirement: Recarregamento direto de rota
A aplicação MUST servir o próprio aplicativo quando qualquer rota interna for recarregada ou aberta diretamente por URL, aplicando a guarda de sessão normalmente, em vez de retornar erro de endereço inexistente.

#### Scenario: Refresh em rota interna
- **WHEN** o usuário recarrega o navegador em uma rota interna
- **THEN** a aplicação é servida naquela rota, com sessão verificada, sem página de erro

### Requirement: Estados padronizados de consulta
Toda consulta da interface MUST apresentar estado de carregamento, estado vazio explícito quando o retorno não tem dados e mensagem do erro quando a leitura falha; conjunto vazio MUST NOT ser apresentado como erro.

#### Scenario: Consulta sem dados
- **WHEN** uma listagem retorna conjunto vazio
- **THEN** a interface exibe estado vazio explícito, distinto de erro

### Requirement: Erros de escrita exibidos em linguagem compreensível
Toda mensagem de erro exibida ao usuário após uma operação de escrita (criar, alterar, processar) MUST estar em português e ser compreensível sem conhecimento técnico de banco de dados. Quando a escrita for rejeitada por uma restrição de unicidade, exclusão ou verificação do banco, a interface MUST exibir uma mensagem que descreva a causa em termos do domínio (ex.: nome já existente, CNPJ já cadastrado) — nunca o texto cru do erro do banco (nomes de constraint, códigos SQL ou mensagens em inglês do SGBD). Mensagens de erro já redigidas em português pelas funções do banco (ex.: "Tipo inexistente ou inativo") MUST ser exibidas como estão, sem retradução. Erros sem tradução conhecida MUST ser exibidos com a mensagem original, mantendo o comportamento atual como fallback.

#### Scenario: Nome duplicado exibido de forma amigável
- **WHEN** o ADM salva um cadastro cujo nome já existe (ex.: operadora "Vivo" quando "Vivo" já está cadastrada)
- **THEN** a interface exibe mensagem em português informando que já existe um registro com aquele nome, citando o valor informado, sem exibir nomes de constraint nem texto do SGBD

#### Scenario: CNPJ duplicado exibido de forma amigável
- **WHEN** o ADM salva um cliente com CNPJ já cadastrado
- **THEN** a interface exibe mensagem em português informando que o CNPJ já está cadastrado, sem texto cru do banco

#### Scenario: Mensagem de negócio do banco preservada
- **WHEN** uma função do banco rejeita a operação com mensagem já redigida em português (ex.: "Tipo inexistente ou inativo", "Cliente inexistente ou inativo")
- **THEN** a interface exibe exatamente essa mensagem, sem alteração

#### Scenario: Erro desconhecido mantém fallback
- **WHEN** a escrita falha com um erro sem tradução conhecida (ex.: falha de rede, erro interno não mapeado)
- **THEN** a interface exibe a mensagem de erro disponível hoje, sem quebrar nem exibir "[object Object]"

### Requirement: Integridade de modais com conteúdo longo
Toda modal da interface MUST manter todo o próprio conteúdo — campos, rótulos, valores selecionados e ações do rodapé — dentro dos limites da caixa do diálogo, em qualquer viewport suportado. Quando um rótulo ou valor selecionado exceder o espaço disponível, a interface MUST truncá-lo com indicação visual de corte em vez de expandir a modal, deslocar campos para fora da caixa ou sobrepor elementos. A modal de confirmação de recebimentos em lote MUST ser apresentada em largura ampliada em relação às modais padrão do sistema, comportando na mesma linha do item a nota selecionada, a data e o valor.

#### Scenario: Seleção de nota mantém a modal do lote íntegra
- **WHEN** o ADM abre "Lote de recebimentos", adiciona um item e seleciona uma nota com rótulo longo (pasta, número da nota e saldo)
- **THEN** o seletor da nota, a data, o valor e o botão de remover permanecem dentro da caixa da modal, o rodapé segue inteiro dentro dela e o rótulo da nota selecionada é truncado com reticências

#### Scenario: Múltiplos itens permanecem contidos
- **WHEN** o ADM adiciona vários itens ao lote e seleciona notas em todos
- **THEN** cada linha permanece contida na modal, sem empurrar as demais linhas nem o rodapé para fora da caixa

#### Scenario: Largura ampliada da modal de lote
- **WHEN** o ADM abre a modal de confirmação de recebimentos em lote em janela de computador
- **THEN** a modal é apresentada com largura ampliada em relação às modais padrão do sistema, exibindo nota, data e valor lado a lado na mesma linha

### Requirement: Ações de cancelamento em estilo destructive
As ações de cancelamento da interface MUST usar o estilo visual de ação destrutiva do design system (fundo avermelhado com texto na cor de destruição) tanto no botão-gatilho oferecido na tela quanto no botão que confirma a ação dentro do diálogo de confirmação. Os gatilhos e botões de confirmação de "Cancelar projeto" e "Cancelar envio" no detalhe do projeto MUST seguir essa convenção, de modo que botões correspondentes da mesma ação tenham cores idênticas entre si.

#### Scenario: Gatilho "Cancelar envio" igual ao gatilho "Cancelar projeto"
- **WHEN** o usuário visualiza um projeto em status `ENVIADO` na página do projeto
- **THEN** o botão "Cancelar envio" é apresentado no mesmo estilo destructive do gatilho "Cancelar projeto", distinto dos botões neutros de ações de fluxo como "Ordem de compra"

#### Scenario: Confirmação do diálogo "Cancelar envio" igual à do diálogo "Cancelar projeto"
- **WHEN** o usuário abre o diálogo de confirmação "Cancelar envio"
- **THEN** o botão de confirmação é apresentado no mesmo estilo destructive do botão de confirmação do diálogo "Cancelar projeto", sem usar o estilo de ação primária

### Requirement: Rodapé institucional
A interface MUST exibir a linha institucional `R3 © {ano} F.E.R.A. Projetos e Engenharia · v{versão} · Solicitar suporte` de forma discreta, em texto pequeno e esmaecido, na tela de login e no shell. Na tela de login, a linha MUST aparecer imediatamente abaixo da modal de acesso. No shell, a linha MUST aparecer fora da sidebar, no canto inferior direito da área de conteúdo, em linha única e sempre visível durante a rolagem. O termo `R3` MUST ser um link para `https://ruatrez.com` e `Solicitar suporte` MUST ser um link para `https://calendly.com/suporter3/agenda`, ambos abertos em nova aba do navegador. O ano exibido MUST ser o ano corrente, obtido automaticamente, sem ajuste manual. Em viewports estreitos a linha MUST ser encurtada para `R3 © {ano} · v{versão} · Suporte`, preservando os mesmos links.

#### Scenario: Linha abaixo da modal no login
- **WHEN** a tela de login é aberta
- **THEN** a linha institucional completa aparece imediatamente abaixo da modal de acesso, discreta, sem deslocar a modal do centro

#### Scenario: Linha no canto inferior direito do shell
- **WHEN** um usuário autenticado navega no shell em janela de computador
- **THEN** a linha institucional completa aparece fora da sidebar, no canto inferior direito da área de conteúdo, permanecendo visível enquanto o conteúdo rola

#### Scenario: Linha encurtada em viewport estreito
- **WHEN** o sistema é aberto em viewport estreito
- **THEN** a linha aparece encurtada (`R3 © {ano} · v{versão} · Suporte`) no mesmo canto, mantendo os links

#### Scenario: Link R3 abre o site institucional
- **WHEN** o usuário aciona o termo `R3` na linha
- **THEN** `https://ruatrez.com` é aberto em nova aba do navegador, sem sair da aplicação

#### Scenario: Link de suporte abre a agenda
- **WHEN** o usuário aciona `Solicitar suporte` (ou `Suporte` na forma encurtada) na linha
- **THEN** `https://calendly.com/suporter3/agenda` é aberto em nova aba do navegador, sem sair da aplicação

#### Scenario: Ano corrente sem manutenção
- **WHEN** a linha é renderizada em qualquer data
- **THEN** exibe o ano corrente daquele momento, sem necessidade de alteração no código

### Requirement: Versão exibida
A versão exibida no rodapé MUST ser a versão registrada no `package.json` do commit a partir do qual a aplicação foi construída, iniciando em `0.1.0`. A cada novo commit o contador da versão MUST avançar exatamente 1, sem considerar o histórico de commits anterior, com carry de dígito a cada 9: vencido o dígito 9, o dígito seguinte avança (v0.1.9 → v0.2.0; v0.9.9 → v1.0.0; v1.9.9 → v2.0.0). A versão MUST ser a mesma em todas as exibições da linha institucional.

#### Scenario: Versão corresponde ao commit construído
- **WHEN** a aplicação construída a partir de um commit é aberta em qualquer tela com rodapé
- **THEN** a versão exibida é a registrada no `package.json` daquele commit, igual no login e no shell

#### Scenario: Cada commit soma 1
- **WHEN** commits sucessivos são construídos e publicados
- **THEN** a versão avança 1 por commit (v0.1.0 → v0.1.1 → v0.1.2 …), independentemente do total de commits do repositório

#### Scenario: Carry de dígito a cada 9
- **WHEN** o contador atinge o dígito 9 e um novo commit é feito
- **THEN** a versão avança com carry (v0.1.9 → v0.2.0, v0.9.9 → v1.0.0, v1.9.9 → v2.0.0)
