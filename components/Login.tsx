
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Zap, 
  Smartphone,
  Download,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: any) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (authError) {
        setIsLoading(false);
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : authError.message);
      }
      
      // Nota: Não setamos isLoading(false) aqui pois o App.tsx 
      // detectará a mudança de sessão e remontará o componente.
      // Adicionamos um timeout de segurança para destravar o botão se nada acontecer.
      setTimeout(() => setIsLoading(false), 8000);

    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans antialiased relative">
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-6 right-6 flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-full shadow-sm hover:shadow-md hover:border-emerald-500 text-slate-600 transition-all active:scale-95 group z-10"
      >
        <Download size={16} className="group-hover:text-emerald-600" />
        <span className="text-[10px] font-black uppercase tracking-widest">Baixar App</span>
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-emerald-600 rounded flex items-center justify-center text-white shadow-xl mx-auto mb-4">
              <Zap size={32} fill="white" />
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Fera Service</h1>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-60">Gestão de Dados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded text-[10px] font-black uppercase tracking-wider text-center border border-rose-100 animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={16} />
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded text-[13px] font-bold outline-none focus:border-emerald-600 transition-all placeholder:text-slate-300"
                  placeholder="usuario@feraservice.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-12 py-3.5 rounded text-[13px] font-bold outline-none focus:border-emerald-600 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white py-4 rounded font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>AUTENTICANDO...</span>
                </div>
              ) : (
                <>
                  AUTENTICAR ACESSO
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-2">
             <Smartphone size={14} className="text-slate-400" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Terminal de Campo v4.0.0</span>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Instalar App</h3>
              <button onClick={() => setShowInstallModal(false)}><X size={20}/></button>
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold">Adicione o Fera Service à sua tela inicial para acesso rápido.</p>
            <button onClick={() => setShowInstallModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
