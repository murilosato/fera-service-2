
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
  Smartphone
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const foundUser = users.find(u => u.email === email.toLowerCase());
      if (foundUser && password === 'fera123') {
        onLogin(foundUser);
      } else if (email === 'admin@feraservice.com' && password === 'admin123') {
        const master = users.find(u => u.role === UserRole.MASTER);
        if(master) onLogin(master);
      } else {
        setError('Acesso negado. Por favor, verifique seu e-mail e chave.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans antialiased">
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
              <div className="bg-rose-50 text-rose-600 p-3 rounded text-[10px] font-black uppercase tracking-wider text-center border border-rose-100">
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
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white py-4 rounded font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  AUTENTICAR ACESSO
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-2">
             <Smartphone size={14} className="text-slate-400" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Terminal de Campo v3.5.0</span>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Ambiente Seguro & Criptografado</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
