
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, UserPermissions } from '../types';
import { ShieldCheck, UserPlus, Search, Building, Loader2, X, Edit2, CheckCircle2, Lock, Save, Globe, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.OPERATIONAL as UserRole,
    companyId: state.currentUser?.companyId || '',
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
      if (cos && cos.length > 0 && !selectedCompanyId) setSelectedCompanyId(cos[0].id);
    } catch (e) { notify("Erro de conexão com o servidor", "error"); } finally { setIsLoading(false); }
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
        const { error } = await supabase.auth.signUp({ 
          email: form.email.trim().toLowerCase(), 
          password: form.password,
          options: {
            data: { full_name: form.name.toUpperCase() }
          }
        });
        if (error) throw error;
      }

      await dbSave('profiles', {
        id: editingId || undefined,
        full_name: form.name.toUpperCase(),
        email: form.email.toLowerCase(),
        role: form.role,
        companyId: form.role === UserRole.MASTER ? null : form.companyId,
        permissions: form.permissions,
        status: 'ativo'
      });
      
      notify(editingId ? "Perfil atualizado" : "Nova credencial criada");
      setShowForm(false);
      fetchData();
    } catch (e: any) { notify(e.message, "error"); } finally { setIsLoading(false); }
  };

  const isMaster = state.currentUser?.role === UserRole.MASTER;
  const filteredProfiles = profiles.filter(p => !selectedCompanyId || p.company_id === selectedCompanyId || p.role === UserRole.MASTER);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Gestão de Acessos</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hierarquia e Segurança de Dados</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({...form, companyId: selectedCompanyId, password: ''}); setShowForm(true); }} className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-blue-600 transition-all active:scale-95">
           <UserPlus size={16} /> NOVO ACESSO
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {isMaster && (
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
            <div className="p-5 bg-slate-50 border-b flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest"><Globe size={14} className="text-blue-500"/> Unidades</div>
            <div className="flex-1 overflow-auto p-3 space-y-1">
               {companies.map(c => (
                 <button key={c.id} onClick={() => setSelectedCompanyId(c.id)} className={`w-full text-left p-4 rounded-2xl transition-all ${selectedCompanyId === c.id ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <p className="text-[10px] font-black uppercase truncate">{c.name}</p>
                    <p className="text-[8px] opacity-40 font-bold uppercase mt-1">ID: {c.id.slice(0,8)}</p>
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className={`bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col ${isMaster ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="p-6 border-b flex items-center justify-between bg-slate-50/20">
             <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <ShieldCheck size={18} className="text-emerald-500"/> Matriz de Permissões
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                <tr><th className="px-8 py-5">Nome</th><th className="px-8 py-5">E-mail</th><th className="px-8 py-5">Nível</th><th className="px-8 py-5 text-center">Configurar</th></tr>
              </thead>
              <tbody className="divide-y text-[11px] font-black uppercase text-slate-700">
                {filteredProfiles.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">Nenhum usuário nesta unidade</td></tr>
                ) : (
                  filteredProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">{p.full_name}</td>
                      <td className="px-8 py-5 lowercase font-normal">{p.email || '---'}</td>
                      <td className="px-8 py-5">
                         <span className={`px-4 py-1.5 rounded-xl text-[8px] tracking-widest text-white ${p.role === UserRole.MASTER ? 'bg-slate-900' : p.role === UserRole.ADMIN ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                           {p.role.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <button onClick={() => handleEdit(p)} className="text-slate-300 hover:text-blue-600 p-2 rounded-xl transition-all hover:bg-blue-50"><Edit2 size={16}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSave} className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh] border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-900">{editingId ? 'Editar Credencial' : 'Gerar Novo Acesso'}</h3>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-300"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome Completo</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all" placeholder="IDENTIFICAÇÃO DO USUÁRIO" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">E-mail</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:border-slate-900 transition-all" placeholder="usuario@feraservice.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>

                {!editingId && (
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Senha</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input required type={showPassword ? 'text' : 'password'} className="w-full bg-slate-50 border border-slate-200 pl-11 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="No mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                           {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nível</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value as any})}>
                        <option value={UserRole.OPERATIONAL}>OPERACIONAL</option>
                        <option value={UserRole.ADMIN}>GERENTE UNIDADE</option>
                        {state.currentUser?.role === UserRole.MASTER && <option value={UserRole.MASTER}>DIRETORIA MASTER</option>}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Unidade</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white disabled:opacity-50" value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})} disabled={form.role === UserRole.MASTER}>
                        <option value="">Selecione...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-3 pt-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Módulos Ativos</h4>
                   <div className="grid grid-cols-2 gap-2">
                      {Object.keys(form.permissions).map(k => (
                        <button key={k} type="button" onClick={() => setForm({...form, permissions: {...form.permissions, [k]: !form.permissions[k as keyof UserPermissions]}})} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${form.permissions[k as keyof UserPermissions] ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60 text-slate-400'}`}>
                           <span className="text-[9px] font-black uppercase">{k}</span>
                           {form.permissions[k as keyof UserPermissions] ? <CheckCircle2 size={16} className="text-emerald-500"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"/>}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SALVAR ACESSO
              </button>
           </form>
        </div>
      )}
    </div>
  );
};
export default Management;
