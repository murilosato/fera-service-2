
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
  Circle,
  ChevronDown
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
    status: 'ativo',
    permissions: defaultPermissions
  });

  const currentUser = state.currentUser;
  const isMaster = currentUser?.role === UserRole.MASTER;

  const roleDisplay = (role: UserRole) => {
    switch(role) {
      case UserRole.MASTER: return 'DIRETORIA MASTER';
      case UserRole.ADMIN: return 'GERÊNCIA';
      case UserRole.OPERATIONAL: return 'OPERACIONAL';
      default: return role;
    }
  };

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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    if (editingUserId) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUserId ? { ...u, ...userForm as User } : u)
      }));
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: state.currentUser?.companyId || 'default-company',
        name: userForm.name!,
        email: userForm.email!,
        role: userForm.role || UserRole.OPERATIONAL,
        status: 'ativo',
        permissions: userForm.permissions || defaultPermissions
      };
      setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    }
    setShowAddUser(false);
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gestão de Acessos</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Controle de permissões por módulo e nível de autoridade</p>
        </div>
        <button 
          onClick={() => {
            setEditingUserId(null);
            setUserForm({ name: '', email: '', role: UserRole.OPERATIONAL, status: 'ativo', permissions: defaultPermissions });
            setShowAddUser(true);
          }}
          className="bg-slate-900 text-white px-5 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> CADASTRAR ACESSO
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
           <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Utilizadores do Sistema</span>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded text-[11px] font-bold outline-none focus:border-emerald-500 w-full md:w-72"
                placeholder="Pesquisar por nome ou e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200">
                <th className="px-6 py-4">Nome de Usuário</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Módulos Liberados</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Config.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded border border-slate-200 flex items-center justify-center font-black text-white ${user.role === UserRole.MASTER ? 'bg-slate-900' : 'bg-slate-300'}`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase leading-none mb-1">{user.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold lowercase">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-tighter ${user.role === UserRole.MASTER ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {roleDisplay(user.role)}
                     </span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {Object.entries(user.permissions).map(([key, value]) => (
                          <div 
                            key={key}
                            className={`px-2 py-0.5 rounded-sm border text-[8px] font-black uppercase tracking-tighter transition-colors ${value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                          >
                            {key === 'production' ? 'PRODUÇÃO' : key === 'finance' ? 'FINANCEIRO' : key === 'inventory' ? 'ALMOXARIFADO' : key === 'employees' ? 'RH' : key === 'ai' ? 'FERA BOT' : key.toUpperCase()}
                          </div>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className={`flex items-center justify-center gap-1.5 ${user.status === 'ativo' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <Circle size={8} fill="currentColor" />
                      <span className="font-black uppercase text-[9px] tracking-widest">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => {
                        setUserForm(user);
                        setEditingUserId(user.id);
                        setShowAddUser(true);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                 <h3 className="font-black uppercase text-xs tracking-[0.2em]">Configurações de Credencial</h3>
                 <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-white/10 rounded"><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                       <input 
                         required
                         className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-[11px] font-bold uppercase outline-none focus:border-emerald-500" 
                         value={userForm.name}
                         onChange={e => setUserForm({...userForm, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
                       <input 
                         required
                         type="email"
                         className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-[11px] font-bold outline-none focus:border-emerald-500" 
                         value={userForm.email}
                         onChange={e => setUserForm({...userForm, email: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Nível de Acesso</label>
                       <div className="relative">
                        <select 
                          required
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-[11px] font-black uppercase outline-none focus:border-emerald-500 appearance-none"
                          value={userForm.role}
                          onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                        >
                          <option value={UserRole.MASTER}>Diretoria Master</option>
                          <option value={UserRole.ADMIN}>Gerência de Unidade</option>
                          <option value={UserRole.OPERATIONAL}>Operacional / Campo</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Controle Modular</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {Object.keys(defaultPermissions).map(key => (
                         <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:border-emerald-200 transition-all">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                              {key === 'production' ? 'PRODUÇÃO' : key === 'finance' ? 'FINANCEIRO' : key === 'inventory' ? 'ALMOXARIFADO' : key === 'employees' ? 'RH' : key === 'analytics' ? 'ANALYTICS' : key === 'ai' ? 'FERA BOT' : key.toUpperCase()}
                            </span>
                            <button 
                              type="button"
                              onClick={() => {
                                const newPerms = { ...userForm.permissions!, [key]: !userForm.permissions?.[key as keyof UserPermissions] };
                                setUserForm({...userForm, permissions: newPerms});
                              }}
                              className={`transition-colors ${userForm.permissions?.[key as keyof UserPermissions] ? 'text-emerald-600' : 'text-slate-300'}`}
                            >
                               {userForm.permissions?.[key as keyof UserPermissions] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <button className="w-full bg-slate-900 text-white py-4 rounded font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
                    {editingUserId ? 'ATUALIZAR ACESSO' : 'FINALIZAR CADASTRO'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Management;
