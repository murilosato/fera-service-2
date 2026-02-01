
import { useState, useEffect, useRef } from 'react';
import { AppState, UserRole, User } from './types';
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
import { RefreshCw, LogOut, AlertCircle, X, CheckCircle2 } from 'lucide-react';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const syncData = async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      if (!profile || !profile.company_id) {
        setInitError("Aguardando configuração do perfil da empresa...");
        setTimeout(() => syncData(userId), 2000); // Retry non-blocking
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
      setInitError(null);
      setIsInitializing(false);
    } catch (e: any) {
      setInitError("Sincronização falhou. Tente novamente.");
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncData(session.user.id);
      else setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) syncData(session.user.id);
      else if (event === 'SIGNED_OUT') {
        setState({ ...INITIAL_STATE, currentUser: null });
        setIsInitializing(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-xl shadow-emerald-500/20" />
        <h2 className="mt-8 font-black text-white uppercase tracking-[0.3em] text-[10px]">Fera Service Cloud</h2>
        <p className="mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Estabelecendo Canal Seguro...</p>
        {initError && (
          <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm animate-in zoom-in-95">
             <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertCircle size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Status da Conexão</p>
             </div>
             <p className="text-[11px] text-slate-400 font-medium mb-6">{initError}</p>
             <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Recarregar Manualmente
             </button>
          </div>
        )}
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
            case 'analytics': return <Analytics state={state} />;
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
