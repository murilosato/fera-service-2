
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, UserPermissions } from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Building, 
  Loader2, 
  X, 
  Plus, 
  MapPin, 
  DollarSign, 
  Package, 
  Users, 
  BarChart3, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { supabase, dbSave } from '../lib/supabase';

interface ManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Management: React.FC<ManagementProps> = ({ state, notify }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: UserRole.OPERATIONAL as UserRole,
    companyId: '',
    permissions: {
      production: true,
      finance: false,
      inventory: true,
      employees: false,
      analytics: false,
      ai: true
    } as UserPermissions
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const isMaster = state.currentUser?.role === UserRole.MASTER;
      
      const { data: cos } = isMaster 
        ? await supabase.from('companies').select('*').order('name')
        : await supabase.from('companies').select('*').eq('id', state.currentUser?.companyId);
      
      const { data: pros } = isMaster
        ? await supabase.from('profiles').select('*').order('full_name')
        : await supabase.from('profiles').select('*').eq('company_id', state.currentUser?.companyId);

      setCompanies(cos || []);
      setProfiles(pros || []);
      
      if (cos && cos.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(cos[0].id);
      }
    } catch (e) {
      notify("Erro de conexão", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.companyId || !newUserForm.name) {
      return notify("Preencha todos os campos!", "error");
    }
    
    setIsLoading(true);
    try {
      await dbSave('profiles', {
        id: crypto.randomUUID(), // Mock ID para visualização na lista (no Real, Auth ID)
        companyId: newUserForm.companyId,
        fullName: newUserForm.name.toUpperCase(),
        role: newUserForm.role,
        permissions: newUserForm.permissions,
        status: 'ativo'
      });
      
      notify("Acesso configurado e salvo no banco!");
      setShowAddUser(false);
      setNewUserForm({ 
        name: '', 
        email: '', 
        role: UserRole.OPERATIONAL, 
        companyId: selectedCompanyId,
        permissions: { production: true, finance: false, inventory: true, employees: false, analytics: false, ai: true }
      });
      await fetchData();
    } catch (e) {
      notify("Falha ao salvar permissões", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setNewUserForm({
      ...newUserForm,
      permissions: {
        ...newUserForm.permissions,
        [key]: !newUserForm.permissions[key]
      }
    });
  };

  const currentUsers = profiles.filter(p => 
    p.company_id === selectedCompanyId && 
    (p.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || p.role?.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'DIRETORIA_MASTER': return 'bg-slate-900 text-white';
      case 'GERENTE_UNIDADE': return 'bg-blue-600 text-white';
      default: return 'bg-emerald-600 text-white';
    }
  };

  const PermissionIcon = ({ enabled, icon: Icon, label }: { enabled: boolean, icon: any, label: string }) => (
    <div title={label} className={`p-1.5 rounded-lg transition-all ${enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300 grayscale opacity-40'}`}>
      <Icon size={14} />
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão de Infraestrutura</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hierarquia e Controle de Módulos</p>
        </div>
        <button 
          onClick={() => { setShowAddUser(true); setNewUserForm({...newUserForm, companyId: selectedCompanyId}); }} 
          className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl"
        >
          <UserPlus size={16} /> ADICIONAR ACESSO
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-250px)] flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Building size={12}/> Unidades Gerenciadas
             </h3>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {companies.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCompanyId(c.id)} 
                  className={`w-full text-left p-4 rounded-2xl transition-all flex flex-col ${selectedCompanyId === c.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                   <span className="text-[10px] font-black uppercase truncate">{c.name}</span>
                   <span className="text-[8px] font-bold opacity-60 uppercase mt-1 tracking-widest">ID: {c.id.slice(0,8)}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-800">
                <ShieldCheck size={20} className="text-blue-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Acessos e Permissões de Módulo</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  className="bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-2xl text-[10px] font-bold outline-none focus:border-slate-900 transition-all w-64" 
                  placeholder="BUSCAR USUÁRIO..." 
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                 <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Nome Completo</th>
                      <th className="px-8 py-5">Nível de Acesso</th>
                      <th className="px-8 py-5">Módulos Habilitados</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 uppercase font-black text-slate-700">
                    {currentUsers.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-6">{p.full_name}</td>
                         <td className="px-8 py-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[8px] tracking-widest ${getRoleBadgeColor(p.role)}`}>
                             {p.role.replace('_', ' ')}
                           </span>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex gap-1.5">
                               <PermissionIcon enabled={p.permissions?.production} icon={MapPin} label="Produção" />
                               <PermissionIcon enabled={p.permissions?.finance} icon={DollarSign} label="Financeiro" />
                               <PermissionIcon enabled={p.permissions?.inventory} icon={Package} label="Estoque" />
                               <PermissionIcon enabled={p.permissions?.employees} icon={Users} label="RH" />
                               <PermissionIcon enabled={p.permissions?.analytics} icon={BarChart3} label="Analytics" />
                               <PermissionIcon enabled={p.permissions?.ai} icon={Sparkles} label="Fera Bot" />
                            </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                           <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px]">ATIVO</span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleCreateAccess} className="bg-white rounded-[40px] w-full max-w-xl p-10 space-y-8 shadow-2xl animate-in zoom-in-95 border border-slate-100 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center border-b pb-6">
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-900">Novo Perfil Corporativo</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Definição Granular de Permissões</p>
                </div>
                <button type="button" onClick={() => setShowAddUser(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-4 border-blue-600 pl-3">Dados de Identificação</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Nome Completo</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-[11px] uppercase outline-none focus:bg-white focus:border-blue-600" placeholder="DIGITE O NOME" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">E-mail Institucional</label>
                      <input type="email" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-[11px] outline-none focus:bg-white focus:border-blue-600" placeholder="usuario@feraservice.com" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Nível Hierárquico (ROLE)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-[11px] uppercase outline-none" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}>
                         <option value={UserRole.OPERATIONAL}>OPERACIONAL (CAMPO)</option>
                         <option value={UserRole.ADMIN}>GERENTE DE UNIDADE</option>
                         <option value={UserRole.MASTER}>DIRETORIA MASTER</option>
                      </select>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-4 border-emerald-600 pl-3">Módulos Habilitados</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {Object.keys(newUserForm.permissions).map((key) => (
                         <button 
                            key={key}
                            type="button"
                            onClick={() => togglePermission(key as keyof UserPermissions)}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${newUserForm.permissions[key as keyof UserPermissions] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                         >
                            <span className={`text-[10px] font-black uppercase ${newUserForm.permissions[key as keyof UserPermissions] ? 'text-emerald-700' : 'text-slate-400'}`}>
                               {key === 'ai' ? 'Fera Bot (IA)' : key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                            {newUserForm.permissions[key as keyof UserPermissions] ? <CheckCircle2 size={16} className="text-emerald-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                 <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancelar</button>
                 <button disabled={isLoading} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                   {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'FINALIZAR E CADASTRAR'}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Management;
