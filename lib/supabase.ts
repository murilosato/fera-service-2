
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

const isValidUUID = (uuid: any) => typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

const camelToSnake = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const n: any = {};
  Object.keys(obj).forEach(k => {
    // Caso especial para companyId -> company_id
    if (k === 'companyId') {
      n['company_id'] = obj[k];
    } else if (k === 'itemId') {
      n['item_id'] = obj[k];
    } else {
      const newKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      n[newKey] = obj[k];
    }
  });
  return n;
};

export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*, companies(*)').eq('id', userId).maybeSingle();
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
};

export const fetchCompleteCompanyData = async (companyId: string) => {
  if (!isValidUUID(companyId)) return null;

  const safeQuery = async (table: string, query: any) => {
    try {
      const { data, error } = await query;
      if (error) {
        console.warn(`Erro na tabela ${table}:`, error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  };

  const [areas, emps, inv, exits, flow, att, goals] = await Promise.all([
    safeQuery('areas', supabase.from('areas').select('*, services(*)').eq('company_id', companyId).order('created_at', { ascending: false })),
    safeQuery('employees', supabase.from('employees').select('*').eq('company_id', companyId).order('name')),
    safeQuery('inventory', supabase.from('inventory').select('*').eq('company_id', companyId).order('name')),
    safeQuery('inventory_exits', supabase.from('inventory_exits').select('*').eq('company_id', companyId).order('date', { ascending: false })),
    safeQuery('cash_flow', supabase.from('cash_flow').select('*').eq('company_id', companyId).order('date', { ascending: false })),
    safeQuery('attendance_records', supabase.from('attendance_records').select('*').eq('company_id', companyId)),
    safeQuery('monthly_goals', supabase.from('monthly_goals').select('*').eq('company_id', companyId))
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

  return {
    areas: areas.map((a: any) => ({
      id: a.id, companyId: a.company_id, name: a.name, startDate: a.start_date, endDate: a.end_date,
      startReference: a.start_reference, endReference: a.end_reference, observations: a.observations,
      services: (a.services || []).map((s: any) => ({
        id: s.id, companyId: s.company_id, areaId: s.area_id, type: s.type,
        // Fix: Alterado serviceDate para service_date conforme interface Service
        areaM2: Number(s.area_m2), unitValue: Number(s.unit_value), totalValue: Number(s.total_value), service_date: s.service_date
      }))
    })),
    employees: emps.map((e: any) => ({
      id: e.id, companyId: e.company_id, name: e.name, role: e.role, status: e.status,
      defaultValue: Number(e.default_value), paymentModality: e.payment_modality,
      cpf: e.cpf, phone: e.phone, pixKey: e.pix_key, address: e.address
    })),
    inventory: inv.map((i: any) => ({
      id: i.id, companyId: i.company_id, name: i.name, category: i.category,
      currentQty: Number(i.current_qty), minQty: Number(i.min_qty), unitValue: Number(i.unit_value || 0)
    })),
    inventoryExits: exits.map((ex: any) => ({
      id: ex.id, companyId: ex.company_id, itemId: ex.item_id, quantity: Number(ex.quantity), date: ex.date, destination: ex.destination, observation: ex.observation
    })),
    cashIn: flow.filter((f: any) => f.type === 'in').map((f: any) => ({ id: f.id, companyId: f.company_id, date: f.date, value: Number(f.value), reference: f.reference, type: f.type, category: f.category })),
    cashOut: flow.filter((f: any) => f.type === 'out').map((f: any) => ({ id: f.id, companyId: f.company_id, date: f.date, value: Number(f.value), type: f.type, category: f.category, reference: f.reference })),
    attendanceRecords: att.map((r: any) => ({
      id: r.id, companyId: r.company_id, employeeId: r.employee_id, date: r.date, status: r.status, value: Number(r.value), paymentStatus: r.payment_status
    })),
    monthlyGoals: goalsMap
  };
};

export const dbSave = async (table: string, data: any) => {
  const payload = camelToSnake(data);
  console.log(`Payload Enviado para ${table}:`, payload);
  const { data: saved, error } = await supabase.from(table).upsert(payload).select();
  if (error) {
    console.error(`Erro ao salvar na tabela ${table}:`, error.message, error);
    throw error;
  }
  return saved;
};

export const dbDelete = async (table: string, id: string) => {
  if (!isValidUUID(id)) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
