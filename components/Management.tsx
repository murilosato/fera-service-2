
import React, { useState } from 'react';
import { AppState, User, UserRole, UserPermissions } from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  Lock, 
  Mail, 
  User as UserIcon,
  X,
  Settings,
  ShieldAlert,
  Building,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Circle
} from 'lucide-react';

interface ManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Management: React.FC<ManagementProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const defaultPermissions: UserPermissions = {
    production: true,
    finance: false,
    inventory: true,
    employees: true,
    analytics: false,
    ai: true
  };

  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.OPERATIONAL,
    status: 'active',
    permissions: defaultPermissions
  });

  const currentUser = state.currentUser;
  const isMaster = currentUser?.role === UserRole.MASTER;

  const filteredUsers = state.users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePermission = (userId: string, key: keyof UserPermissions) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== userId) return u;
        return { ...u, permissions: { ...u.permissions, [key]: !u.permissions[key] } };
      })
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">GESTÃO DE ACESSOS</h2>
          <p className="text-xs text-slate-500 font-medium">Controle de usuários, empresas e permissões modulares.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUserId(null);
            setUserForm({ name: '', email: '', role: UserRole.OPERATIONAL, status: 'active', permissions: defaultPermissions });
            setShowAddUser(true);
          }}
          className="bg-slate-900 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <UserPlus size={16} /> NOVO USUÁRIO
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Utilizadores Ativos</span>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium outline-none focus:ring-2 focus:ring-slate-900/5 w-64"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Permissões de Módulo</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 uppercase">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight ${user.role === UserRole.MASTER ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                        {Object.entries(user.permissions).map(([key, value]) => (
                          <div 
                            key={key}
                            className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                          >
                            {key}
                          </div>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`flex items-center justify-center gap-1.5 ${user.status === 'active' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <Circle size={8} fill="currentColor" />
                      <span className="font-bold uppercase text-[9px]">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <Settings size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 uppercase tracking-tight">Configuração de Credencial</h3>
                 <button onClick={() => setShowAddUser(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded"><X /></button>
              </div>
              <div className="p-8 space-y-6">
                 {/* Formulário limpo e objetivo aqui */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome</label>
                       <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-xs font-bold outline-none" placeholder="Nome completo" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail</label>
                       <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-xs font-bold outline-none" placeholder="usuario@feraservice.com" />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Autorizações de Módulo</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {Object.keys(defaultPermissions).map(key => (
                         <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">{key}</span>
                            <button className="text-emerald-600"><ToggleRight size={24} /></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <button className="w-full bg-slate-900 text-white py-4 rounded font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all">
                    Finalizar e Salvar Usuário
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Management;
