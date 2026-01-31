
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
    setIsInitializing(true);
    const profile = await fetchUserProfile(userId);
    
    if (profile) {
      const userData: User = {
        id: profile.id,
        email: profile.email || '',
        name: profile.full_name,
        role: profile.role,
        companyId: profile.company_id,
        status: profile.status,
        permissions: profile.permissions
      };

      const companyData = await fetchCompleteCompanyData(profile.company_id);
      
      setState(prev => ({
        ...prev,
        currentUser: userData,
        ...companyData,
        isSyncing: false
      }));
    } else {
      await signOut();
    }
    setIsInitializing(false);
  };

  useEffect(() => {
    const init = async () => {
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
        }
      });

      return () => subscription.unsubscribe();
    };
    init();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-slate-900 font-black uppercase tracking-tighter text-xl">Fera Service</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Sincronizando Nuvem...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return <Login onLogin={() => {}} users={[]} />;
  }

  const renderContent = () => {
    const commonProps = { state, setState, setActiveTab };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} />;
      case 'production': return <Production {...commonProps} />;
      case 'finance': return <Finance {...commonProps} />;
      case 'inventory': return <Inventory {...commonProps} />;
      case 'employees': return <Employees {...commonProps} />;
      case 'analytics': return <Analytics state={state} />;
      case 'management': return <Management state={state} setState={setState} />;
      case 'ai': return <AIAssistant state={state} />;
      case 'settings': return <Settings {...commonProps} />;
      default: return <Dashboard {...commonProps} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={state.currentUser.role}
        onLogout={() => setShowLogoutConfirm(true)}
        user={state.currentUser}
      >
        {renderContent()}
      </Layout>

      <ConfirmationModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => { await signOut(); setShowLogoutConfirm(false); }}
        title="Sair do Sistema"
        message="Deseja encerrar sua sessão segura no terminal?"
        confirmText="Sair Agora"
        type="warning"
      />
    </>
  );
};

export default App;
