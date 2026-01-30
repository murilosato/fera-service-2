
-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. TABELA DE EMPRESAS (TENANTS)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'basic',
  created_at timestamp with time zone default now()
);

-- 3. PERFIS DE USUÁRIO (VINCULADOS AO AUTH.USERS)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  role text check (role in ('DIRETORIA_MASTER', 'GERENTE_UNIDADE', 'OPERACIONAL')),
  status text default 'ativo',
  permissions jsonb default '{
    "production": true,
    "finance": false,
    "inventory": true,
    "employees": true,
    "analytics": false,
    "ai": true
  }'::jsonb,
  created_at timestamp with time zone default now()
);

-- 4. TABELAS OPERACIONAIS COM ISOLAMENTO POR COMPANY_ID
create table areas (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  start_reference text,
  end_reference text,
  observations text,
  created_at timestamp with time zone default now()
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  area_id uuid references areas(id) on delete cascade,
  type text not null,
  area_m2 numeric not null,
  unit_value numeric not null,
  total_value numeric not null,
  service_date date not null,
  created_at timestamp with time zone default now()
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  status text default 'active',
  default_daily_rate numeric,
  cpf text,
  phone text,
  pix_key text,
  created_at timestamp with time zone default now()
);

create table monthly_goals (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  month_key text not null, -- format: YYYY-MM
  production_goal numeric default 0,
  revenue_goal numeric default 0,
  unique(company_id, month_key)
);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS) EM TUDO
alter table companies enable row level security;
alter table profiles enable row level security;
alter table areas enable row level security;
alter table services enable row level security;
alter table employees enable row level security;
alter table monthly_goals enable row level security;

-- 6. POLÍTICAS DE ACESSO (O SEGREDO DO MULTI-TENANT)
-- O usuário só vê dados onde o company_id é igual ao do seu profile

create policy "Users can view their own company"
  on companies for select
  using ( id = (select company_id from profiles where id = auth.uid()) );

create policy "Users can view profiles in their company"
  on profiles for select
  using ( company_id = (select company_id from profiles where id = auth.uid()) );

create policy "Users can access their company areas"
  on areas for all
  using ( company_id = (select company_id from profiles where id = auth.uid()) );

create policy "Users can access their company services"
  on services for all
  using ( company_id = (select company_id from profiles where id = auth.uid()) );

create policy "Users can access their company employees"
  on employees for all
  using ( company_id = (select company_id from profiles where id = auth.uid()) );

create policy "Users can access their company goals"
  on monthly_goals for all
  using ( company_id = (select company_id from profiles where id = auth.uid()) );

-- 7. TRIGGER PARA NOVOS USUÁRIOS (OPCIONAL - SIMPLIFICADO)
-- Nota: Na produção, você criaria a empresa e o perfil via API.
