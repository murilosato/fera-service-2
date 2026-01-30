
import React, { useState } from 'react';
import { Database, ShieldCheck, ArrowRight, Zap, Info, CheckCircle2, AlertCircle, Key, Globe } from 'lucide-react';

interface SupabaseSetupProps {
  onConfigured: () => void;
}

const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onConfigured }) => {
  // Pré-preenchendo com as chaves fornecidas para facilitar o setup inicial
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('sb_publishable_KiZXFlucpA_RSEuYyot5GA_eQdaTKC2');
  const [secretKey, setSecretKey] = useState('sb_secret_C4zghbXw2sUBouGn558Bow_Z4XtDNvz');
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    // Validação básica: URL deve ser preenchida e chaves devem ter tamanho mínimo
    if (!url || anonKey.length < 10) {
      setStatus('error');
      alert("Por favor, insira uma URL válida e verifique a Chave Anon.");
      return;
    }

    setIsLoading(true);
    try {
      // Salvando no localStorage para o cliente em lib/supabase.ts consumir
      localStorage.setItem('FERA_SUPABASE_URL', url.trim());
      localStorage.setItem('FERA_SUPABASE_ANON_KEY', anonKey.trim());
      localStorage.setItem('FERA_SUPABASE_SECRET_KEY', secretKey.trim()); // Opcional, mas guardamos
      
      setStatus('success');
      setTimeout(() => {
        onConfigured();
        window.location.reload(); // Recarrega para reinicializar o cliente Supabase com as novas chaves
      }, 1000);
    } catch (e) {
      setStatus('error');
      console.error("Erro ao salvar configuração:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 mx-auto mb-6">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Configuração de Infraestrutura</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">SaaS Cloud Architecture</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex gap-3">
              <Zap className="text-emerald-400 shrink-0" size={18} />
              <p className="text-[10px] font-bold text-emerald-100 uppercase leading-relaxed tracking-wide">
                Conecte sua instância do Supabase. Estas chaves permitirão o isolamento de dados (RLS) para múltiplas empresas.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Globe size={12} /> Supabase Project URL
                </label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="https://seu-projeto.supabase.co"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Key size={12} /> Anon Public Key (Publishable)
                </label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-[10px] font-mono font-bold text-slate-300 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="sb_publishable_..."
                  value={anonKey}
                  onChange={e => setAnonKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <ShieldCheck size={12} /> Secret Key (Service Role)
                </label>
                <input 
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-[10px] font-mono font-bold text-slate-500 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="sb_secret_..."
                  value={secretKey}
                  onChange={e => setSecretKey(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isLoading || !url}
              className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 ${
                status === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : status === 'success' ? (
                <>SISTEMA CONECTADO <CheckCircle2 size={18} /></>
              ) : (
                <>ATIVAR CONEXÃO CLOUD <ArrowRight size={18} /></>
              )}
            </button>
          </div>

          <div className="px-8 py-5 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Segurança SSL Ativa</span>
            </div>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[8px] font-black text-emerald-600 uppercase hover:underline"
            >
              Obter chaves no Dashboard
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">
          Ambiente de Configuração de Administrador v4.0.1
        </p>
      </div>
    </div>
  );
};

export default SupabaseSetup;
