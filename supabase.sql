
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

-- 2. GARANTIR QUE AS POLÍTICAS DE RLS PERMITAM A ATUALIZAÇÃO DESSES CAMPOS
DROP POLICY IF EXISTS "empresa_update" ON public.companies;
CREATE POLICY "empresa_update" ON public.companies
FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('DIRETORIA_MASTER', 'GERENTE_UNIDADE')
);

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.companies.service_rates IS 'Tabela de preços unitários por tipo de serviço.';
COMMENT ON COLUMN public.companies.service_goals IS 'Metas técnicas mensais de produção por tipo de serviço.';
