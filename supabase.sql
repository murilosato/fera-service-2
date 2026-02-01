
-- 1. LIMPEZA TOTAL PARA GARANTIR ESTRUTURA LIMPA
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
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

-- 3. TABELA DE EMPRESAS (TENANTS)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'basic',
  service_rates jsonb default '{
    "Varrição (KM)": 150.00,
    "C. Manual (m²))": 2.50,
    "Roçada Meq (m²)": 1.80,
    "Roç. c/ Trator (m²)": 0.90,
    "Boca de Lobo": 45.00,
    "Pint. Meio Fio": 1.20
  }'::jsonb,
  finance_categories text[] default array['Salários', 'Insumos', 'Manutenção', 'Impostos', 'Aluguel', 'Combustível'],
  inventory_categories text[] default array['Insumos', 'Equipamentos', 'Manutenção', 'EPIS'],
  employee_roles text[] default array['Operador de Roçadeira', 'Ajudante Geral', 'Motorista', 'Encarregado'],
  created_at timestamp with time zone default now()
);

-- 4. TABELA DE PERFIS DE USUÁRIO
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('DIRETORIA_MASTER', 'GERENTE_UNIDADE', 'OPERACIONAL')) default 'OPERACIONAL',
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

-- 5. FUNÇÃO DE GATILHO PARA NOVOS USUÁRIOS
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_company_id uuid;
begin
  insert into public.companies (name)
  values ('Fera Service - ' || new.email)
  returning id into default_company_id;

  insert into public.profiles (id, company_id, full_name, email, role)
  values (
    new.id, 
    default_company_id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'DIRETORIA_MASTER'
  );
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. ROTINA DE REPARO: CRIA PERFIL PARA USUÁRIOS QUE JÁ EXISTEM NO AUTH MAS NÃO NO BANCO
DO $$
DECLARE
    user_rec RECORD;
    new_company_id UUID;
BEGIN
    FOR user_rec IN SELECT id, email, raw_user_meta_data FROM auth.users
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
            INSERT INTO public.companies (name)
            VALUES ('Fera Service - ' || user_rec.email)
            RETURNING id INTO new_company_id;

            INSERT INTO public.profiles (id, company_id, full_name, email, role)
            VALUES (
              user_rec.id, 
              new_company_id, 
              coalesce(user_rec.raw_user_meta_data->>'full_name', split_part(user_rec.email, '@', 1)), 
              user_rec.email, 
              'DIRETORIA_MASTER'
            );
        END IF;
    END LOOP;
END $$;

-- 7. TABELAS OPERACIONAIS
create table areas (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  start_date date not null default current_date,
  end_date date,
  start_reference text,
  end_reference text,
  observations text,
  status text check (status in ('executing', 'finished')) default 'executing',
  created_at timestamp with time zone default now()
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  area_id uuid references areas(id) on delete cascade,
  type text not null,
  area_m2 numeric not null default 0,
  unit_value numeric not null default 0,
  total_value numeric not null default 0,
  service_date date not null default current_date,
  created_at timestamp with time zone default now()
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  status text check (status in ('active', 'inactive')) default 'active',
  default_value numeric default 0,
  payment_modality text default 'DIARIA',
  cpf text,
  phone text,
  pix_key text,
  address text,
  created_at timestamp with time zone default now()
);

create table inventory (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  category text,
  current_qty numeric default 0,
  min_qty numeric default 0,
  ideal_qty numeric default 0,
  unit_value numeric default 0,
  created_at timestamp with time zone default now()
);

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

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  date date not null default current_date,
  status text check (status in ('present', 'absent', 'partial')),
  value numeric default 0,
  payment_status text default 'pendente',
  created_at timestamp with time zone default now()
);

create table monthly_goals (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  month_key text not null,
  production_goal numeric default 0,
  revenue_goal numeric default 0,
  inventory_goal numeric default 0,
  balance_goal numeric default 0,
  unique(company_id, month_key)
);

-- 8. SEGURANÇA (RLS)
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

-- 9. POLÍTICAS DE ACESSO
create policy "Manage own profile" on profiles for all using (auth.uid() = id);
create policy "View own company" on companies for select using (id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Areas" on areas for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Services" on services for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Employees" on employees for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Inventory" on inventory for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Inventory Exits" on inventory_exits for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Cash Flow" on cash_flow for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Attendance" on attendance_records for all using (company_id = (select company_id from profiles where id = auth.uid()));
create policy "Company Data Isolation Goals" on monthly_goals for all using (company_id = (select company_id from profiles where id = auth.uid()));
