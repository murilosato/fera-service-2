
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Chaves buscadas do localStorage para permitir configuração dinâmica via UI
const getKeys = () => {
  const url = localStorage.getItem('FERA_SUPABASE_URL');
  const key = localStorage.getItem('FERA_SUPABASE_ANON_KEY');
  return { url, key };
};

export const isSupabaseConfigured = () => {
  const { url, key } = getKeys();
  return !!url && !!key;
};

// Singleton do cliente Supabase
let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getKeys();
  
  if (!url || !key) {
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

// Exportamos uma proxy para manter a compatibilidade com os componentes existentes
export const supabase: any = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      console.warn("Supabase não configurado. Redirecionando para setup...");
      return () => ({ error: new Error("Supabase não configurado") });
    }
    return client[prop];
  }
});

export const getCurrentProfile = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    const { data: profile } = await client
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (e) {
    return null;
  }
};
