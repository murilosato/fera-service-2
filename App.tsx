
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
  if (!isSupabaseConfigured) {
    return <SupabaseSetup onConfigured={() => window.location.reload()} />;
  }

  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  const syncData = async (userId: string) => {
    if (!supabase || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const profile = await fetchUserProfile(userId);
      if (!profile || !profile.company_id) {
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

      const companyData = await fetchCompleteCompanyData(profile.company_id);

      setState(prev => ({
        ...prev,
        currentUser: userData,
        ...(companyData || {})
      }));
    } catch (e) {
      console.error("Erro no sync:", e);
      setInitError('Falha na sincronização cloud');
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

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await syncData(data.session.user.id);
      } else {
        setIsInitializing(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
          Sincronizando Banco de Dados...
        </p>
        {initError && <p className="mt-4 text-[9px] text-rose-500 font-black uppercase">{initError}</p>}
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
