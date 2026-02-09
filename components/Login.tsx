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

  const TIGER_LOGO_URL = "https://zbntnglatvuijefqfjhx.supabase.co/storage/v1/object/sign/TESTE/WhatsApp%20Image%202026-02-04%20at%2008.17.44.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODRmMGU5Zi04NWE1LTQ4YzYtYjgwMS1lZGE0ZGNmODU1MWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJURVNURS9XaGF0c0FwcCBJbWFnZSAyMDI2LTAyLTA0IGF0IDA4LjE3LjQ0LmpwZWciLCJpYXQiOjE3NzAyMjY3NTksImV4cCI6MTgwMTc2Mjc1OX0.4WifHdXiNMvCv21vQX4QN-VLFmEhI7fcf4498YYzx6A";

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
          backgroundImage: `url("${TIGER_LOGO_URL}")`,
          opacity: 0.3
        }}
      />
      
      {/* Overlay para melhorar leitura */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#010a1b]/60 to-[#010a1b]/90" />
      
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-8 right-8 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-sm hover:bg-white/20 text-white transition-all active:scale-95 z-10"
      >
        <Download size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Instalar Terminal</span>
      </button>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
           <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                 <img src={TIGER_LOGO_URL} alt="Fera Logo" className="w-full h-full object-cover" />
              </div>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-lg">
             FERA SERVICE
           </h1>
           <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-70">
             Unidade de Operações Urbanas
           </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="text-center">
               <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                  Terminal de Acesso Seguro
               </h2>
            </div>

            {error && (
              <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-white p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/60 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-white/5 border border-white/10 pl-14 pr-4 py-4 rounded-3xl text-[13px] text-white font-black outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                    placeholder="usuario@feraservice.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/60 uppercase tracking-widest ml-1">Senha de Operação</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    className="w-full bg-white/5 border border-white/10 pl-14 pr-14 py-4 rounded-3xl text-[13px] text-white font-black outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-[#010a1b] hover:bg-blue-500 hover:text-white disabled:opacity-50 py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>ENTRAR NO SISTEMA <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="bg-black/20 p-6 flex items-center justify-center gap-3 border-t border-white/10">
             <Smartphone size={16} className="text-white/30" />
             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">Conexão Criptografada Cloud v3.5</span>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-[100] bg-[#010a1b]/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-sm p-10 text-center relative overflow-hidden shadow-2xl">
              <button onClick={() => setShowInstallModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X size={24}/></button>
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <img src={TIGER_LOGO_URL} alt="Logo" className="w-16 h-16 object-cover rounded-xl" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-900 mb-2">Instalar Aplicativo</h3>
              <p className="text-[10px] font-medium text-slate-500 uppercase leading-relaxed mb-8">
                 Para Android: Clique no menu (três pontos) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".
                 <br/><br/>
                 Para iOS: Clique no botão de compartilhamento e selecione "Adicionar à Tela de Início".
              </p>
              <button onClick={() => setShowInstallModal(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">ENTENDI</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;