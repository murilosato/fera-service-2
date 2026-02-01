
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, UserPermissions } from '../types';
import { ShieldCheck, UserPlus, Search, Building, Loader2, X, Edit2, CheckCircle2, Lock, Save, Globe } from 'lucide-react';
import { supabase, dbSave } from '../lib/supabase';

interface ManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Management: React.FC<ManagementProps> = ({ state, notify }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.OPERATIONAL as UserRole,
    companyId: '',
    permissions: { production: true, finance: false, inventory: true, employees: false, analytics: false, ai: true } as UserPermissions
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const isMaster = state.currentUser?.role === UserRole.MASTER;
      
      const { data: pros } = isMaster 
        ? await supabase.from('profiles').select('*').order('full_name')
        : await supabase.from('profiles').select('*').eq('company_id', state.currentUser?.companyId).order('full_name');
      
      const { data: cos } = isMaster
        ? await supabase.from('companies').select('*').order('name')
        : await supabase.from('companies').select('*').eq('id', state.currentUser?.companyId);

      setProfiles(pros || []);
      setCompanies(cos || []);
      if (cos && cos.length > 0) setSelectedCompanyId(cos[0].id);
    } catch (e) { notify("Erro de conexão", "error"); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.full_name,
      email: p.email || '',
      password: '',
      role: p.role,
      companyId: p.company_id || '',
      permissions: p.permissions || form.permissions
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name) return notify("Dados obrigatórios faltando", "error");
    
    setIsLoading(true);
    try {
      if (!editingId && form.password) {
        await supabase.auth.signUp({ email: form.email, password: form.password });
      }

      await dbSave('profiles', {
        id: editingId || undefined,
        full_name: form.name.toUpperCase(),
        email: form.email.toLowerCase(),
        role: form.role,
        company_id: form.role === UserRole.MASTER ? null : form.companyId,
        permissions: form.permissions,
        status: 'ativo'
      });
      notify("Perfil atualizado no servidor");
      setShowForm(false);
      fetchData();
    } catch (e: any) { notify(e.message, "error"); } finally { setIsLoading(false); }
  };

  const filteredProfiles = profiles.filter(p => state.currentUser?.role === UserRole.MASTER || p.company_id === state.currentUser?.companyId);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h2 className="text-xl font-black uppercase tracking-tight">Infraestrutura & Acessos</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hierarquia de Controle Corporativo</p></div>
        <button onClick={() => { setEditingId(null); setForm({...form, companyId: selectedCompanyId}); setShowForm(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl hover:bg-blue-600 transition-all"><UserPlus size={16} /> ADICIONAR ACESSO</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {state.currentUser?.role === UserRole.MASTER && (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
            <div className="p-4 bg-slate-50 border-b flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><Globe size={14}/> Unidades do Grupo</div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
               {companies.map(c => (
                 <button key={c.id} onClick={() => setSelectedCompanyId(c.id)} className={`w-full text-left p-4 rounded-2xl transition-all ${selectedCompanyId === c.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <p className="text-[10px] font-black uppercase truncate">{c.name}</p>
                    <p className="text-[8px] opacity-60 font-bold uppercase mt-1">ID: {c.id.slice(0,8)}</p>
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className={`bg-white border rounded-[32px] overflow-hidden shadow-sm flex flex-col ${state.currentUser?.role === UserRole.MASTER ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="p-6 border-b flex items-center justify-between bg-slate-50/30">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><ShieldCheck size={18} className="text-blue-600"/> Usuários e Permissões</div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                <tr><th className="px-8 py-5">Nome Completo</th><th className="px-8 py-5">Hierarquia</th><th className="px-8 py-5 text-center">Editar</th></tr>
              </thead>
              <tbody className="divide-y text-[11px] font-black uppercase text-slate-700">
                {filteredProfiles.filter(p => !selectedCompanyId || p.company_id === selectedCompanyId || p.role === UserRole.MASTER).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">{p.full_name}</td>
                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[8px] text-white ${p.role === UserRole.MASTER ? 'bg-slate-900' : 'bg-blue-600'}`}>{p.role}</span></td>
                    <td className="px-8 py-5 text-center"><button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-all"><Edit2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSave} className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-6 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black uppercase text-sm">{editingId ? 'Modificar Perfil' : 'Criar Credencial Cloud'}</h3>
                <button type="button" onClick={() => setShowForm(false)}><X/></button>
              </div>
              <div className="space-y-4">
                <input required className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" placeholder="Nome do Usuário" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input required className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black" placeholder="E-mail Institucional" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                {!editingId && <div className="relative"><input required type="password" className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black" placeholder="Senha Provisória" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>}
                <div className="grid grid-cols-2 gap-4">
                   <select className="bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" value={form.role} onChange={e => setForm({...form, role: e.target.value as any})}>
                     <option value={UserRole.OPERATIONAL}>OPERACIONAL</option>
                     <option value={UserRole.ADMIN}>GERENTE UNIDADE</option>
                     {state.currentUser?.role === UserRole.MASTER && <option value={UserRole.MASTER}>DIRETORIA MASTER</option>}
                   </select>
                   <select className="bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})} disabled={form.role === UserRole.MASTER}>
                     <option value="">VINCULAR EMPRESA</option>
                     {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4">
                   {Object.keys(form.permissions).map(k => (
                     <button key={k} type="button" onClick={() => setForm({...form, permissions: {...form.permissions, [k]: !form.permissions[k as keyof UserPermissions]}})} className={`flex items-center justify-between p-3 rounded-xl border text-[9px] font-black uppercase ${form.permissions[k as keyof UserPermissions] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        {k} {form.permissions[k as keyof UserPermissions] ? <CheckCircle2 size={14}/> : <div className="w-3 h-3 rounded-full border"/>}
                     </button>
                   ))}
                </div>
              </div>
              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={16}/>} SALVAR CONFIGURAÇÕES
              </button>
           </form>
        </div>
      )}
    </div>
  );
};
export default Management;
