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

const App = () => {

  /* =====================================================
     1️⃣ SE NÃO ESTIVER CONFIGURADO → MOSTRA SETUP
     ===================================================== */
  if (!isSupabaseConfigured) {
    return <SupabaseSetup onConfigured={() => window.location.reload()} />;
  }

  /* =====================================================
     2️⃣ STATES
     ===================================================== */
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  /* =====================================================
     3️⃣ SINCRONIZAÇÃO
     ===================================================== */
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
        ...(companyData || {})
      }));
    } catch (e) {
      console.error(e);
      setInitError('Falha ao sincronizar dados');
    } finally {
      setIsInitializing(false);
      isSyncingRef.current = false;
    }
  };

  /* =====================================================
     4️⃣ BOOTSTRAP
     ===================================================== */
  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await syncData(data.session.user.id);
      } else {
        setIsInitializing(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsInitializing(true);
          await syncData(session.user.id);
        } else {
          setState({ ...INITIAL_STATE, currentUser: null });
          setIsInitializing(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     5️⃣ LOADER
     ===================================================== */
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs text-slate-400 uppercase">
          Inicializando sistema…
        </p>
        {initError && <p className="text-red-500 text-xs mt-2">{initError}</p>}
      </div>
    );
  }

  /* =====================================================
     6️⃣ LOGIN
     ===================================================== */
  if (!state.currentUser) {
    return <Login onLogin={() => {}} users={[]} />;
  }

  /* =====================================================
     7️⃣ APP
     ===================================================== */
  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={state.currentUser.role}
        user={state.currentUser}
        onLogout={() => setShowLogoutConfirm(true)}
      >
        {activeTab === 'dashboard' && <Dashboard state={state} setState={setState} setActiveTab={setActiveTab} />}
        {activeTab === 'production' && <Production state={state} setState={setState} setActiveTab={setActiveTab} />}
        {activeTab === 'finance' && <Finance state={state} setState={setState} setActiveTab={setActiveTab} />}
        {activeTab === 'inventory' && <Inventory state={state} setState={setState} setActiveTab={setActiveTab} />}
        {activeTab === 'employees' && <Employees state={state} setState={setState} setActiveTab={setActiveTab} />}
        {activeTab === 'analytics' && <Analytics state={state} />}
        {activeTab === 'management' && <Management state={state} setState={setState} />}
        {activeTab === 'ai' && <AIAssistant state={state} />}
        {activeTab === 'settings' && <Settings state={state} setState={setState} setActiveTab={setActiveTab} />}
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
