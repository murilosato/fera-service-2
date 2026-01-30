
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
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

const App: React.FC = () => {
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

  // Persistência Automática
  useEffect(() => {
    try {
      localStorage.setItem('fera_service_state_v2', JSON.stringify(state));
    } catch (e) {
      console.error("Erro ao salvar no armazenamento local:", e);
    }
  }, [state]);

  const handleLogin = (user: User) => {
    // Busca permissões reais do estado para o usuário que está logando
    const realUser = state.users.find(u => u.email === user.email) || user;
    setState(prev => ({ ...prev, currentUser: realUser }));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      setState(prev => ({ ...prev, currentUser: null }));
    }
  };

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
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userRole={state.currentUser.role}
      onLogout={handleLogout}
      user={state.currentUser}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
