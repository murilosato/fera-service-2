
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import { supabase, getCurrentProfile, isSupabaseConfigured } from './lib/supabase';
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
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('fera_service_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STATE,
          ...parsed,
          isSyncing: false
        };
      }
    } catch (e) {
      console.warn("Falha ao carregar estado local:", e);
    }
    return { ...INITIAL_STATE, currentUser: null, isSyncing: false };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Persistência Automática (Local fallback)
  useEffect(() => {
    if (isConfigured) {
      try {
        localStorage.setItem('fera_service_state_v2', JSON.stringify(state));
      } catch (e) {
        console.error("Erro ao salvar no armazenamento local:", e);
      }
    }
  }, [state, isConfigured]);

  // Sincronização com Supabase Profile
  useEffect(() => {
    if (isConfigured) {
      const syncProfile = async () => {
        const profile = await getCurrentProfile();
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
      };
      syncProfile();
    }
  }, [isConfigured]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    setActiveTab('dashboard');
  };

  const performLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // 1. Prioridade: Se não estiver configurado, mostra a tela de setup do banco
  if (!isConfigured) {
    return <SupabaseSetup onConfigured={() => setIsConfigured(true)} />;
  }

  // 2. Se não houver usuário logado, mostra tela de login (integrada ao Supabase futuramente)
  if (!state.currentUser) {
    return <Login onLogin={handleLogin} users={state.users} />;
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
        onConfirm={performLogout}
        title="Sair do Sistema"
        message="Deseja realmente encerrar sua sessão atual?"
        confirmText="Sair Agora"
        type="warning"
      />
    </>
  );
};

export default App;
