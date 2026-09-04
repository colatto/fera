## Why

O Fera define o Supabase Auth (`auth.users`) como única fonte de credenciais e o `public.usuario` como perfil ativo associado 1:1, mas nada especifica ainda **como** usuários são provisionados, inativados e mantidos, nem como a sessão reage a uma inativação. Sem este recorte, os requisitos "ADM administra usuários por Edge Function/backend com credencial de serviço" e "usuário inativo não acessa dados nem executa operações" ficam sem caminho de implementação verificável.

## What Changes

- Edge Function de administração de usuários, criada e implantada diretamente no Supabase remoto pelo MCP Supabase e executada apenas por ADM autenticado, que cria a credencial em `auth.users` e o perfil em `public.usuario` de forma atômica (mesmo UUID), usando credencial de serviço que nunca chega ao cliente.
- Inativação e reativação de usuário com efeito imediato sobre a sessão: sessões existentes são revogadas e o refresh é negado; enquanto `ativo = false`, o acesso a dados e operações continua bloqueado por `usuario_ativo()`.
- Alteração de perfil (`ADM`/`OPER`), nome e e-mail pelo ADM, com o e-mail sincronizado entre `public.usuario` e `auth.users`.
- Projeção de manutenção que permite ao ADM enxergar usuários ativos e inativos, preservando a regra atual de que cada autenticado só lê a própria linha.
- Sem exclusão física de usuário: a saída do usuário é a inativação (a FK para `auth.users` já é `on delete restrict`).

## Capabilities

### New Capabilities

- `gestao-usuarios`: ciclo de vida do usuário operado pelo ADM — provisionamento atômico de credencial e perfil, inativação/reativação com revogação de sessão, alteração de perfil e dados cadastrais, e consulta de manutenção (ativos e inativos).
- `sessao-acesso`: regras da sessão — autenticação exclusivamente pelo Supabase Auth, bloqueio imediato do usuário inativo, autorização por perfil garantida no banco (RLS/permissões, nunca na interface) e comportamento de sessão anônima/expirada.

### Modified Capabilities

- Nenhuma. `openspec/specs/` está vazio — este é o primeiro recorte de especificação do projeto.

## Impact

- Projeto Supabase remoto: visão/RPCs de manutenção de usuários e ajustes de `GRANT` correspondentes, criados e validados exclusivamente pelo MCP Supabase; o comportamento existente de RLS e das RPCs do fluxo não muda. `banco.sql` permanece apenas como referência declarativa atualizada desse estado.
- Edge Function de administração de usuários criada e implantada diretamente pelo MCP Supabase, com `service_role` guardado somente em segredo do Supabase e nunca exposta ao cliente; não haverá fonte ou configuração local de Edge Function.
- Configuração remota do Supabase Auth, pelo MCP Supabase: provedor e-mail/senha e revogação de sessões via Admin API (banimento/revoke).
- Cliente: obtém o próprio perfil lendo `public.usuario` (`id = auth.uid()`) apenas para navegação; nenhuma decisão de permissão na interface.
