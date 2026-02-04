
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
      {/* Imagem de Fundo Personalizada */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://zbntnglatvuijefqfjhx.supabase.co/storage/v1/object/sign/TESTE/ChatGPT%20Image%204%20de%20fev.%20de%202026,%2013_44_06.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODRmMGU5Zi04NWE1LTQ4YzYtYjgwMS1lZGE0ZGNmODU1MWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJURVNURS9DaGF0R1BUIEltYWdlIDQgZGUgZmV2LiBkZSAyMDI2LCAxM180NF8wNi5wbmciLCJpYXQiOjE3NzAyMjcwODMsImV4cCI6MTgwMTc2MzA4M30.cA-OAiqJhMZ92PpPQUCXMq948fMnvreYeXCdslKYLaI")',
          opacity: 0.6
        }}
      />
      
      {/* Overlay para melhorar leitura */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#010a1b]/40 to-[#010a1b]/80" />
      
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-8 right-8 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-sm hover:bg-white/20 text-white transition-all active:scale-95 z-10"
      >
        <Download size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Instalar Terminal</span>
      </button>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-lg">
             FERA SERVICE
           </h1>
           <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-70">
             Unidade de Operações Urbanas
           </p>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <form onSubmit={handleSubmit} className="p-12 space-y-8">
            <div className="text-center">
               <h2 className="text-[11px] font-black text-[#010a1b] uppercase tracking-[0.2em]">
                  Terminal de Acesso Seguro
               </h2>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#2e3545] uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-4 py-5 rounded-3xl text-[13px] text-[#010a1b] font-black outline-none focus:border-[#010a1b] transition-all"
                    placeholder="usuario@feraservice.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#2e3545] uppercase tracking-widest ml-1">Senha de Operação</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-14 py-5 rounded-3xl text-[13px] text-[#010a1b] font-black outline-none focus:border-[#010a1b] transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#010a1b]">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#010a1b] hover:bg-emerald-600 disabled:opacity-50 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>ENTRAR NO SISTEMA <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="bg-slate-50 p-6 flex items-center justify-center gap-3 border-t border-slate-100">
             <Smartphone size={16} className="text-slate-300" />
             <span className="text-[9px] font-black text-[#2e3545] uppercase tracking-[0.1em] opacity-50">Conexão Criptografada Cloud v3.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
