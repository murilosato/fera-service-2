
import { createClient } from '@supabase/supabase-js';
import { ServiceType } from '../types';

const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true,
    detectSessionInUrl: true 
  }
});

const camelToSnake = (obj: any) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const n: any = {};
  Object.keys(obj).forEach(k => {
    let newKey = k;
    if (k === 'companyId') newKey = 'company_id';
    else if (k === 'itemId') newKey = 'item_id';
    else if (k === 'areaId') newKey = 'area_id';
    else if (k === 'employeeId') newKey = 'employee_id';
    else if (k === 'monthKey') newKey = 'month_key';
    else if (k === 'startDate') newKey = 'start_date';
    else if (k === 'endDate') newKey = 'end_date';
    else if (k === 'startReference') newKey = 'start_reference';
    else if (k === 'endReference') newKey = 'end_reference';
    else if (k === 'unitValue') newKey = 'unit_value';
    else if (k === 'totalValue') newKey = 'total_value';
    else if (k === 'areaM2') newKey = 'area_m2';
    else if (k === 'currentQty') newKey = 'current_qty';
    else if (k === 'minQty') newKey = 'min_qty';
    else if (k === 'idealQty') newKey = 'ideal_qty';
    else if (k === 'paymentStatus') newKey = 'payment_status';
    else if (k === 'financeCategories') newKey = 'finance_categories';
    else if (k === 'inventoryCategories') newKey = 'inventory_categories';
    else if (k === 'employeeRoles') newKey = 'employee_roles';
    else if (k === 'serviceRates') newKey = 'service_rates';
    else if (k === 'serviceDate') newKey = 'service_date';
    else if (k === 'productionGoal') newKey = 'production_goal';
    else if (k === 'revenueGoal') newKey = 'revenue_goal';
    else if (k === 'inventoryGoal') newKey = 'inventory_goal';
    else if (k === 'balanceGoal') newKey = 'balance_goal';
    else if (k === 'discountValue') newKey = 'discount_value';
    else if (k === 'discountObservation') newKey = 'discount_observation';
    else {
      newKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    
    let val = obj[k];
    if (val === '' && (newKey.includes('date') || newKey.includes('_at') || newKey === 'end_date')) {
      val = null;
    }
    
    n[newKey] = val;
  });
  return n;
};

export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Erro fetchUserProfile:", error);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

export const fetchCompleteCompanyData = async (companyId: string | null, isMaster: boolean = false) => {
  if (!companyId && !isMaster) return null;

  const safeQuery = async (table: string, query: any) => {
    try {
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  };

  const baseFilter = (q: any) => (!isMaster && companyId) ? q.eq('company_id', companyId) : q;

  const [areas, emps, inv, exits, flow, att, goals, companyInfo] = await Promise.all([
    safeQuery('areas', baseFilter(supabase.from('areas').select('*, services(*)').order('created_at', { ascending: false }))),
    safeQuery('employees', baseFilter(supabase.from('employees').select('*').order('name'))),
    safeQuery('inventory', baseFilter(supabase.from('inventory').select('*').order('name'))),
    safeQuery('inventory_exits', baseFilter(supabase.from('inventory_exits').select('*').order('date', { ascending: false }))),
    safeQuery('cash_flow', baseFilter(supabase.from('cash_flow').select('*').order('date', { ascending: false }))),
    safeQuery('attendance_records', baseFilter(supabase.from('attendance_records').select('*'))),
    safeQuery('monthly_goals', baseFilter(supabase.from('monthly_goals').select('*'))),
    companyId ? supabase.from('companies').select('*').eq('id', companyId).maybeSingle() : Promise.resolve({ data: null })
  ]);

  const goalsMap: Record<string, any> = {};
  (goals || []).forEach((g: any) => {
    goalsMap[g.month_key] = { 
      production: Number(g.production_goal || 0), 
      revenue: Number(g.revenue_goal || 0),
      inventory: Number(g.inventory_goal || 0),
      finance: Number(g.balance_goal || 0)
    };
  });

  const defaultRates = {
    [ServiceType.VARRICAO_KM]: 150.00,
    [ServiceType.CAPINA_MANUAL_M2]: 2.50,
    [ServiceType.ROCADA_MECANIZADA_M2]: 1.80,
    [ServiceType.ROCADA_TRATOR_M2]: 0.90,
    [ServiceType.BOCA_DE_LOBO]: 45.00,
    [ServiceType.PINTURA_MEIO_FIO]: 1.20,
  };

  return {
    areas: areas.map((a: any) => ({
      id: a.id, 
      companyId: a.company_id, 
      name: a.name, 
      startDate: a.start_date, 
      endDate: a.end_date,
      startReference: a.start_reference, 
      endReference: a.end_reference, 
      observations: a.observations,
      status: a.status || 'executing',
      services: (a.services || []).map((s: any) => ({
        id: s.id, 
        companyId: s.company_id, 
        areaId: s.area_id, 
        type: s.type,
        areaM2: Number(s.area_m2), 
        unitValue: Number(s.unit_value), 
        totalValue: Number(s.total_value), 
        serviceDate: s.service_date
      }))
    })),
    employees: emps.map((e: any) => ({
      id: e.id, companyId: e.company_id, name: e.name, role: e.role, status: e.status || 'active',
      defaultValue: Number(e.default_value), paymentModality: e.payment_modality,
      cpf: e.cpf, phone: e.phone, pixKey: e.pix_key, address: e.address
    })),
    inventory: inv.map((i: any) => ({
      id: i.id, companyId: i.company_id, name: i.name, category: i.category,
      currentQty: Number(i.current_qty), minQty: Number(i.min_qty), idealQty: Number(i.ideal_qty || 0), unitValue: Number(i.unit_value || 0)
    })),
    inventoryExits: exits.map((ex: any) => ({
      id: ex.id, companyId: ex.company_id, itemId: ex.item_id, quantity: Number(ex.quantity), date: ex.date, destination: ex.destination, observation: ex.observation
    })),
    cashIn: flow.filter((f: any) => f.type === 'in').map((f: any) => ({ id: f.id, companyId: f.company_id, date: f.date, value: Number(f.value), reference: f.reference, type: f.type, category: f.category })),
    cashOut: flow.filter((f: any) => f.type === 'out').map((f: any) => ({ id: f.id, companyId: f.company_id, date: f.date, value: Number(f.value), type: f.type, category: f.category, reference: f.reference })),
    attendanceRecords: att.map((r: any) => ({
      id: r.id, companyId: r.company_id, employeeId: r.employee_id, date: r.date, status: r.status, value: Number(r.value), paymentStatus: r.payment_status,
      discountValue: Number(r.discount_value || 0), discountObservation: r.discount_observation
    })),
    monthlyGoals: goalsMap,
    serviceRates: companyInfo.data?.service_rates || defaultRates,
    financeCategories: companyInfo.data?.finance_categories || ['Salários', 'Insumos', 'Manutenção', 'Impostos', 'Aluguel', 'Combustível'],
    inventoryCategories: companyInfo.data?.inventory_categories || ['Insumos', 'Equipamentos', 'Manutenção', 'EPIS'],
    employeeRoles: companyInfo.data?.employee_roles || ['Operador de Roçadeira', 'Ajudante Geral', 'Motorista', 'Encarregado']
  };
};

export const dbSave = async (table: string, data: any) => {
  const payload = camelToSnake(data);
  let query;
  
  if (payload.id) {
    const { id, ...updateData } = payload;
    query = supabase.from(table).update(updateData).eq('id', id);
  } else {
    if (table === 'monthly_goals') {
       query = supabase.from(table).upsert(payload, { onConflict: 'company_id, month_key' });
    } else {
       query = supabase.from(table).insert(payload);
    }
  }
  
  const { data: saved, error } = await query.select();
  if (error) {
    throw error;
  }
  return saved;
};

export const dbDelete = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("SignOut error:", e);
  } finally {
    // Limpeza bruta de segurança para evitar sessões órfãs
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
};
