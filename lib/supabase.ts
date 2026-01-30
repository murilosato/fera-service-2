
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Chaves fornecidas pelo usuário
const SUPABASE_ANON_KEY = 'sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2';
const SUPABASE_SECRET_KEY = 'sb_secret_C4zghbXw2sUBouGn558Bow_Z4XtDNvz';

const getKeys = () => {
  // A URL ainda pode vir do localStorage ou ser definida aqui se você tiver
  const url = localStorage.getItem('FERA_SUPABASE_URL') || '';
  return { url, key: SUPABASE_ANON_KEY };
};

export const isSupabaseConfigured = () => {
  const { url } = getKeys();
  // Se tivermos a URL no storage, consideramos configurado
  return !!url;
};

let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const { url } = getKeys();
  
  // Se a URL estiver vazia, tentamos inicializar com uma string vazia para não quebrar o Proxy, 
  // mas avisamos no console. Idealmente o usuário define a URL uma vez.
  if (!url) {
    console.warn("Supabase URL não encontrada no localStorage. Use localStorage.setItem('FERA_SUPABASE_URL', 'sua-url')");
    return null;
  }

  supabaseInstance = createClient(url, SUPABASE_ANON_KEY);
  return supabaseInstance;
};

export const supabase: any = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      return (...args: any[]) => {
        console.error("Tentativa de usar Supabase sem URL configurada.");
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
    const { data, error } = await client
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Erro ao buscar perfil:", e);
    return null;
  }
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
};
