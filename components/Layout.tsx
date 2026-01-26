
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
  User as UserIcon,
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: true },
    { id: 'production', label: 'Produção', icon: MapPin, permission: user?.permissions.production },
    { id: 'finance', label: 'Finanças', icon: DollarSign, permission: user?.permissions.finance },
    { id: 'inventory', label: 'Estoque', icon: Package, permission: user?.permissions.inventory },
    { id: 'employees', label: 'Equipe', icon: Users, permission: user?.permissions.employees },
    { id: 'analytics', label: 'Relatórios', icon: BarChart3, permission: user?.permissions.analytics },
    { id: 'management', label: 'Gestão', icon: ShieldCheck, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
    { id: 'ai', label: 'Fera Bot', icon: MessageSquare, permission: user?.permissions.ai },
    { id: 'settings', label: 'Configurações', icon: Settings, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
  ];

  const visibleItems = menuItems.filter(item => item.permission);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 fixed left-0 top-0 z-50 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center text-white shadow-sm">
            <Zap size={18} fill="white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase">Fera Service</h1>
        </div>
      </div>
      
      <div className="px-4 py-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-500 font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-semibold ${
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
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-all text-sm font-bold"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 bg-emerald-600 rounded flex items-center justify-center text-white">
             <Zap size={14} fill="white" />
           </div>
           <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{activeTab}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
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

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
