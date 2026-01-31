
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, User } from './types';
import { INITIAL_STATE } from './constants';
import { supabase, fetchUserProfile, signOut } from './lib/supabase';
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

  const loadProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        const user: User = {
          id: profile.id,
          email: profile.email || '',
          name: profile.full_name,
          role: profile.role || 'OPERACIONAL',
          companyId: profile.company_id || 'default',
          status: profile.status || 'ativo',
          permissions: profile.permissions || {
            production: true, finance: false, inventory: true,
            employees: true, analytics: false, ai: true
          }
        };
        setState(prev => ({ ...prev, currentUser: user }));
      } else {
        // Se falhar em carregar perfil mas o Auth estiver logado, 
        // mantemos o login se houver fallback, senão deslogamos.
        await signOut();
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Tenta recuperar sessão existente no carregamento da página
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setIsLoadingProfile(false);
        }

        // 2. Escuta mudanças de estado (Login efetuado, Logout, Token renovado)
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
      } catch (err) {
        console.error("Falha na inicialização do Supabase:", err);
        setIsLoadingProfile(false);
      }
    };

    initApp();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('dashboard'); // Reset tab
  };

  // 1. Tela de Carregamento Global
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-slate-900 font-black uppercase tracking-tighter text-lg">Fera Service</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Autenticando Acesso...</p>
      </div>
    );
  }

  // 2. Tela de Login (Se não houver usuário logado)
  if (!state.currentUser) {
    return <Login onLogin={() => {}} users={[]} />;
  }

  // 3. Aplicação Principal (Se logado)
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
        title="Encerrar Sessão"
        message="Deseja realmente sair do terminal Fera Service? Você precisará autenticar novamente."
        confirmText="Encerrar Agora"
        type="warning"
      />
    </>
  );
};

export default App;
