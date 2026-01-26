
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
      const saved = localStorage.getItem('gestor_urbano_state');
      if (!saved) return { ...INITIAL_STATE, currentUser: null };
      
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_STATE,
        ...parsed,
        attendanceRecords: parsed.attendanceRecords || [],
        employees: parsed.employees || INITIAL_STATE.employees,
        areas: parsed.areas || INITIAL_STATE.areas,
        inventory: parsed.inventory || INITIAL_STATE.inventory,
        cashIn: parsed.cashIn || INITIAL_STATE.cashIn,
        cashOut: parsed.cashOut || INITIAL_STATE.cashOut,
        users: parsed.users || INITIAL_STATE.users,
        currentUser: parsed.currentUser || null
      };
    } catch (e) {
      console.warn("Erro ao restaurar estado. Usando inicial.", e);
      return { ...INITIAL_STATE, currentUser: null };
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    try {
      localStorage.setItem('gestor_urbano_state', JSON.stringify(state));
    } catch (e) {
      console.error("Falha ao salvar estado:", e);
    }
  }, [state]);

  const handleLogin = (user: User) => {
    // Busca o usuário real no estado para ter as permissões atualizadas
    const realUser = state.users.find(u => u.email === user.email);
    if (realUser?.status === 'suspended') {
      alert("Sua conta está suspensa. Entre em contato com o Master Admin.");
      return;
    }
    setState(prev => ({ ...prev, currentUser: realUser || user }));
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
