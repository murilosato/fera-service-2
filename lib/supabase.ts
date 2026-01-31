import { createClient } from '@supabase/supabase-js';

// Lê as chaves que o usuário salvou
const SUPABASE_URL = localStorage.getItem('FERA_SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = localStorage.getItem('FERA_SUPABASE_ANON_KEY') || '';

// Verifica se já está configurado
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// Cria o cliente SOMENTE se estiver configurado
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
