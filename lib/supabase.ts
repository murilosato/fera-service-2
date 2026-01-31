
import { createClient } from '@supabase/supabase-js';

// Hardcoded provided credentials to bypass setup screen as requested
const DEFAULT_URL = 'https://zbntnglatvuijefqfjhx.supabase.co';
const DEFAULT_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

const SUPABASE_URL = localStorage.getItem('FERA_SUPABASE_URL') || DEFAULT_URL;
const SUPABASE_ANON_KEY = localStorage.getItem('FERA_SUPABASE_ANON_KEY') || DEFAULT_KEY;

export const isSupabaseConfigured = true; // Always true now as we have defaults

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

const isValidUUID = (uuid: any) => {
  if (typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

const withTimeout = <T>(promise: PromiseLike<T>, ms: number, timeoutError: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutError)), ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const fetchUserProfile = async (userId: string) => {
  try {
    const query = supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();

    const { data, error } = await withTimeout(query, 5000, "Timeout perfil");
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Erro fetchUserProfile:", e);
    return null;
  }
};

export const fetchCompleteCompanyData = async (companyId: string) => {
  if (!isValidUUID(companyId)) return null;

  try {
    const fetchTable = async (table: string) => {
      const query = supabase.from(table).select('*').eq('company_id', companyId);
      const { data, error } = await withTimeout(query, 5000, `Timeout ${table}`);
      return error ? [] : (data || []);
    };

    const areasQuery = supabase.from('areas').select('*, services(*)').eq('company_id', companyId).order('created_at', { ascending: false });
    
    const [areasRaw, emps, inv, exits, flow, att, goals] = await Promise.all([
      withTimeout(areasQuery, 5000, "Timeout áreas"),
      fetchTable('employees'),
      fetchTable('inventory'),
      fetchTable('inventory_exits'),
      fetchTable('cash_flow'),
      fetchTable('attendance_records'),
      fetchTable('monthly_goals')
    ]);

    const areasData = (areasRaw as any).data || [];
    const goalsMap: Record<string, any> = {};
    (goals as any[]).forEach(g => {
      goalsMap[g.month_key] = { production: Number(g.production_goal), revenue: Number(g.revenue_goal) };
    });

    return {
      areas: areasData.map((a: any) => ({
        id: a.id,
        companyId: a.company_id,
        name: a.name,
        startDate: a.start_date,
        endDate: a.end_date,
        startReference: a.start_reference,
        endReference: a.end_reference,
        observations: a.observations,
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
      employees: (emps as any[]).map(e => ({
        id: e.id,
        companyId: e.company_id,
        name: e.name,
        role: e.role,
        status: e.status as 'active' | 'inactive',
        defaultValue: Number(e.default_value),
        paymentModality: e.payment_modality,
        cpf: e.cpf,
        phone: e.phone,
        pixKey: e.pix_key,
        address: e.address
      })),
      inventory: (inv as any[]).map(i => ({
        id: i.id,
        companyId: i.company_id,
        name: i.name,
        category: i.category,
        currentQty: Number(i.current_qty),
        minQty: Number(i.min_qty),
        unitValue: i.unit_value ? Number(i.unit_value) : undefined
      })),
      inventoryExits: (exits as any[]).map(ex => ({
        id: ex.id,
        companyId: ex.company_id,
        itemId: ex.item_id,
        quantity: Number(ex.quantity),
        date: ex.date,
        destination: ex.destination,
        observation: ex.observation
      })),
      cashIn: (flow as any[]).filter(f => f.type === 'in').map(f => ({
        id: f.id,
        companyId: f.company_id,
        date: f.date,
        value: Number(f.value),
        reference: f.reference,
        type: f.type
      })),
      cashOut: (flow as any[]).filter(f => f.type === 'out').map(f => ({
        id: f.id,
        companyId: f.company_id,
        date: f.date,
        value: Number(f.value),
        type: f.type
      })),
      attendanceRecords: (att as any[]).map(r => ({
        id: r.id,
        companyId: r.company_id,
        employeeId: r.employee_id,
        date: r.date,
        status: r.status as 'present' | 'absent',
        value: Number(r.value),
        paymentStatus: r.payment_status
      })),
      monthlyGoals: goalsMap
    };
  } catch (err) {
    console.error("Erro fetchCompleteCompanyData:", err);
    return null;
  }
};

export const dbSave = async (table: string, data: any) => {
  const payload = { ...data };
  if (payload.companyId) { payload.company_id = payload.companyId; delete payload.companyId; }
  if (payload.startDate) { payload.start_date = payload.startDate; delete payload.startDate; }
  if (payload.endDate) { payload.end_date = payload.endDate; delete payload.endDate; }
  if (payload.startReference) { payload.start_reference = payload.startReference; delete payload.startReference; }
  if (payload.endReference) { payload.end_reference = payload.endReference; delete payload.endReference; }
  if (payload.areaId) { payload.area_id = payload.areaId; delete payload.areaId; }
  if (payload.areaM2) { payload.area_m2 = payload.areaM2; delete payload.areaM2; }
  if (payload.unitValue) { payload.unit_value = payload.unitValue; delete payload.unitValue; }
  if (payload.totalValue) { payload.total_value = payload.totalValue; delete payload.totalValue; }
  if (payload.serviceDate) { payload.service_date = payload.serviceDate; delete payload.serviceDate; }
  if (payload.itemId) { payload.item_id = payload.itemId; delete payload.itemId; }
  if (payload.employeeId) { payload.employee_id = payload.employeeId; delete payload.employeeId; }
  if (payload.paymentStatus) { payload.payment_status = payload.paymentStatus; delete payload.paymentStatus; }

  const { data: saved, error } = await supabase.from(table).upsert(payload).select();
  if (error) throw error;
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
