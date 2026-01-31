const App: React.FC = () => {

  // 🔴 PRIMEIRA VERIFICAÇÃO DE TODAS
  if (!isSupabaseConfigured) {
    return <SupabaseSetup onConfigured={() => window.location.reload()} />;
  }


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

const App: React.FC = () => {


  /* ===============================
     2️⃣ STATES BÁSICOS
     =============================== */
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  /* ===============================
     3️⃣ SINCRONIZAÇÃO DE DADOS
     =============================== */
  const syncData = async (userId: string) => {
    if (!supabase || isSyncingRef.current) return;

    isSyncingRef.current = true;

    try {
      const profile = await fetchUserProfile(userId);

      if (!profile || !profile.company_id) {
        setState(prev => ({ ...prev, currentUser: null }));
        return;
      }

      const userData: User = {
        id: profile.id,
        email: profile.email || '',
        name: profile.full_name || 'Usuário',
        role: profile.role || UserRole.OPERATIONAL,
        companyId: profile.company_id,
        status: profile.status || 'ativo',
        permissions: profile.permissions || INITIAL_STATE.users[0].permissions
      };

      const companyData = await fetchCompleteCompanyData(profile.company_id);

      setState(prev => ({
        ...prev,
        currentUser: userData,
        ...(companyData || {}),
        isSyncing: false
      }));

    } catch (err) {
      console.error('Erro na sincronização:', err);
      setInitError('Falha ao sincronizar dados.');
    } finally {
      setIsInitializing(false);
      isSyncingRef.current = false;
    }
  };

  /* ===============================
     4️⃣ BOOTSTRAP INICIAL
     =============================== */
  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let mounted = true;

    const failSafe = setTimeout(() => {
      if (mounted) {
        console.warn('Fail-safe acionado');
        setIsInitializing(false);
      }
    }, 10000);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        if (data.session?.user) {
          await syncData(data.session.user.id);
        } else {
          setIsInitializing(false);
        }
      } catch (e) {
        console.error('Erro no init:', e);
        setIsInitializing(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setIsInitializing(true);
          await syncData(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          setState({ ...INITIAL_STATE, currentUser: null });
          setIsInitializing(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(failSafe);
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ===============================
     5️⃣ LOADING
     =============================== */
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-6 font-black text-white uppercase tracking-[0.3em] text-xs">
          Fera Service Cloud
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 animate-pulse">
          Inicializando sistema...
        </p>
        {initError && (
          <p className="mt-4 text-[9px] text-rose-500 font-black uppercase">
            {initError}
          </p>
        )}
      </div>
    );
  }

  /* ===============================
     6️⃣ LOGIN
     =============================== */
  if (!state.currentUser) {
    return <Login onLogin={() => {}} users={[]} />;
  }

  /* ===============================
     7️⃣ CONTEÚDO
     =============================== */
  const renderContent = () => {
    const props = { state, setState, setActiveTab };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'production': return <Production {...props} />;
      case 'finance': return <Finance {...props} />;
      case 'inventory': return <Inventory {...props} />;
      case 'employees': return <Employees {...props} />;
      case 'analytics': return <Analytics state={state} />;
      case 'management': return <Management state={state} setState={setState} />;
      case 'ai': return <AIAssistant state={state} />;
      case 'settings': return <Settings {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  /* ===============================
     8️⃣ LAYOUT FINAL
     =============================== */
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
        message="Deseja encerrar sua sessão?"
        confirmText="Sair"
        type="warning"
      />
    </>
  );
};

export default App;
