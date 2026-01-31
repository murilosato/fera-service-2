
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isValidUUID = (uuid: any) => {
  if (typeof uuid !== 'string') return false;
  return uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
};

export const fetchUserProfile = async (userId: string) => {
  try {
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();
    
    if (profile && isValidUUID(profile.company_id)) {
      return profile;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: company } = await supabase
      .from('companies')
      .insert([{ name: 'Fera Service Unidade' }])
      .select()
      .single();

    if (company) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          company_id: company.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'DIRETORIA_MASTER',
          status: 'ativo'
        })
        .select('*, companies(*)')
        .single();
      
      return newProfile;
    }
    return null;
  } catch (err) {
    console.error("Erro no Perfil:", err);
    return null;
  }
};

export const fetchCompleteCompanyData = async (companyId: string | null) => {
  if (!companyId || !isValidUUID(companyId)) return null;
  
  try {
    const [areasRes, employeesRes, inventoryRes, inventoryExitsRes, cashFlowRes, attendanceRes, goalsRes] = await Promise.all([
      supabase.from('areas').select('*, services(*)').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('company_id', companyId),
      supabase.from('inventory').select('*').eq('company_id', companyId),
      supabase.from('inventory_exits').select('*').eq('company_id', companyId),
      supabase.from('cash_flow').select('*').eq('company_id', companyId),
      supabase.from('attendance_records').select('*').eq('company_id', companyId),
      supabase.from('monthly_goals').select('*').eq('company_id', companyId)
    ]);

    // Mapeamento de Metas
    const goalsMap: Record<string, any> = {};
    goalsRes.data?.forEach(g => {
      goalsMap[g.month_key] = { production: Number(g.production_goal), revenue: Number(g.revenue_goal) };
    });

    // Mapeamento de Áreas e Serviços
    const areas = (areasRes.data || []).map(area => ({
      id: area.id,
      companyId: area.company_id,
      name: area.name,
      startDate: area.start_date,
      startReference: area.start_reference,
      observations: area.observations,
      services: (area.services || []).map((s: any) => ({
        id: s.id,
        areaId: s.area_id,
        type: s.type,
        areaM2: Number(s.area_m2),
        unitValue: Number(s.unit_value),
        totalValue: Number(s.total_value),
        serviceDate: s.service_date
      }))
    }));

    return {
      areas,
      employees: employeesRes.data || [],
      inventory: (inventoryRes.data || []).map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        currentQty: Number(i.current_qty),
        minQty: Number(i.min_qty),
        unitValue: Number(i.unit_value)
      })),
      inventoryExits: (inventoryExitsRes.data || []).map(e => ({
        id: e.id,
        itemId: e.item_id,
        quantity: Number(e.quantity),
        date: e.date,
        destination: e.destination,
        observation: e.observation
      })),
      cashIn: (cashFlowRes.data || []).filter(c => c.type === 'in'),
      cashOut: (cashFlowRes.data || []).filter(c => c.type === 'out'),
      attendanceRecords: (attendanceRes.data || []).map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        date: r.date,
        status: r.status,
        value: Number(r.value),
        paymentStatus: r.payment_status
      })),
      monthlyGoals: goalsMap
    };
  } catch (error) {
    console.error("Erro ao carregar dados operacionais:", error);
    return null;
  }
};

export const dbSave = async (table: string, data: any) => {
  if (data.id && !isValidUUID(data.id)) {
    delete data.id;
  }

  if (table === 'services' && data.areaM2 !== undefined) {
    data.area_m2 = data.areaM2;
    delete data.areaM2;
  }
  
  // Mapeamento para inventory_exits
  if (table === 'inventory_exits' && data.itemId !== undefined) {
    data.item_id = data.itemId;
    delete data.itemId;
  }

  if (!data.company_id || !isValidUUID(data.company_id)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");
    const profile = await fetchUserProfile(user.id);
    if (profile) data.company_id = profile.company_id;
    else throw new Error("Falha ao vincular empresa.");
  }

  const { data: saved, error } = await supabase.from(table).upsert(data).select();
  if (error) throw error;
  return saved;
};

export const dbDelete = async (table: string, id: string) => {
  if (!id || !isValidUUID(id)) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
