
-- 1. LIMPEZA TOTAL (RESET)
-- Remove todas as tabelas e políticas existentes para evitar conflitos de "relação não existe"
drop table if exists monthly_goals cascade;
drop table if exists attendance_records cascade;
drop table if exists cash_flow cascade;
drop table if exists inventory_exits cascade;
drop table if exists inventory cascade;
drop table if exists employees cascade;
drop table if exists services cascade;
drop table if exists areas cascade;
drop table if exists profiles cascade;
drop table if exists companies cascade;

-- 2. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 3. CRIAÇÃO DAS TABELAS

-- Empresas (SaaS)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'basic',
  created_at timestamp with time zone default now()
);

-- Perfis de Usuários (Vinculados ao Auth do Supabase)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  role text check (role in ('DIRETORIA_MASTER', 'GERENTE_UNIDADE', 'OPERACIONAL')),
  status text default 'ativo',
  permissions jsonb default '{
    "production": true,
    "finance": true,
    "inventory": true,
    "employees": true,
    "analytics": true,
    "ai": true
  }'::jsonb,
  created_at timestamp with time zone default now()
);

-- Áreas / Ordens de Serviço
create table areas (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  start_date date not null default current_date,
  end_date date,
  start_reference text,
  end_reference text,
  observations text,
  created_at timestamp with time zone default now()
);

-- Serviços Realizados (Metragem/Produção)
create table services (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  area_id uuid references areas(id) on delete cascade,
  type text not null,
  area_m2 numeric not null,
  unit_value numeric not null,
  total_value numeric not null,
  service_date date not null default current_date,
  created_at timestamp with time zone default now()
);

-- Funcionários / Colaboradores
create table employees (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  status text default 'active',
  default_value numeric default 0,
  payment_modality text default 'DIARIA',
  cpf text,
  phone text,
  pix_key text,
  address text,
  created_at timestamp with time zone default now()
);

-- Estoque (Produtos)
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text,
  current_qty numeric default 0,
  min_qty numeric default 0,
  unit_value numeric default 0,
  created_at timestamp with time zone default now()
);

-- Movimentações de Estoque (Saídas/Entradas)
create table inventory_exits (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  item_id uuid references inventory(id) on delete cascade,
  quantity numeric not null,
  date date not null default current_date,
  destination text,
  observation text,
  created_at timestamp with time zone default now()
);

-- Fluxo de Caixa (Financeiro)
create table cash_flow (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  type text check (type in ('in', 'out')),
  value numeric not null,
  date date not null default current_date,
  reference text,
  category text,
  created_at timestamp with time zone default now()
);

-- Registro de Presença (Frequência)
create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  date date not null default current_date,
  status text check (status in ('present', 'absent')),
  value numeric default 0,
  payment_status text default 'pendente',
  created_at timestamp with time zone default now()
);

-- Metas Mensais
create table monthly_goals (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  month_key text not null,
  production_goal numeric default 0,
  revenue_goal numeric default 0,
  unique(company_id, month_key)
);

-- 4. SEGURANÇA (RLS - Row Level Security)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table areas enable row level security;
alter table services enable row level security;
alter table employees enable row level security;
alter table inventory enable row level security;
alter table inventory_exits enable row level security;
alter table cash_flow enable row level security;
alter table attendance_records enable row level security;
alter table monthly_goals enable row level security;

-- 5. POLÍTICAS DE ACESSO (Isolamento por Empresa)

-- Perfil: O usuário só vê o seu próprio perfil
create policy "Users can see their own profile" on profiles
  for all using (auth.uid() = id);

-- Políticas Genéricas: O usuário acessa dados se o company_id for o mesmo do seu perfil
create policy "Company Access Areas" on areas for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Services" on services for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Employees" on employees for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Inventory" on inventory for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Inventory Exits" on inventory_exits for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Cash Flow" on cash_flow for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Attendance" on attendance_records for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Company Access Goals" on monthly_goals for all 
  using (company_id = (select company_id from profiles where id = auth.uid()));
