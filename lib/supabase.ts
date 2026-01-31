
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();
    
    if (profile) return profile;

    // Se não houver perfil, tenta retornar dados básicos do Auth para evitar travamento
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        role: 'DIRETORIA_MASTER',
        company_id: null,
        status: 'ativo',
        permissions: { production: true, finance: true, inventory: true, employees: true, analytics: true, ai: true }
      };
    }
    return null;
  } catch (err) {
    console.error("Erro crítico ao buscar perfil:", err);
    return null;
  }
};

export const fetchCompleteCompanyData = async (companyId: string | null) => {
  if (!companyId || companyId === 'setup-pending') return null;
  
  try {
    const [areas, employees, inventory, cashFlow, attendance] = await Promise.all([
      supabase.from('areas').select('*, services(*)').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('company_id', companyId),
      supabase.from('inventory').select('*').eq('company_id', companyId),
      supabase.from('cash_flow').select('*').eq('company_id', companyId),
      supabase.from('attendance_records').select('*').eq('company_id', companyId)
    ]);

    return {
      areas: areas.data || [],
      employees: employees.data || [],
      inventory: inventory.data || [],
      cashIn: cashFlow.data?.filter(c => c.type === 'in') || [],
      cashOut: cashFlow.data?.filter(c => c.type === 'out') || [],
      attendanceRecords: attendance.data || []
    };
  } catch (error) {
    console.error("Erro ao sincronizar dados da empresa:", error);
    return null;
  }
};

/**
 * dbSave: Garante que os dados sejam salvos no banco de dados.
 * Se o ID estiver presente, ele atualiza. Se não, ele insere.
 */
export const dbSave = async (table: string, data: any) => {
  console.log(`Tentando salvar em ${table}:`, data);
  const { data: saved, error } = await supabase
    .from(table)
    .upsert(data, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error(`Erro de banco de dados em ${table}:`, error.message, error.details);
    throw error;
  }
  return saved;
};

export const dbDelete = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
