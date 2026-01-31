
import { useState, useEffect, useRef } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserProfile,
  fetchCompleteCompanyData,
  signOut
} from './lib/supabase';

import SupabaseSetup from './SupabaseSetup';
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
import { RefreshCw, Database } from 'lucide-react';

const App = () => {
  if (!isSupabaseConfigured) {
    return <SupabaseSetup onConfigured={() => window.location.reload()} />;
  }

  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showFailsafe, setShowFailsafe] = useState(false);
  const isSyncingRef = useRef(false);

  const resetConfig = () => {
    localStorage.removeItem('FERA_SUPABASE_URL');
    localStorage.removeItem('FERA_SUPABASE_ANON_KEY');
    window.location.reload();
  };

  const syncData = async (userId: string) => {
    if (!supabase || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      console.log("Iniciando sincronização para o usuário:", userId);
      const profile = await fetchUserProfile(userId);
      
      if (!profile || !profile.company_id) {
        console.warn("Perfil não encontrado ou sem empresa vinculada.");
        setState(prev => ({ ...prev, currentUser: null }));
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

      console.log("Perfil carregado. Buscando dados da empresa:", profile.company_id);
      const companyData = await fetchCompleteCompanyData(profile.company_id);

      setState(prev => ({
        ...prev,
        currentUser: userData,
        ...(companyData || {})
      }));
      console.log("Sincronização completa.");
    } catch (e: any) {
      console.error("Erro no sync:", e);
      setInitError(`Erro: ${e.message || 'Falha na sincronização'}`);
    } finally {
      setIsInitializing(false);
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    // Failsafe: Se demorar mais de 10 segundos, mostra opção de reset
    const failsafeTimer = setTimeout(() => {
      if (isInitializing) setShowFailsafe(true);
    }, 10000);

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          await syncData(data.session.user.id);
        } else {
          setIsInitializing(false);
        }
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
        setIsInitializing(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Mudança de estado Auth:", event);
        if (event === 'SIGNED_IN' && session?.user) {
          setIsInitializing(true);
          await syncData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setState({ ...INITIAL_STATE, currentUser: null });
          setIsInitializing(false);
        }
      }
    );

    return () => {
      clearTimeout(failsafeTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
          Sincronizando Banco de Dados Cloud...
        </p>
        
        {initError && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xs">
            <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest">{initError}</p>
          </div>
        )}

        {showFailsafe && (
          <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[9px] text-slate-600 font-bold uppercase">A conexão está demorando mais que o esperado.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                <RefreshCw size={14} /> Tentar Novamente
              </button>
              <button 
                onClick={resetConfig}
                className="flex items-center justify-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20"
              >
                <Database size={14} /> Resetar Configurações
              </button>
            </div>
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
