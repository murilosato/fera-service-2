
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  DollarSign, 
  Package, 
  Users, 
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  onLogout?: () => void;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard, permission: true },
    { id: 'production', label: 'Produção', icon: MapPin, permission: user?.permissions.production },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, permission: user?.permissions.finance },
    { id: 'inventory', label: 'Almoxarifado', icon: Package, permission: user?.permissions.inventory },
    { id: 'employees', label: 'Equipe & RH', icon: Users, permission: user?.permissions.employees },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: user?.permissions.analytics },
    { id: 'management', label: 'Gestão de Acessos', icon: ShieldCheck, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
    { id: 'ai', label: 'Fera Bot (IA)', icon: MessageSquare, permission: user?.permissions.ai },
    { id: 'settings', label: 'Configurações', icon: Settings, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
  ];

  const visibleItems = menuItems.filter(item => item.permission);

  const roleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.MASTER: return 'DIRETORIA MASTER';
      case UserRole.ADMIN: return 'GERÊNCIA';
      case UserRole.OPERATIONAL: return 'OPERACIONAL';
      default: return role;
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-400 w-64 fixed left-0 top-0 z-50 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white">
          <Zap size={18} fill="white" />
        </div>
        <h1 className="text-lg font-black text-white uppercase tracking-tighter">Fera Service</h1>
      </div>
      
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate uppercase">{user?.name}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{roleLabel(userRole)}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-all text-xs font-bold uppercase tracking-wide ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-all text-xs font-black uppercase"
        >
          <LogOut size={16} />
          Sair da Conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 bg-emerald-600 rounded flex items-center justify-center text-white">
             <Zap size={14} fill="white" />
           </div>
           <span className="font-black text-slate-900 text-xs uppercase tracking-tighter">{activeTab}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64 p-4 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
