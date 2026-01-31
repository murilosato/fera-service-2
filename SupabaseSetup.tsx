
import { useState } from 'react';
import {
  Database,
  ArrowRight,
  Zap,
  CheckCircle2,
  Key,
  Globe,
  Loader2
} from 'lucide-react';

interface SupabaseSetupProps {
  onConfigured: () => void;
}

const SupabaseSetup = ({ onConfigured }: SupabaseSetupProps) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    if (url.length < 10 || anonKey.length < 20) {
      alert('Por favor, informe uma URL válida e a Anon Key do projeto.');
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('FERA_SUPABASE_URL', url.trim());
      localStorage.setItem('FERA_SUPABASE_ANON_KEY', anonKey.trim());
      setStatus('success');
      setTimeout(() => {
        onConfigured();
      }, 1000);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
            <Database size={36} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            Conexão Fera Cloud
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
            Infraestrutura de Banco de Dados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 space-y-8 shadow-2xl">
          <div className="flex gap-4 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
            <Zap className="text-emerald-400 shrink-0" size={20} />
            <p className="text-[10px] text-emerald-100 font-bold uppercase leading-relaxed tracking-wider">
              Informe as credenciais publicas do seu projeto Supabase para ativar o sistema SaaS.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Globe size={12} /> Project URL (API)
              </label>
              <input
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-emerald-400 text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="https://sua-url.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Key size={12} /> API Key (Anon Public)
              </label>
              <textarea
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-slate-400 text-[10px] font-mono outline-none focus:border-emerald-500 transition-all h-24 resize-none"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all active:scale-95 ${
              status === 'success'
                ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                : 'bg-white text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : status === 'success' ? (
              <>
                SISTEMA ATIVADO <CheckCircle2 size={18} />
              </>
            ) : (
              <>
                VINCULAR BANCO <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[9px] font-bold text-slate-700 mt-8 uppercase tracking-widest">
          As chaves são armazenadas localmente no seu navegador.
        </p>
      </div>
    </div>
  );
};

export default SupabaseSetup;
