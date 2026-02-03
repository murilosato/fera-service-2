
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
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: any) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        // MODO REGISTRO (Recuperação de conta Master)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password: password,
          options: {
            data: {
              full_name: name.toUpperCase(),
              role: 'DIRETORIA_MASTER' // Força Master no primeiro registro
            }
          }
        });

        if (signUpError) throw signUpError;
        
        setSuccess('Conta criada com sucesso! O sistema está autorizando seu acesso...');
        // O App.tsx detectará o SIGNED_IN automaticamente
      } else {
        // MODO LOGIN
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password
        });

        if (authError) {
          throw new Error(authError.message === 'Invalid login credentials' 
            ? 'E-mail ou senha incorretos.' 
            : authError.message);
        }
      }
      
      // Timeout de segurança para destravar UI se o App.tsx demorar a reagir
      setTimeout(() => setIsLoading(false), 8000);

    } catch (err: any) {
      setError(err.message || 'Falha na operação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans antialiased relative">
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-6 right-6 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full shadow-sm hover:bg-white/10 text-slate-400 transition-all active:scale-95 group z-10"
      >
        <Download size={16} className="group-hover:text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">Baixar App</span>
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] mx-auto mb-6 animate-pulse">
              <Zap size={32} fill="white" />
           </div>
           <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Fera Service</h1>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-60">Gestão de Dados em Nuvem</p>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-[11px] font-black text-white uppercase tracking-widest">
                  {isRegistering ? 'Criar Nova Conta Master' : 'Autenticar Acesso'}
               </h2>
               <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccess('');
                }}
                className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
               >
                  {isRegistering ? 'Voltar ao Login' : 'Primeiro Acesso?'}
               </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center border border-rose-500/20">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center border border-emerald-500/20">
                {success}
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-[13px] text-white font-bold outline-none focus:border-emerald-600 transition-all placeholder:text-slate-700"
                    placeholder="SEU NOME"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={16} />
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-5 py-4 rounded-2xl text-[13px] text-white font-bold outline-none focus:border-emerald-600 transition-all placeholder:text-slate-700"
                  placeholder="usuario@feraservice.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-12 py-4 rounded-2xl text-[13px] text-white font-bold outline-none focus:border-emerald-600 transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 mt-4"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>PROCESSANDO...</span>
                </div>
              ) : (
                <>
                  {isRegistering ? 'CRIAR ACESSO MASTER' : 'AUTENTICAR SISTEMA'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="bg-black/20 p-6 border-t border-white/5 flex items-center justify-center gap-2">
             <Smartphone size={14} className="text-slate-600" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Terminal de Campo v4.2.1</span>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Instalar App</h3>
              <button onClick={() => setShowInstallModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold leading-relaxed">Adicione o Fera Service à sua tela inicial para acesso instantâneo às operações de campo.</p>
            <button onClick={() => setShowInstallModal(false)} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
