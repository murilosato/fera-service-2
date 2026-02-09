
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Smartphone,
  Download,
  X
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (authError) {
        throw new Error('E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010a1b] flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-radial-gradient from-[#0a1f44] to-[#010a1b]" />
      
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-8 right-8 flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-sm hover:bg-white/10 text-white transition-all active:scale-95 z-10"
      >
        <Download size={18} className="text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-widest">Instalar App</span>
      </button>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex flex-col items-center gap-2 mb-2">
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
               FERA SERVICE
             </h1>
           </div>
           <p className="text-blue-400/80 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
             Unidade de Operações Urbanas
           </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[48px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="text-center mb-4">
               <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                  Acesso Restrito ao Terminal
               </h2>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">E-mail de Operação</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-white/5 border border-white/10 pl-14 pr-4 py-5 rounded-[24px] text-[13px] text-white font-black outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                    placeholder="usuario@feraservice.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Chave de Segurança</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    className="w-full bg-white/5 border border-white/10 pl-14 pr-14 py-5 rounded-[24px] text-[13px] text-white font-black outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>ENTRAR NO SISTEMA <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="bg-black/20 p-6 flex items-center justify-center gap-3 border-t border-white/10">
             <Smartphone size={16} className="text-white/20" />
             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em]">Cloud Terminal v3.5 Secure</span>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-[100] bg-[#010a1b]/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[48px] w-full max-w-sm p-12 text-center relative overflow-hidden shadow-2xl">
              <button onClick={() => setShowInstallModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={24}/></button>
              <h3 className="text-sm font-black uppercase text-slate-900 mb-4 tracking-widest pt-4">Instalação</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed mb-10">
                 Para Android: No menu do navegador, selecione "Instalar aplicativo".
                 <br/><br/>
                 Para iOS: No botão de compartilhamento, selecione "Adicionar à Tela de Início".
              </p>
              <button onClick={() => setShowInstallModal(false)} className="w-full bg-blue-600 text-white py-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-lg">ENTENDI</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;
