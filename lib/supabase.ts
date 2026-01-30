
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';

const getKeys = () => {
  const url = localStorage.getItem('FERA_SUPABASE_URL') || '';
  return { url, key: SUPABASE_ANON_KEY };
};

export const isSupabaseConfigured = () => {
  const { url } = getKeys();
  return !!url;
};

let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  const { url } = getKeys();
  if (!url) return null;

  supabaseInstance = createClient(url, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  return supabaseInstance;
};

export const supabase: any = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      return (...args: any[]) => {
        if (prop === 'auth') return { 
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        };
        return { error: new Error("URL do Supabase não configurada.") };
      };
    }
    return client[prop];
  }
});

export const fetchUserProfile = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Tenta buscar o perfil
    const { data, error } = await client
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle(); // Usamos maybeSingle para não estourar erro caso não exista

    if (error) {
      console.error("Erro na busca de perfil:", error.message);
      return null;
    }

    // Se o perfil não existe (ex: usuário criado manualmente no dashboard sem trigger)
    // podemos retornar um perfil temporário baseado nos dados do Auth para não travar o login
    if (!data) {
      console.warn("Perfil não encontrado no banco público. Verifique os triggers.");
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
    console.error("Falha crítica ao buscar perfil:", e);
    return null;
  }
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
  }
};
