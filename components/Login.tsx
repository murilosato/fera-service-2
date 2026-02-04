
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
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : authError.message);
      }
      
      // Timeout de segurança
      setTimeout(() => setIsLoading(false), 8000);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      {/* Imagem de Fundo Temática com Opacidade */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2070&auto=format&fit=crop")',
          opacity: 0.15 
        }}
      />
      
      {/* Botão Baixar App - Estilo Quadrado */}
      <button 
        onClick={() => setShowInstallModal(true)}
        className="fixed top-6 right-6 flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-none shadow-sm hover:bg-slate-50 text-slate-600 transition-all active:scale-95 z-10"
      >
        <Download size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Instalar Terminal</span>
      </button>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none inline-block pb-1">
             FERA SERVICE
           </h1>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
             Gestão de Operações Urbanas
           </p>
        </div>

        <div className="bg-white border-2 border-slate-900 rounded-none shadow-[20px_20px_0px_0px_rgba(15,23,42,0.1)]">
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="space-y-1">
               <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">
                  Controle de Acesso Restrito
               </h2>
            </div>

            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-600 p-4 text-[10px] font-black uppercase tracking-wider">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Operação</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  className="w-full bg-slate-50 border-2 border-slate-200 pl-12 pr-4 py-4 rounded-none text-[13px] text-slate-900 font-bold outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="usuario@feraservice.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave de Identificação</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border-2 border-slate-200 pl-12 pr-12 py-4 rounded-none text-[13px] text-slate-900 font-bold outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="DIGITE SUA SENHA"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white py-5 rounded-none font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>AUTENTICANDO...</span>
                </div>
              ) : (
                <>
                  ACESSAR TERMINAL
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex items-center justify-center gap-2">
             <Smartphone size={14} className="text-slate-400" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Criptografia de Dados Ponta-a-Ponta</span>
          </div>
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-md shadow-2xl p-10 space-y-6">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Instalar no Dispositivo</h3>
              <button onClick={() => setShowInstallModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold leading-relaxed">
              Para melhor desempenho em campo, adicione o sistema à sua tela inicial. Toque no ícone de compartilhar do navegador e selecione "Adicionar à Tela de Início".
            </p>
            <button onClick={() => setShowInstallModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-none font-black uppercase text-[10px] tracking-widest">Fechar Instruções</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
