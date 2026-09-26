-- Fera — referência declarativa do schema PostgreSQL / Supabase esperado.
-- Não é mecanismo de deploy: toda alteração e validação ocorre somente pelo MCP Supabase no projeto remoto.
-- Não criar/remover bancos, ambientes, schemas ou auth.users localmente.

create type public.app_role as enum ('ADM', 'OPER');
create type public.project_status as enum ('CADASTRADO', 'ENVIADO', 'OC_REGISTRADA', 'AUTORIZADO_FATURAMENTO', 'NOTA_EMITIDA', 'PAGO', 'CANCELADO');
create type public.project_event_type as enum ('CRIACAO', 'ALTERACAO_CADASTRAL', 'ALTERACAO_STATUS', 'COMPATIBILIZACAO_FUNDACAO');

create table public.usuario (
  id uuid primary key references auth.users(id) on delete restrict,
  perfil public.app_role not null, nome varchar(150) not null, email varchar(254) not null unique,
  ativo boolean not null default true, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table public.cliente (
  id bigint generated always as identity primary key, nome varchar(150) not null, cnpj varchar(14), ativo boolean not null default true,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint cliente_cnpj_formato check (cnpj is null or cnpj ~ '^[0-9]{14}$')
);
create unique index cliente_cnpj_unico on public.cliente (cnpj) where cnpj is not null;
create table public.operadora (
  id bigint generated always as identity primary key, nome varchar(100) not null unique, ativo boolean not null default true,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table public.tipo_projeto (
  id bigint generated always as identity primary key, nome varchar(100) not null unique,
  limite_parcelas smallint not null default 1 check (limite_parcelas > 0), ativo boolean not null default true,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint tipo_torre_limite_parcelas check (lower(nome) <> 'torre' or limite_parcelas between 1 and 3)
);
create table public.ordem_compra (
  id bigint generated always as identity primary key, numero varchar(100) not null, data_oc date not null,
  registrado_por uuid not null references public.usuario(id) on delete restrict, registrado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint ordem_compra_numero_normalizada check (numero = btrim(numero)), constraint ordem_compra_numero_unico unique (numero)
);
create table public.projeto (
  id bigint generated always as identity primary key, numero integer not null check (numero >= 1), ano smallint not null check (ano between 2000 and 9999),
  codigo_pasta varchar(20) not null unique check (codigo_pasta ~ '^F-[0-9]{4}-[0-9]{4,}$'),
  tipo_projeto_id bigint not null references public.tipo_projeto(id) on delete restrict, cliente_id bigint not null references public.cliente(id) on delete restrict,
  identificador_cliente varchar(100) not null, operadora_id bigint not null references public.operadora(id) on delete restrict, identificador_operadora varchar(100) not null,
  ordem_compra_id bigint references public.ordem_compra(id) on delete restrict, centro_custo varchar(100), pasta_local varchar(500), cidade varchar(100) not null, uf char(2) not null check (uf ~ '^[A-Z]{2}$'),
  valor numeric(15,2) not null constraint projeto_valor_positivo check (valor > 0),
  responsavel_interno_id uuid not null references public.usuario(id) on delete restrict, status public.project_status not null default 'CADASTRADO', data_envio date,
  fundacao_compatibilizada boolean not null default false, fundacao_compatibilizada_por uuid references public.usuario(id) on delete restrict, fundacao_compatibilizada_em timestamptz,
  criado_por uuid not null references public.usuario(id) on delete restrict,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint projeto_envio_por_status check (status in ('CADASTRADO', 'CANCELADO') or data_envio is not null),
  constraint projeto_pasta_local_caminho check (pasta_local is null or (pasta_local = btrim(pasta_local) and pasta_local ~ '^[A-Za-z]:\\' and pasta_local !~ '[[:cntrl:]]')),
  constraint projeto_fundacao_auditada check ((not fundacao_compatibilizada and fundacao_compatibilizada_por is null and fundacao_compatibilizada_em is null) or (fundacao_compatibilizada and fundacao_compatibilizada_por is not null and fundacao_compatibilizada_em is not null)),
  constraint projeto_ano_numero_key unique (ano, numero)
);
create table public.sequencia_projeto (
  ano smallint primary key check (ano between 2000 and 9999),
  proximo_numero integer not null default 1 check (proximo_numero >= 1),
  atualizado_em timestamptz not null default now()
);
create table public.autorizacao_faturamento (
  id bigint generated always as identity primary key, projeto_id bigint not null unique references public.projeto(id) on delete restrict,
  autorizado_por uuid not null references public.usuario(id) on delete restrict, autorizado_em timestamptz not null default now()
);
create table public.nota_fiscal (
  id bigint generated always as identity primary key, projeto_id bigint not null unique references public.projeto(id) on delete restrict,
  numero varchar(50) not null, data_emissao date not null, valor numeric(15,2) not null check (valor > 0),
  registrado_por uuid not null references public.usuario(id) on delete restrict, registrado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint nota_fiscal_numero_normalizada check (numero = btrim(numero)), constraint nota_fiscal_numero_unico unique (numero)
);
create table public.recebimento (
  id bigint generated always as identity primary key, nota_fiscal_id bigint not null references public.nota_fiscal(id) on delete restrict,
  data_recebimento date not null, valor_recebido numeric(15,2) not null check (valor_recebido > 0),
  confirmado_por uuid not null references public.usuario(id) on delete restrict, confirmado_em timestamptz not null default now()
);
create table public.evento_projeto (
  id bigint generated always as identity primary key, projeto_id bigint not null references public.projeto(id) on delete restrict,
  realizado_por uuid not null references public.usuario(id) on delete restrict, tipo public.project_event_type not null,
  status_anterior public.project_status, status_novo public.project_status, motivo_cancelamento text, detalhes jsonb, realizado_em timestamptz not null default now(),
  constraint evento_cancelamento_motivo check (status_novo <> 'CANCELADO' or nullif(btrim(motivo_cancelamento), '') is not null),
  constraint evento_detalhes_sem_financeiro check (detalhes is null or not (detalhes ?| array['valor', 'valor_recebido', 'financeiro', 'nota_fiscal']))
);
create index projeto_consulta_idx on public.projeto (status, criado_em desc);
create index projeto_cliente_idx on public.projeto (cliente_id);
create index projeto_operadora_idx on public.projeto (operadora_id);
create index projeto_tipo_idx on public.projeto (tipo_projeto_id);
create index projeto_localizacao_idx on public.projeto (uf, cidade);
create index projeto_envio_sem_oc_idx on public.projeto (data_envio) where ordem_compra_id is null and status <> 'CANCELADO';
create unique index projeto_centro_custo_unico on public.projeto (centro_custo);
create index evento_linha_tempo_idx on public.evento_projeto (projeto_id, realizado_em desc);
create index recebimento_nota_idx on public.recebimento (nota_fiscal_id);

create or replace function public.fn_atualizar_timestamp() returns trigger language plpgsql as $$ begin new.atualizado_em := now(); return new; end; $$;
create or replace function public.fn_impedir_edicao_evento() returns trigger language plpgsql as $$ begin raise exception 'Eventos de projeto são imutáveis'; end; $$;
create or replace function public.fn_proteger_projeto() returns trigger language plpgsql as $$
begin
  if new.numero <> old.numero or new.codigo_pasta <> old.codigo_pasta then raise exception 'Número e código da pasta não podem ser alterados'; end if;
  if old.status = 'CANCELADO' and new.status <> 'CANCELADO' then raise exception 'Projeto cancelado não pode retornar ao fluxo ativo'; end if;
  return new;
end; $$;
create or replace function public.fn_garantir_adm_ativo() returns trigger language plpgsql set search_path = public as $$
begin
  if old.perfil = 'ADM' and old.ativo and (new.perfil <> 'ADM' or not new.ativo) then
    perform 1 from public.usuario u where u.id <> new.id and u.perfil = 'ADM' and u.ativo for update;
    if not found then raise exception 'Salvaguarda de administração: o sistema deve manter ao menos um ADM ativo'; end if;
  end if;
  return new;
end; $$;
create trigger usuario_atualizado before update on public.usuario for each row execute function public.fn_atualizar_timestamp();
create trigger usuario_garante_adm before update on public.usuario for each row execute function public.fn_garantir_adm_ativo();
create trigger cliente_atualizado before update on public.cliente for each row execute function public.fn_atualizar_timestamp();
create trigger operadora_atualizado before update on public.operadora for each row execute function public.fn_atualizar_timestamp();
create trigger tipo_atualizado before update on public.tipo_projeto for each row execute function public.fn_atualizar_timestamp();
create trigger oc_atualizada before update on public.ordem_compra for each row execute function public.fn_atualizar_timestamp();
create trigger projeto_atualizado before update on public.projeto for each row execute function public.fn_atualizar_timestamp();
create trigger nota_atualizada before update on public.nota_fiscal for each row execute function public.fn_atualizar_timestamp();
create trigger projeto_protegido before update on public.projeto for each row execute function public.fn_proteger_projeto();
create trigger evento_imutavel before update or delete on public.evento_projeto for each row execute function public.fn_impedir_edicao_evento();

create or replace function public.usuario_ativo() returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.usuario u where u.id = auth.uid() and u.ativo)
$$;
create or replace function public.usuario_adm() returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.usuario u where u.id = auth.uid() and u.ativo and u.perfil = 'ADM')
$$;

create or replace function public.criar_projeto(p_tipo_id bigint, p_cliente_id bigint, p_identificador_cliente varchar, p_operadora_id bigint, p_identificador_operadora varchar, p_cidade varchar, p_uf char(2), p_valor numeric, p_responsavel_id uuid)
returns bigint language plpgsql security definer set search_path = public, auth as $$
declare v_tipo public.tipo_projeto%rowtype; v_numero integer; v_id bigint; v_ano smallint := extract(year from current_date)::smallint;
begin
  if not public.usuario_adm() then raise exception 'Apenas ADM pode cadastrar projetos' using errcode = '42501'; end if;
  select * into v_tipo from public.tipo_projeto where id = p_tipo_id and ativo;
  if not found then raise exception 'Tipo inexistente ou inativo'; end if;
  perform 1 from public.cliente where id = p_cliente_id and ativo;
  if not found then raise exception 'Cliente inexistente ou inativo'; end if;
  perform 1 from public.operadora where id = p_operadora_id and ativo;
  if not found then raise exception 'Operadora inexistente ou inativa'; end if;
  perform 1 from public.usuario where id = p_responsavel_id and ativo; if not found then raise exception 'Responsável inexistente ou inativo'; end if;
  insert into public.sequencia_projeto(ano, proximo_numero) values (v_ano, 1)
  on conflict (ano) do update set proximo_numero = sequencia_projeto.proximo_numero + 1, atualizado_em = now()
  returning proximo_numero into v_numero;
  insert into public.projeto(numero, ano, codigo_pasta, tipo_projeto_id, cliente_id, identificador_cliente, operadora_id, identificador_operadora, cidade, uf, valor, responsavel_interno_id, criado_por)
  values(v_numero, v_ano, format('F-%s-%s', v_ano, lpad(v_numero::text,4,'0')), p_tipo_id, p_cliente_id, p_identificador_cliente, p_operadora_id, p_identificador_operadora, p_cidade, upper(p_uf), p_valor, p_responsavel_id, auth.uid()) returning id into v_id;
  insert into public.evento_projeto(projeto_id, realizado_por, tipo, detalhes) values(v_id, auth.uid(), 'CRIACAO', jsonb_build_object('origem','cadastro'));
  return v_id;
end; $$;

create or replace function public.alterar_status_projeto(p_id bigint, p_novo public.project_status, p_data_envio date default null, p_motivo text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v public.projeto%rowtype;
begin
  if not public.usuario_ativo() then raise exception 'Usuário inativo ou não cadastrado' using errcode = '42501'; end if;
  select * into v from public.projeto where id = p_id for update;
  if not found or v.status = 'CANCELADO' then raise exception 'Projeto inexistente ou cancelado'; end if;
  if p_novo = 'ENVIADO' and v.status = 'CADASTRADO' then update public.projeto set status=p_novo, data_envio=coalesce(p_data_envio,current_date) where id=p_id;
  elsif p_novo = 'CADASTRADO' and v.status = 'ENVIADO' then update public.projeto set status=p_novo, data_envio=null where id=p_id;
  elsif p_novo = 'CANCELADO' and v.status = 'CADASTRADO' and nullif(btrim(p_motivo),'') is not null then update public.projeto set status=p_novo where id=p_id;
  elsif p_novo = 'CANCELADO' and v.status <> 'CADASTRADO' then raise exception 'Cancelamento exige projeto em status CADASTRADO';
  else raise exception 'Transição manual não autorizada'; end if;
  insert into public.evento_projeto(projeto_id, realizado_por, tipo, status_anterior, status_novo, motivo_cancelamento) values(p_id, auth.uid(), 'ALTERACAO_STATUS', v.status, p_novo, p_motivo);
end; $$;

create or replace function public.registrar_ordem_compra(p_numero varchar, p_data date) returns bigint language plpgsql security definer set search_path = public, auth as $$
declare v_id bigint; begin if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if; insert into public.ordem_compra(numero,data_oc,registrado_por) values(p_numero,p_data,auth.uid()) returning id into v_id; return v_id; end; $$;
create or replace function public.vincular_ordem_compra(p_projeto bigint, p_oc bigint, p_centro varchar default null) returns void language plpgsql security definer set search_path = public, auth as $$
declare v_status public.project_status; v_centro varchar;
begin
  if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if;
  v_centro := nullif(btrim(coalesce(p_centro, '')), '');
  select status into v_status from public.projeto where id=p_projeto for update;
  if v_status <> 'ENVIADO' then raise exception 'OC requer projeto enviado e ativo'; end if;
  perform 1 from public.ordem_compra where id=p_oc;
  if not found then raise exception 'OC inexistente'; end if;
  begin
    update public.projeto set ordem_compra_id=p_oc,centro_custo=v_centro,status='OC_REGISTRADA' where id=p_projeto;
  exception
    when unique_violation then raise exception 'Centro de custo já pertence a outro projeto';
  end;
  insert into public.evento_projeto(projeto_id,realizado_por,tipo,status_anterior,status_novo) values(p_projeto,auth.uid(),'ALTERACAO_STATUS','ENVIADO','OC_REGISTRADA');
end; $$;
create or replace function public.autorizar_faturamento(p_projeto bigint) returns void language plpgsql security definer set search_path = public, auth as $$
declare v public.projeto%rowtype; begin if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if; select * into v from public.projeto where id=p_projeto for update; if not found or v.status <> 'OC_REGISTRADA' or v.ordem_compra_id is null then raise exception 'Autorização requer OC registrada'; end if; insert into public.autorizacao_faturamento(projeto_id,autorizado_por) values(p_projeto,auth.uid()); update public.projeto set status='AUTORIZADO_FATURAMENTO' where id=p_projeto; insert into public.evento_projeto(projeto_id,realizado_por,tipo,status_anterior,status_novo) values(p_projeto,auth.uid(),'ALTERACAO_STATUS','OC_REGISTRADA','AUTORIZADO_FATURAMENTO'); end; $$;
create or replace function public.registrar_nota_fiscal(p_projeto bigint,p_numero varchar,p_data date) returns bigint language plpgsql security definer set search_path = public, auth as $$
declare v_id bigint; v_status public.project_status; begin if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if; select status into v_status from public.projeto where id=p_projeto for update; if v_status <> 'AUTORIZADO_FATURAMENTO' then raise exception 'Nota exige autorização'; end if; insert into public.nota_fiscal(projeto_id,numero,data_emissao,valor,registrado_por) values(p_projeto,p_numero,p_data,(select valor from public.projeto where id=p_projeto),auth.uid()) returning id into v_id; update public.projeto set status='NOTA_EMITIDA' where id=p_projeto; insert into public.evento_projeto(projeto_id,realizado_por,tipo,status_anterior,status_novo) values(p_projeto,auth.uid(),'ALTERACAO_STATUS','AUTORIZADO_FATURAMENTO','NOTA_EMITIDA'); return v_id; end; $$;
create or replace function public.registrar_recebimento(p_nota bigint,p_data date,p_valor numeric) returns void language plpgsql security definer set search_path = public, auth as $$
declare n public.nota_fiscal%rowtype; p public.projeto%rowtype; v_limite smallint; v_total numeric(15,2); v_qtd integer;
begin
  if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if; select * into n from public.nota_fiscal where id=p_nota for update; if not found then raise exception 'Nota inexistente'; end if;
  select * into p from public.projeto where id=n.projeto_id for update;
  select limite_parcelas into v_limite from public.tipo_projeto where id=p.tipo_projeto_id;
  if p.status <> 'NOTA_EMITIDA' then raise exception 'Recebimento exige nota emitida'; end if; select coalesce(sum(valor_recebido),0),count(*) into v_total,v_qtd from public.recebimento where nota_fiscal_id=p_nota;
  if v_qtd >= v_limite or p_valor <= 0 or v_total+p_valor > n.valor then raise exception 'Parcela inválida, acima do limite ou do saldo'; end if;
  insert into public.recebimento(nota_fiscal_id,data_recebimento,valor_recebido,confirmado_por) values(p_nota,p_data,p_valor,auth.uid());
  if v_total+p_valor=n.valor then update public.projeto set status='PAGO' where id=p.id; insert into public.evento_projeto(projeto_id,realizado_por,tipo,status_anterior,status_novo) values(p.id,auth.uid(),'ALTERACAO_STATUS','NOTA_EMITIDA','PAGO'); end if;
end; $$;
create or replace function public.confirmar_recebimentos_lote(p_itens jsonb) returns void language plpgsql security definer set search_path = public, auth as $$
declare i jsonb; begin if jsonb_typeof(p_itens) <> 'array' then raise exception 'Lote deve ser um array JSON'; end if; for i in select value from jsonb_array_elements(p_itens) loop perform public.registrar_recebimento((i->>'nota_fiscal_id')::bigint,(i->>'data_recebimento')::date,(i->>'valor_recebido')::numeric); end loop; end; $$;
create or replace function public.definir_compatibilizacao_fundacao(p_projeto bigint,p_marcada boolean) returns void language plpgsql security definer set search_path = public, auth as $$
begin if not public.usuario_adm() then raise exception 'Apenas ADM' using errcode='42501'; end if; update public.projeto set fundacao_compatibilizada=p_marcada,fundacao_compatibilizada_por=case when p_marcada then auth.uid() else null end,fundacao_compatibilizada_em=case when p_marcada then now() else null end where id=p_projeto; if not found then raise exception 'Projeto inexistente'; end if; insert into public.evento_projeto(projeto_id,realizado_por,tipo,detalhes) values(p_projeto,auth.uid(),'COMPATIBILIZACAO_FUNDACAO',jsonb_build_object('marcada',p_marcada)); end; $$;

-- p_pasta_local: ausente (null) preserva a pasta vigente — mantém compatíveis as
-- chamadas antigas de 3 parâmetros durante a janela de deploy; vazio ou só de
-- espaços limpa a pasta; caminho preenchido é trimado e validado como caminho
-- Windows (letra de unidade + ":\", sem caracteres de controle). No-op somente
-- quando identificadores E pasta estão idênticos aos vigentes — um único evento
-- ALTERACAO_CADASTRAL quando algo muda.
create or replace function public.editar_identificadores_projeto(p_id bigint, p_identificador_cliente varchar, p_identificador_operadora varchar, p_pasta_local varchar default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v public.projeto%rowtype;
  v_cliente varchar;
  v_operadora varchar;
  v_pasta varchar;
begin
  if not public.usuario_adm() then raise exception 'Apenas ADM pode editar identificadores do projeto' using errcode = '42501'; end if;
  select * into v from public.projeto where id = p_id for update;
  if not found then raise exception 'Projeto inexistente'; end if;
  if v.status <> 'CADASTRADO' then raise exception 'A edição de identificadores exige projeto em status CADASTRADO'; end if;
  v_cliente := btrim(coalesce(p_identificador_cliente, ''));
  v_operadora := btrim(coalesce(p_identificador_operadora, ''));
  if v_cliente = '' or v_operadora = '' then raise exception 'Identificadores do cliente e da operadora são obrigatórios'; end if;
  if p_pasta_local is null then
    v_pasta := v.pasta_local;
  else
    v_pasta := nullif(btrim(p_pasta_local), '');
    if v_pasta is not null then
      if v_pasta !~ '^[A-Za-z]:\\' then
        raise exception 'Pasta local deve ser um caminho Windows iniciado por letra de unidade (ex.: P:\Projetos)';
      end if;
      if v_pasta ~ '[[:cntrl:]]' then
        raise exception 'Pasta local não pode conter caracteres de controle';
      end if;
      if length(v_pasta) > 500 then
        raise exception 'Pasta local excede o limite de 500 caracteres';
      end if;
    end if;
  end if;
  if v_cliente = v.identificador_cliente and v_operadora = v.identificador_operadora and v_pasta is not distinct from v.pasta_local then return; end if;
  update public.projeto set identificador_cliente = v_cliente, identificador_operadora = v_operadora, pasta_local = v_pasta where id = p_id;
  insert into public.evento_projeto(projeto_id, realizado_por, tipo) values(p_id, auth.uid(), 'ALTERACAO_CADASTRAL');
end;
$$;

alter table public.usuario enable row level security;
alter table public.cliente enable row level security;
alter table public.operadora enable row level security;
alter table public.tipo_projeto enable row level security;
alter table public.ordem_compra enable row level security;
alter table public.projeto enable row level security;
alter table public.autorizacao_faturamento enable row level security;
alter table public.nota_fiscal enable row level security;
alter table public.recebimento enable row level security;
alter table public.evento_projeto enable row level security;
create policy usuario_leitura on public.usuario for select using (id=auth.uid() or public.usuario_adm());
create policy cliente_leitura on public.cliente for select using (public.usuario_adm() or (public.usuario_ativo() and ativo));
create policy operadora_leitura on public.operadora for select using (public.usuario_adm() or (public.usuario_ativo() and ativo));
create policy tipo_leitura on public.tipo_projeto for select using (public.usuario_adm() or (public.usuario_ativo() and ativo));
create policy oc_adm on public.ordem_compra for select using (public.usuario_adm());
create policy autorizacao_adm on public.autorizacao_faturamento for select using (public.usuario_adm());
create policy nota_adm on public.nota_fiscal for select using (public.usuario_adm());
create policy recebimento_adm on public.recebimento for select using (public.usuario_adm());
create policy cliente_adm_inserir on public.cliente for insert with check (public.usuario_adm());
create policy cliente_adm_atualizar on public.cliente for update using (public.usuario_adm()) with check (public.usuario_adm());
create policy operadora_adm_inserir on public.operadora for insert with check (public.usuario_adm());
create policy operadora_adm_atualizar on public.operadora for update using (public.usuario_adm()) with check (public.usuario_adm());
create policy tipo_adm_inserir on public.tipo_projeto for insert with check (public.usuario_adm());
create policy tipo_adm_atualizar on public.tipo_projeto for update using (public.usuario_adm()) with check (public.usuario_adm());

create or replace function public.dashboard_operacional(p_data_inicial date, p_data_final date)
returns table (projetos_por_status jsonb, enviados_no_periodo bigint, enviados_sem_oc bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.usuario_ativo() then raise exception 'Usuário inativo ou não cadastrado' using errcode = '42501'; end if;
  if p_data_inicial is null or p_data_final is null or p_data_inicial > p_data_final then raise exception 'Período inválido'; end if;
  return query
  select
    coalesce((select jsonb_object_agg(status, quantidade) from (
      select status::text, count(*)::bigint quantidade from public.projeto where status <> 'CANCELADO' group by status
    ) por_status), '{}'::jsonb),
    count(*) filter (where p.data_envio between p_data_inicial and p_data_final)::bigint,
    count(*) filter (where p.data_envio is not null and p.ordem_compra_id is null and p.status <> 'CANCELADO')::bigint
  from public.projeto p;
end; $$;

create view public.v_usuarios_manutencao with (security_barrier = true) as
  select id, perfil, nome, email, ativo, criado_em, atualizado_em from public.usuario where public.usuario_adm();
create view public.v_projetos_operacional with (security_barrier = true) as
  select p.id,p.numero,p.ano,p.codigo_pasta,p.status,p.data_envio,p.cidade,p.uf,c.nome cliente,p.identificador_cliente,o.nome operadora,p.identificador_operadora,t.nome tipo_projeto,p.fundacao_compatibilizada,p.criado_em,p.atualizado_em,p.pasta_local
  from public.projeto p join public.cliente c on c.id=p.cliente_id join public.operadora o on o.id=p.operadora_id join public.tipo_projeto t on t.id=p.tipo_projeto_id
  where public.usuario_ativo();
create view public.v_eventos_operacionais with (security_barrier = true) as
  select e.id,e.projeto_id,e.realizado_por,e.tipo,e.status_anterior,e.status_novo,e.motivo_cancelamento,case when public.usuario_adm() then e.detalhes end as detalhes,e.realizado_em
  from public.evento_projeto e where public.usuario_ativo();
create view public.v_dashboard_operacional with (security_barrier = true) as
  select status, count(*)::bigint quantidade from public.projeto where status <> 'CANCELADO' and public.usuario_ativo() group by status;
create view public.v_ordens_compra_administrativo with (security_barrier = true) as
  select id,numero,data_oc,registrado_por,registrado_em,atualizado_em from public.ordem_compra where public.usuario_adm();
create view public.v_projetos_administrativo with (security_barrier = true) as
  select p.id,p.numero,p.ano,p.codigo_pasta,p.status,p.data_envio,p.cidade,p.uf,c.nome cliente,p.identificador_cliente,o.nome operadora,p.identificador_operadora,t.nome tipo_projeto,
    oc.numero numero_oc,oc.data_oc,p.centro_custo,af.autorizado_por,af.autorizado_em,nf.id nota_fiscal_id,nf.numero numero_nota_fiscal,nf.data_emissao,nf.valor valor_nota,
    coalesce(r.valor_recebido,0::numeric) valor_recebido, nf.valor - coalesce(r.valor_recebido,0::numeric) saldo_receber,
    (nf.data_emissao + 30) previsao_recebimento,p.fundacao_compatibilizada,p.criado_em,p.atualizado_em,p.valor,p.pasta_local
  from public.projeto p join public.cliente c on c.id=p.cliente_id join public.operadora o on o.id=p.operadora_id join public.tipo_projeto t on t.id=p.tipo_projeto_id
    left join public.ordem_compra oc on oc.id=p.ordem_compra_id left join public.autorizacao_faturamento af on af.projeto_id=p.id left join public.nota_fiscal nf on nf.projeto_id=p.id
    left join lateral (select sum(valor_recebido)::numeric as valor_recebido from public.recebimento where nota_fiscal_id=nf.id) r on true
  where public.usuario_adm();
create view public.v_dashboard_financeiro with (security_barrier = true) as
  select coalesce(sum(nf.valor),0::numeric(15,2)) valor_faturado,coalesce(sum(r.valor_recebido),0::numeric(15,2)) valor_recebido,
    coalesce(sum(nf.valor - coalesce(r.valor_recebido,0)),0::numeric(15,2)) saldo_receber,
    coalesce((select sum(p.valor) from public.projeto p where p.status <> 'CANCELADO'),0::numeric(15,2)) valor_projetos
  from public.nota_fiscal nf left join lateral (select sum(valor_recebido)::numeric as valor_recebido from public.recebimento where nota_fiscal_id=nf.id) r on true
  having public.usuario_adm();
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;
grant usage on schema public to authenticated;
grant select on public.usuario,public.cliente,public.operadora,public.tipo_projeto,public.autorizacao_faturamento,public.nota_fiscal,public.recebimento,public.v_usuarios_manutencao,public.v_projetos_operacional,public.v_eventos_operacionais,public.v_dashboard_operacional,public.v_ordens_compra_administrativo,public.v_projetos_administrativo,public.v_dashboard_financeiro to authenticated;
grant insert,update on public.cliente,public.operadora,public.tipo_projeto to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant execute on function public.usuario_ativo(),public.usuario_adm() to authenticated;
grant execute on function public.alterar_status_projeto(bigint,public.project_status,date,text),public.criar_projeto(bigint,bigint,varchar,bigint,varchar,varchar,char,numeric,uuid),public.registrar_ordem_compra(varchar,date),public.vincular_ordem_compra(bigint,bigint,varchar),public.autorizar_faturamento(bigint),public.registrar_nota_fiscal(bigint,varchar,date),public.registrar_recebimento(bigint,date,numeric),public.confirmar_recebimentos_lote(jsonb),public.definir_compatibilizacao_fundacao(bigint,boolean),public.editar_identificadores_projeto(bigint,varchar,varchar,varchar),public.dashboard_operacional(date,date) to authenticated;
