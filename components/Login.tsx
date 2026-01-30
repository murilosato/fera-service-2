
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
  const [showInstallModal, setShowInstallModal] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans antialiased relative">
      {/* Botão Flutuante de Instalação */}
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

        <div className="mt-8 text-center space-y-4">
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Ambiente Seguro & Criptografado</p>
           
           <button 
             onClick={() => setShowInstallModal(true)}
             className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
           >
              <Download size={14} /> Deseja baixar o App?
           </button>
        </div>
      </div>

      {/* Modal de Instruções de Instalação */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Instalar Aplicativo</h3>
              </div>
              <button onClick={() => setShowInstallModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-900 text-xs">1</div>
                     <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Para Android (Chrome)</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Toque nos <span className="text-slate-900">três pontos</span> no canto superior e selecione <span className="text-emerald-600">"Instalar Aplicativo"</span> ou "Adicionar à tela inicial".</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-900 text-xs">2</div>
                     <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Para iPhone (Safari)</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Toque no ícone de <span className="text-slate-900">Compartilhar</span> (quadrado com seta) e selecione <span className="text-emerald-600">"Adicionar à Tela de Início"</span>.</p>
                     </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
                     <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-black text-blue-800 uppercase leading-relaxed tracking-tight">Isso permite usar o sistema como um App nativo, com mais espaço de tela e acesso imediato.</p>
                  </div>
               </div>

               <button 
                 onClick={() => setShowInstallModal(false)}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
               >
                  ENTENDI, VOU INSTALAR
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
