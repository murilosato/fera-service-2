
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
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  onLogout?: () => void;
  user?: User;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'production', label: 'Produção', icon: MapPin },
    { id: 'finance', label: 'Finanças', icon: DollarSign },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'ai', label: 'Fera Bot', icon: MessageSquare },
    { id: 'settings', label: 'Conf.', icon: Settings },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2 uppercase">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">FS</div>
          Fera Service
        </h1>
        <div className="mt-4 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
           <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center text-xs font-black">
             {user?.name?.charAt(0) || <UserIcon size={14} />}
           </div>
           <div className="min-w-0">
             <p className="text-[10px] font-black text-white truncate">{user?.name || 'Usuário'}</p>
             <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest truncate">{userRole}</p>
           </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30 font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3.5 w-full text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded-2xl transition-all font-black uppercase text-xs tracking-widest"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Mobile */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">FS</div>
           <h1 className="font-black text-slate-800 text-sm tracking-tighter uppercase">{activeTab}</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-400 bg-slate-50 rounded-xl active:scale-90 transition-all"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="h-full bg-slate-900 flex flex-col">
               <div className="flex justify-end p-4">
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-2"><X /></button>
               </div>
               <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className={`text-[9px] font-black uppercase tracking-tighter ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
            {activeTab === item.id && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
