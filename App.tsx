
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, UserRole } from './types';
import { INITIAL_STATE } from './constants';
import { supabase, fetchUserProfile, fetchCompleteCompanyData, signOut } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Production from './components/Production';
import Finance from './components/Finance';
import Inventory from './components/Inventory';
import Employees from './components/Employees';
import Settings from './components/Settings';
import Login from './components/Login';
import Analytics from './components/Analytics';
import Management from './components/Management';
import ConfirmationModal from './components/ConfirmationModal';
import { RefreshCw, LogOut, AlertCircle, X, CheckCircle2, UserPlus } from 'lucide-react';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Ref para rastrear o ID do usuário atual e evitar sincronizações duplicadas
  const currentUserRef = useRef<string | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const syncData = useCallback(async (userId: string, retryCount = 0) => {
    try {
      console.log(`Sincronizando: ${userId} (Tentativa ${retryCount})`);
      const profile = await fetchUserProfile(userId);
      
      if (!profile) {
        if (retryCount < 2) { 
          setTimeout(() => syncData(userId, retryCount + 1), 1500);
          return;
        }
        setInitError("PERFIL OPERACIONAL NÃO ENCONTRADO. Se você deletou sua conta, clique em 'SAIR E RECOMEÇAR' para criar uma nova credencial Master.");
        setIsInitializing(false);
        return;
      }

      if (!profile.company_id) {
        setInitError("USUÁRIO SEM UNIDADE. Sua conta existe mas não está vinculada a nenhuma empresa operativa.");
        setIsInitializing(false);
        return;
      }

      const companyData = await fetchCompleteCompanyData(profile.company_id);
      
      setState(prev => ({
        ...prev,
        currentUser: {
          id: profile.id,
          email: profile.email || '',
          name: profile.full_name || 'Usuário',
          role: profile.role as UserRole || UserRole.OPERATIONAL,
          companyId: profile.company_id,
          status: profile.status as 'ativo' | 'suspenso' || 'ativo',
          permissions: profile.permissions || INITIAL_STATE.users[0].permissions
        },
        ...(companyData || {})
      }));
      
      currentUserRef.current = userId;
      setInitError(null);
      setIsInitializing(false);
    } catch (e: any) {
      console.error("Erro crítico na sincronização:", e);
      setInitError("FALHA DE COMUNICAÇÃO. Verifique sua conexão ou tente novamente em instantes.");
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          currentUserRef.current = session.user.id;
          await syncData(session.user.id);
        } else {
          setIsInitializing(false);
        }
      } catch (e) {
        setInitError("ERRO DE AUTENTICAÇÃO.");
        setIsInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Só reinicializa se o usuário mudou ou se não temos um usuário atual
        if (currentUserRef.current !== session.user.id) {
          setIsInitializing(true);
          setInitError(null);
          syncData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        currentUserRef.current = null;
        setState({ ...INITIAL_STATE, currentUser: null });
        setIsInitializing(false);
        setInitError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncData]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-center p-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <h2 className="font-black text-white uppercase tracking-[0.4em] text-[11px] opacity-90">Fera Service Cloud</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6">
        <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-sm w-full animate-in zoom-in-95 backdrop-blur-xl text-center shadow-2xl">
           <div className="w-16 h-16 bg-rose-500/10 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-rose-500" />
           </div>
           <h2 className="font-black text-white uppercase tracking-widest text-[11px] mb-4">Acesso Bloqueado</h2>
           <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-10 uppercase tracking-tight">{initError}</p>
           
           <div className="space-y-3">
              <button onClick={() => window.location.reload()} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                  <RefreshCw size={16} /> Tentar Reconectar
              </button>
              <button onClick={async () => await signOut()} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20">
                  <LogOut size={16} /> Sair e Recomeçar
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (!state.currentUser) return <Login onLogin={() => {}} users={[]} />;

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={state.currentUser.role} user={state.currentUser} onLogout={() => setShowLogoutConfirm(true)}>
        {(() => {
          const props = { state, setState, setActiveTab, notify };
          switch (activeTab) {
            case 'dashboard': return <Dashboard {...props} />;
            case 'production': return <Production {...props} />;
            case 'finance': return <Finance {...props} />;
            case 'inventory': return <Inventory {...props} />;
            case 'employees': return <Employees {...props} />;
            case 'analytics': return <Analytics {...props} />;
            case 'management': return <Management {...props} />;
            case 'settings': return <Settings {...props} />;
            default: return <Dashboard {...props} />;
          }
        })()}
      </Layout>

      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 border ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
           {notification.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
           <p className="text-[10px] font-black uppercase tracking-widest">{notification.message}</p>
           <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70"><X size={14}/></button>
        </div>
      )}

      <ConfirmationModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={async () => { await signOut(); setShowLogoutConfirm(false); }} title="Sair do Sistema" message="Deseja encerrar sua sessão segura?" confirmText="Sair" type="warning" />
    </>
  );
};

export default App;
