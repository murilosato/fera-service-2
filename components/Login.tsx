
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lock, Mail, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulando delay de autenticação (preparado para Supabase)
    setTimeout(() => {
      if (email === 'admin@feraservice.com' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          email: 'admin@feraservice.com',
          name: 'Administrador Fera',
          role: UserRole.ADMIN
        };
        onLogin(mockUser);
      } else {
        setError('Credenciais inválidas. Tente admin@feraservice.com / admin123');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-500/40 mx-auto mb-6 transform hover:rotate-6 transition-transform">
              <span className="text-white text-3xl font-black italic tracking-tighter">FS</span>
           </div>
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Fera Service</h1>
           <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest opacity-60">Sistema de Gestão Urbana</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-[10px] font-black uppercase text-center animate-bounce">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-white font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="admin@feraservice.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                <button type="button" className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300">Esqueceu?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-12 py-4 rounded-2xl text-white font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 relative overflow-hidden group active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-slate-500">
              <Sparkles size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tecnologia Inteligente de Gestão</span>
           </div>
           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">© 2024 FERA SERVICE - TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
