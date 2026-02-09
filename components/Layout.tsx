
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  DollarSign, 
  Package, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
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

  const TIGER_LOGO_URL = "https://img.freepik.com/premium-vector/tiger-logo-design-vector-template-dark-blue-background_645658-410.jpg";

  const menuItems = [
    { id: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard, permission: true },
    { id: 'production', label: 'Produção', icon: MapPin, permission: user?.permissions.production },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, permission: user?.permissions.finance },
    { id: 'inventory', label: 'Almoxarifado', icon: Package, permission: user?.permissions.inventory },
    { id: 'employees', label: 'Equipe & RH', icon: Users, permission: user?.permissions.employees },
    { id: 'analytics', label: 'Relatórios', icon: BarChart3, permission: user?.permissions.analytics },
    { id: 'management', label: 'Gestão de Acessos', icon: ShieldCheck, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
    { id: 'settings', label: 'Configurações', icon: Settings, permission: userRole === UserRole.MASTER || userRole === UserRole.ADMIN },
  ];

  const visibleItems = menuItems.filter(item => item.permission);

  const translateTab = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.label : id;
  };

  const roleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.MASTER: return 'DIRETORIA MASTER';
      case UserRole.ADMIN: return 'GERÊNCIA';
      case UserRole.OPERATIONAL: return 'OPERACIONAL';
      default: return role;
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#010a1b] text-slate-400 w-64 fixed left-0 top-0 z-50 border-r border-white/5">
      <div className="p-8 flex items-center gap-4 border-b border-white/5">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 bg-[#010a1b]">
           <img src={TIGER_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">
            FERA SERVICE
          </h1>
        </div>
      </div>
      
      <div className="p-6 border-b border-white/5 bg-[#010a1b]">
        <div className="px-2">
          <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{user?.name}</p>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{roleLabel(userRole)}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={18} />
          Encerrar Sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b-4 border-[#010a1b] sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#010a1b]">
              <img src={TIGER_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
           </div>
           <span className="font-black text-[#010a1b] text-sm uppercase tracking-tighter">
             {translateTab(activeTab)}
           </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2.5 text-[#010a1b] hover:bg-slate-100 rounded-xl transition-all active:scale-90"
        >
          <Menu size={22} />
        </button>
      </div>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-[#010a1b]/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
