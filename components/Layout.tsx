// Fix: Added missing React import to resolve UMD global reference error
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

  const TIGER_LOGO_URL = "https://zbntnglatvuijefqfjhx.supabase.co/storage/v1/object/sign/TESTE/WhatsApp%20Image%202026-02-04%20at%2008.17.44.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODRmMGU5Zi04NWE1LTQ4YzYtYjgwMS1lZGE0ZGNmODU1MWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJURVNURS9XaGF0c0FwcCBJbWFnZSAyMDI2LTAyLTA0IGF0IDA4LjE3LjQ0LmpwZWciLCJpYXQiOjE3NzAyMjY3NTksImV4cCI6MTgwMTc2Mjc1OX0.4WifHdXiNMvCv21vQX4QN-VLFmEhI7fcf4498YYzx6A";

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
      <div className="p-8 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
           <img src={TIGER_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">
          FERA SERVICE
        </h1>
      </div>
      
      <div className="p-5 border-b border-white/5 bg-[#010a1b]">
        <div className="px-2">
          <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{user?.name}</p>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{roleLabel(userRole)}</p>
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={16} />
          Encerrar Sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b-4 border-[#010a1b] sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={TIGER_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
           </div>
           <span className="font-black text-[#010a1b] text-sm uppercase tracking-tighter">
             {translateTab(activeTab)}
           </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-[#010a1b] hover:bg-slate-100 rounded-none border-2 border-[#010a1b] transition-all active:scale-90"
        >
          <Menu size={20} />
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