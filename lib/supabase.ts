
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) console.error("Erro perfil:", error);
  return data;
};

// Função para buscar todo o estado da empresa de uma vez
export const fetchCompleteCompanyData = async (companyId: string) => {
  try {
    const [areas, employees, inventory, cashFlow] = await Promise.all([
      supabase.from('areas').select('*, services(*)').eq('company_id', companyId),
      supabase.from('employees').select('*').eq('company_id', companyId),
      supabase.from('inventory').select('*').eq('company_id', companyId),
      supabase.from('cash_flow').select('*').eq('company_id', companyId)
    ]);

    return {
      areas: areas.data || [],
      employees: employees.data || [],
      inventory: inventory.data || [],
      cashIn: cashFlow.data?.filter(c => c.type === 'in') || [],
      cashOut: cashFlow.data?.filter(c => c.type === 'out') || []
    };
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return null;
  }
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
