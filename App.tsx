
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import { supabase, fetchUserProfile, isSupabaseConfigured, signOut } from './lib/supabase';
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
import SupabaseSetup from './components/SupabaseSetup';

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('fera_service_state_v2');
      if (saved) return { ...INITIAL_STATE, ...JSON.parse(saved), isSyncing: false, currentUser: null };
    } catch (e) {}
    return { ...INITIAL_STATE, currentUser: null, isSyncing: false };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Listener de Autenticação Real do Supabase
  useEffect(() => {
    if (!isConfigured) {
      setIsLoadingProfile(false);
      return;
    }

    // 1. Verificar sessão inicial
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setIsLoadingProfile(false);
      }
    };

    checkSession();

    // 2. Ouvir mudanças (Login, Logout, Token Refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, currentUser: null }));
        setIsLoadingProfile(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const loadProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    const profile = await fetchUserProfile(userId);
    if (profile) {
      const user: User = {
        id: profile.id,
        email: profile.email || '',
        name: profile.full_name,
        role: profile.role,
        companyId: profile.company_id,
        status: profile.status,
        permissions: profile.permissions
      };
      setState(prev => ({ ...prev, currentUser: user }));
    }
    setIsLoadingProfile(false);
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
  };

  if (!isConfigured) {
    return <SupabaseSetup onConfigured={() => setIsConfigured(true)} />;
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autenticando sessão...</p>
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
        onConfirm={handleLogout}
        title="Sair do Sistema"
        message="Deseja realmente encerrar sua sessão segura?"
        confirmText="Sair Agora"
        type="warning"
      />
    </>
  );
};

const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default App;
