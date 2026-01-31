
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// ==========================================================
// CONFIGURAÇÃO DOS BASTIDORES (BACKEND)
// Substitua o placeholder abaixo pela sua URL real do Supabase
// ==========================================================
const SUPABASE_URL = 'https://zbntnglatvuijefqfjhx.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  if (!SUPABASE_URL || SUPABASE_URL.includes('SUA_URL_AQUI')) {
    console.error("ERRO: URL do Supabase não configurada em lib/supabase.ts");
    return null;
  }

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  return supabaseInstance;
};

// Proxy para facilitar o uso do cliente em todo o app
export const supabase: any = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      return (...args: any[]) => {
        if (prop === 'auth') return { 
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        };
        return { error: new Error("Supabase não configurado.") };
      };
    }
    return client[prop];
  }
});

export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !SUPABASE_URL.includes('SUA_URL_AQUI');
};

export const fetchUserProfile = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        return {
          id: user.id,
          full_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          role: 'OPERACIONAL',
          status: 'ativo',
          permissions: {
            production: true, finance: false, inventory: true,
            employees: true, analytics: false, ai: true
          }
        };
      }
    }
    return data;
  } catch (e) {
    console.error("Erro ao buscar perfil:", e);
    return null;
  }
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
};
