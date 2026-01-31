
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import { supabase, fetchUserProfile, signOut, fetchCompleteCompanyData } from './lib/supabase';
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const syncData = async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email || '',
          name: profile.full_name || 'Usuário',
          role: profile.role || UserRole.OPERATIONAL,
          companyId: profile.company_id || 'setup-pending',
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
      }
    } catch (err) {
      console.error("Falha na sincronização:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Timeout de segurança: se em 8 segundos não inicializar, libera a tela
      const safetyTimeout = setTimeout(() => setIsInitializing(false), 8000);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncData(session.user.id);
      } else {
        setIsInitializing(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await syncData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setState({ ...INITIAL_STATE, currentUser: null });
          setIsInitializing(false);
        }
      });

      clearTimeout(safetyTimeout);
      return () => {
        subscription.unsubscribe();
        clearTimeout(safetyTimeout);
      };
    };
    init();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-4 font-black text-slate-900 uppercase">Fera Service</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Conectando ao Banco de Dados...</p>
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
      case 'management': return <Management state={state} setState={setState} />;
      case 'ai': return <AIAssistant state={state} />;
      case 'settings': return <Settings {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        userRole={state.currentUser.role}
        onLogout={() => setShowLogoutConfirm(true)}
        user={state.currentUser}
      >
        {renderContent()}
      </Layout>
      <ConfirmationModal 
        isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => { await signOut(); setShowLogoutConfirm(false); }}
        title="Sair do Sistema" message="Deseja encerrar sua sessão?" confirmText="Sair" type="warning"
      />
    </>
  );
};

export default App;
