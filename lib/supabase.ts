
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const getKeys = () => {
  const url = localStorage.getItem('FERA_SUPABASE_URL');
  const key = localStorage.getItem('FERA_SUPABASE_ANON_KEY');
  return { url, key };
};

export const isSupabaseConfigured = () => {
  const { url, key } = getKeys();
  return !!url && !!key;
};

let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  const { url, key } = getKeys();
  if (!url || !key) return null;
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

export const supabase: any = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) return () => ({ error: new Error("Supabase não configurado") });
    return client[prop];
  }
});

// Busca o perfil completo do usuário baseado no ID do Auth
export const fetchUserProfile = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
  return data;
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
};
