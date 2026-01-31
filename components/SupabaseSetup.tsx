import { useState } from 'react';
import {
  Database,
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
  Key,
  Globe
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
    if (!url || anonKey.length < 20) {
      setStatus('error');
      alert('Informe a URL do projeto e a Anon Public Key.');
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('FERA_SUPABASE_URL', url.trim());
      localStorage.setItem('FERA_SUPABASE_ANON_KEY', anonKey.trim());

      setStatus('success');

      setTimeout(() => {
        onConfigured();
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error('Erro ao salvar configuração:', e);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase">
            Configuração do Supabase
          </h1>
          <p className="text-slate-500 text-xs mt-2">
            Conecte seu banco de dados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
            <Zap className="text-emerald-400" size={18} />
            <p className="text-xs text-emerald-100 font-semibold">
              Use a URL do projeto e a Anon Public Key do Supabase.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 flex items-center gap-2 mb-1">
                <Globe size={12} /> Project URL
              </label>
              <input
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-emerald-400 text-sm"
                placeholder="https://xxxx.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 flex items-center gap-2 mb-1">
                <Key size={12} /> Anon Public Key
              </label>
              <input
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-slate-300 text-xs font-mono"
                placeholder="sb_publishable_..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2 transition ${
              status === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : status === 'success' ? (
              <>
                Conectado <CheckCircle2 size={16} />
              </>
            ) : (
              <>
                Ativar Conexão <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Ambiente de configuração inicial
        </p>
      </div>
    </div>
  );
};

export default SupabaseSetup;
