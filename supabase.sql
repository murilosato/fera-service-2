
-- 1. ADIÇÃO DE COLUNAS DE IDENTIFICAÇÃO E CONFIGURAÇÃO NA TABELA COMPANIES
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS service_rates jsonb DEFAULT '{
    "Varrição (KM)": 150.00,
    "C. Manual (m²)": 2.50,
    "Roçada Meq (m²)": 1.80,
    "Roç. c/ Trator (m²)": 0.90,
    "Boca de Lobo": 45.00,
    "Pint. Meio Fio": 1.20
}'::jsonb,
ADD COLUMN IF NOT EXISTS service_goals jsonb DEFAULT '{
    "Varrição (KM)": 500,
    "C. Manual (m²)": 10000,
    "Roçada Meq (m²)": 20000,
    "Roç. c/ Trator (m²)": 30000,
    "Boca de Lobo": 100,
    "Pint. Meio Fio": 5000
}'::jsonb,
ADD COLUMN IF NOT EXISTS finance_categories text[] DEFAULT ARRAY['Salários', 'Insumos', 'Manutenção', 'Impostos', 'Aluguel', 'Combustível'],
ADD COLUMN IF NOT EXISTS inventory_categories text[] DEFAULT ARRAY['Insumos', 'Equipamentos', 'Manutenção', 'EPIS'],
ADD COLUMN IF NOT EXISTS employee_roles text[] DEFAULT ARRAY['Operador de Roçadeira', 'Ajudante Geral', 'Motorista', 'Encarregado'];

-- 4. TABELA DE TRANSAÇÕES FINANCEIRAS DE COLABORADORES
CREATE TABLE IF NOT EXISTS public.employee_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id),
    employee_id uuid REFERENCES public.employees(id),
    date date NOT NULL,
    description text NOT NULL,
    type text CHECK (type IN ('in', 'out')),
    value numeric(12,2) NOT NULL,
    sent_to_finance boolean DEFAULT false,
    finance_id uuid REFERENCES public.cash_flow(id),
    created_at timestamptz DEFAULT now()
);

-- 5. GARANTIR COLUNAS NA TABELA EMPLOYEES
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS pix_key text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS admission_date date,
ADD COLUMN IF NOT EXISTS workload text,
ADD COLUMN IF NOT EXISTS start_time text,
ADD COLUMN IF NOT EXISTS break_start text,
ADD COLUMN IF NOT EXISTS break_end text,
ADD COLUMN IF NOT EXISTS end_time text,
ADD COLUMN IF NOT EXISTS payment_modality text DEFAULT 'DIARIA',
ADD COLUMN IF NOT EXISTS default_value numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. GARANTIR QUE AS POLÍTICAS DE RLS PERMITAM A ATUALIZAÇÃO DESSES CAMPOS
DROP POLICY IF EXISTS "empresa_update" ON public.companies;
CREATE POLICY "empresa_update" ON public.companies
FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('DIRETORIA_MASTER', 'GERENTE_UNIDADE')
);

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.companies.service_rates IS 'Tabela de preços unitários por tipo de serviço.';
COMMENT ON COLUMN public.companies.service_goals IS 'Metas técnicas mensais de produção por tipo de serviço.';

-- 6. POLÍTICAS DE RLS PARA EMPLOYEES E TRANSAÇÕES
DROP POLICY IF EXISTS "employees_select" ON public.employees;
CREATE POLICY "employees_select" ON public.employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "employees_insert" ON public.employees;
CREATE POLICY "employees_insert" ON public.employees FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "employees_update" ON public.employees;
CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING (true);

DROP POLICY IF EXISTS "employee_transactions_select" ON public.employee_transactions;
CREATE POLICY "employee_transactions_select" ON public.employee_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "employee_transactions_insert" ON public.employee_transactions;
CREATE POLICY "employee_transactions_insert" ON public.employee_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "employee_transactions_update" ON public.employee_transactions;
CREATE POLICY "employee_transactions_update" ON public.employee_transactions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "employee_transactions_delete" ON public.employee_transactions;
CREATE POLICY "employee_transactions_delete" ON public.employee_transactions FOR DELETE USING (true);

-- 7. DRE STATEMENTS
CREATE TABLE IF NOT EXISTS public.dre_statements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    month text NOT NULL, -- YYYY-MM
    entries jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, month)
);

DROP POLICY IF EXISTS "dre_statements_select" ON public.dre_statements;
CREATE POLICY "dre_statements_select" ON public.dre_statements FOR SELECT USING (true);

DROP POLICY IF EXISTS "dre_statements_insert" ON public.dre_statements;
CREATE POLICY "dre_statements_insert" ON public.dre_statements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "dre_statements_update" ON public.dre_statements;
CREATE POLICY "dre_statements_update" ON public.dre_statements FOR UPDATE USING (true);

DROP POLICY IF EXISTS "dre_statements_delete" ON public.dre_statements;
CREATE POLICY "dre_statements_delete" ON public.dre_statements FOR DELETE USING (true);
