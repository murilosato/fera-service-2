
-- 1. LIMPEZA TOTAL DE REGRAS
alter table public.profiles disable row level security;
alter table public.companies disable row level security;

-- 2. FUNÇÃO HELPER (SECURITY DEFINER) PARA EVITAR RECURSÃO NO RLS
create or replace function public.get_user_company_id()
returns uuid
language sql
security definer
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- 3. REABILITAÇÃO DO RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;

-- 4. POLÍTICAS DE PERFIS
create policy "perfil_self_read" on public.profiles
for select using (auth.uid() = id);

create policy "perfil_empresa_read" on public.profiles
for select using (company_id = public.get_user_company_id());

create policy "perfil_write" on public.profiles
for all using (
  (select role from public.profiles where id = auth.uid()) IN ('DIRETORIA_MASTER', 'GERENTE_UNIDADE')
  OR auth.uid() = id
);

-- 5. POLÍTICAS DE EMPRESAS
create policy "empresa_read" on public.companies
for select using (id = public.get_user_company_id());

create policy "empresa_update" on public.companies
for update using (
  (select role from public.profiles where id = auth.uid()) IN ('DIRETORIA_MASTER', 'GERENTE_UNIDADE')
);

-- 6. TABELA DE FREQUÊNCIA (Referência de Estrutura)
-- Caso precise criar do zero ou ajustar:
-- create table public.attendance_records (
--   id uuid default gen_random_uuid() primary key,
--   company_id uuid references public.companies(id),
--   employee_id uuid references public.employees(id),
--   date date not null,
--   status text not null,
--   value numeric(12,2) not null,
--   payment_status text default 'pendente',
--   discount_value numeric(12,2) default 0,
--   discount_observation text,
--   created_at timestamptz default now()
-- );

-- 7. GATILHO DE NOVO USUÁRIO (Melhorado com validação estrita de ID)
create or replace function public.handle_new_user()
returns trigger 
security definer 
set search_path = public, auth
as $$
declare
  target_company_id uuid;
  target_role text;
begin
  -- Validação de segurança: se o ID for nulo, algo está muito errado com o Auth
  if new.id is null then
    return new;
  end if;

  -- Define o cargo (padrão Master para o primeiro usuário ou conforme metadados)
  target_role := coalesce(new.raw_user_meta_data->>'role', 'DIRETORIA_MASTER');

  -- Busca ou cria empresa
  if (new.raw_user_meta_data->>'company_id') is not null then
    target_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  else
    -- Tenta pegar a primeira empresa criada no sistema para o primeiro acesso
    select id into target_company_id from public.companies order by created_at asc limit 1;
    
    if target_company_id is null then
      insert into public.companies (name)
      values ('Fera Service - Unidade Principal')
      returning id into target_company_id;
    end if;
  end if;

  -- Inserção do Perfil
  insert into public.profiles (
    id, 
    company_id, 
    full_name, 
    email, 
    role, 
    status,
    permissions
  )
  values (
    new.id, 
    target_company_id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    target_role,
    'ativo',
    '{"production": true, "finance": true, "inventory": true, "employees": true, "analytics": true, "ai": true}'::jsonb
  )
  on conflict (id) do update set
    email = EXCLUDED.email,
    full_name = coalesce(EXCLUDED.full_name, profiles.full_name);

  return new;
exception when others then
  raise warning 'Erro no trigger handle_new_user para o ID %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql;

-- RE-VINCULA O GATILHO
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
