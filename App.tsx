
import { useState, useEffect, useRef } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import {
  supabase,
  fetchUserProfile,
  fetchCompleteCompanyData,
  signOut
} from './lib/supabase';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Production from './components/Production';
import Finance from './components/Finance';
import Inventory from './components/Inventory';
import Employees from './components/Employees';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import Login from './components/Login';
import Analytics from './components/Analytics';
import Management from './components/Management';
import ConfirmationModal from './components/ConfirmationModal';
import { RefreshCw, LogOut, AlertCircle } from 'lucide-react';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  const syncData = async (userId: string) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const profile = await fetchUserProfile(userId);
      
      if (!profile || !profile.company_id) {
        setInitError("Perfil operacional não encontrado.");
        setIsInitializing(false);
        return;
      }

      const userData: User = {
        id: profile.id,
        email: profile.email || '',
        name: profile.full_name || 'Usuário',
        role: profile.role as UserRole || UserRole.OPERATIONAL,
        companyId: profile.company_id,
        status: profile.status as 'ativo' | 'suspenso' || 'ativo',
        permissions: profile.permissions || INITIAL_STATE.users[0].permissions
      };

      const companyData = await fetchCompleteCompanyData(profile.company_id);

      setState(prev => ({
        ...prev,
        currentUser: userData,
        ...(companyData || {})
      }));
      setInitError(null);
    } catch (e: any) {
      console.error("Erro Fatal no Sync:", e);
      setInitError(`Sincronização falhou: ${e.message}`);
    } finally {
      setIsInitializing(false);
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncData(session.user.id);
        } else {
          setIsInitializing(false);
        }
      } catch (e) {
        console.error("Erro na Sessão:", e);
        setIsInitializing(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsInitializing(true);
        await syncData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Fix: Removed 'USER_DELETED' as it is not present in the current Supabase AuthChangeEvent union type
        setState({ ...INITIAL_STATE, currentUser: null });
        setIsInitializing(false);
        setInitError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="mt-8 font-black text-white uppercase tracking-[0.2em] text-xs">Fera Service Cloud</h2>
        <p className="mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Iniciando Conexão Segura...
        </p>
        
        {initError && (
          <div className="mt-10 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xs">
            <div className="flex items-center gap-2 mb-2 text-rose-500">
              <AlertCircle size={14} />
              <p className="text-[9px] font-black uppercase tracking-widest">Aviso</p>
            </div>
            <p className="text-[10px] text-rose-200/60 font-medium leading-relaxed mb-4">{initError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-slate-800 text-white w-full py-2 rounded-xl font-black text-[9px] uppercase hover:bg-slate-700 transition-all"
            >
              <RefreshCw size={12} /> Recarregar
            </button>
            <button 
              onClick={async () => { await signOut(); window.location.reload(); }}
              className="mt-2 flex items-center justify-center gap-2 bg-transparent text-slate-500 w-full py-2 font-black text-[9px] uppercase hover:text-white transition-all"
            >
              <LogOut size={12} /> Limpar Sessão
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!state.currentUser) {
    return <Login onLogin={() => {}} users={[]} />;
  }

  const renderContent = () => {
    const props = { state, setState, setActiveTab };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'production': return <Production {...props} />;
      case 'finance': return <Finance {...props} />;
      case 'inventory': return <Inventory {...props} />;
      case 'employees': return <Employees {...props} />;
      case 'analytics': return <Analytics state={state} />;
      case 'management': return <Management {...props} />;
      case 'ai': return <AIAssistant state={state} />;
      case 'settings': return <Settings {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={state.currentUser.role}
        user={state.currentUser}
        onLogout={() => setShowLogoutConfirm(true)}
      >
        {renderContent()}
      </Layout>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          await signOut();
          setShowLogoutConfirm(false);
        }}
        title="Sair do Sistema"
        message="Deseja encerrar sua sessão segura?"
        confirmText="Sair"
        type="warning"
      />
    </>
  );
};

export default App;
