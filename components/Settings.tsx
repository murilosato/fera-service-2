
import React, { useState, useEffect } from 'react';
import { AppState, ServiceType } from '../types';
import { Target, Map, DollarSign, Package, Loader2, Plus, Trash2, Tag, Users, Calendar, Save, Activity, CreditCard, CheckCircle, X, Building, Globe, MapPin, Phone, Mail, Users2 } from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';
import { SERVICE_OPTIONS } from '../constants';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ state, setState, notify }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newEntries, setNewEntries] = useState({ finance: '', inventory: '', roles: '', teams: '' });
  
  const [companyForm, setCompanyForm] = useState({
    name: state.company?.name || '',
    cnpj: state.company?.cnpj || '',
    phone: state.company?.phone || '',
    address: state.company?.address || '',
    email: state.company?.email || '',
    website: state.company?.website || ''
  });

  const [goalForm, setGoalForm] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: 'production' as 'production' | 'revenue',
    serviceType: ServiceType.ROCADA_MECANIZADA_M2,
    value: ''
  });

  const [localRates, setLocalRates] = useState<Record<string, number>>(state.serviceRates);
  const [localServiceGoals, setLocalServiceGoals] = useState<Record<string, number>>(state.serviceGoals);

  useEffect(() => {
    setLocalRates(state.serviceRates);
    setLocalServiceGoals(state.serviceGoals);
    if (state.company) {
      setCompanyForm({
        name: state.company.name || '',
        cnpj: state.company.cnpj || '',
        phone: state.company.phone || '',
        address: state.company.address || '',
        email: state.company.email || '',
        website: state.company.website || ''
      });
    }
  }, [state.serviceRates, state.serviceGoals, state.company]);

  const refreshData = async () => {
    const targetId = state.currentUser?.companyId;
    if (targetId) {
      const data = await fetchCompleteCompanyData(targetId, state.currentUser?.role === 'DIRETORIA_MASTER');
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleUpdateCompany = async () => {
    if (!state.currentUser?.companyId) return;
    setIsLoading(true);
    try {
      await dbSave('companies', { 
        id: state.currentUser.companyId, 
        ...companyForm 
      });
      await refreshData();
      notify("Dados da empresa atualizados!");
    } catch (e) {
      notify("Erro ao salvar dados da empresa", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRatesAndGoals = async () => {
    if (!state.currentUser?.companyId) return;
    setIsLoading(true);
    try {
      await dbSave('companies', {
        id: state.currentUser.companyId,
        serviceRates: localRates,
        serviceGoals: localServiceGoals
      });
      await refreshData();
      notify("Valores técnicos e metas atualizados!");
    } catch (e) {
      notify("Erro ao salvar configurações técnicas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateList = async (listKey: 'finance' | 'inventory' | 'roles' | 'teams', action: 'add' | 'remove', value: string) => {
    const companyId = state.currentUser?.companyId;
    if (!companyId) return notify("Erro: Empresa não identificada", "error");

    const trimmedValue = value.trim().toUpperCase();
    if (action === 'add' && !trimmedValue) return;

    setIsLoading(true);

    try {
      let dbField = '';
      let stateKey: keyof AppState;

      if (listKey === 'finance') {
        dbField = 'financeCategories';
        stateKey = 'financeCategories';
      } else if (listKey === 'inventory') {
        dbField = 'inventoryCategories';
        stateKey = 'inventoryCategories';
      } else if (listKey === 'roles') {
        dbField = 'employeeRoles';
        stateKey = 'employeeRoles';
      } else {
        dbField = 'teams';
        stateKey = 'teams';
      }

      const currentList = (state[stateKey] as string[]) || [];
      let updatedList: string[] = [];

      if (action === 'add') {
        if (currentList.some(item => item.toUpperCase() === trimmedValue)) {
          setIsLoading(false);
          return notify("Item já cadastrado", "error");
        }
        updatedList = [...currentList, trimmedValue];
      } else {
        updatedList = currentList.filter(item => item.toUpperCase() !== trimmedValue);
      }

      await dbSave('companies', {
        id: companyId,
        [dbField]: updatedList
      });

      setState(prev => ({ ...prev, [stateKey]: updatedList }));

      if (action === 'add') {
        setNewEntries(prev => ({ ...prev, [listKey]: '' }));
      }

      notify(action === 'add' ? "Parâmetro adicionado" : "Parâmetro removido");
    } catch (e: any) {
      notify("Erro ao atualizar configurações", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    const val = parseFloat(goalForm.value);
    if (!goalForm.month || isNaN(val)) return notify("Valor da meta inválido", "error");
    setIsLoading(true);
    try {
      const existing = state.monthlyGoals[goalForm.month] || { production: 0, revenue: 0, inventory: 0, finance: 0 };
      await dbSave('monthly_goals', {
        companyId: state.currentUser?.companyId,
        monthKey: goalForm.month,
        productionGoal: goalForm.type === 'production' ? val : existing.production,
        revenueGoal: goalForm.type === 'revenue' ? val : existing.revenue,
      });
      await refreshData();
      setGoalForm({...goalForm, value: ''});
      notify("Meta mensal atualizada!");
    } catch (e) { notify("Erro ao salvar meta", "error"); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurações Gerais</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Definição de Parâmetros e Identidade</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm space-y-6">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900">
            <Building size={20} className="text-blue-500"/> Identidade da Unidade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Razão Social</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="NOME DA EMPRESA" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">CNPJ</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:border-slate-900" placeholder="00.000.000/0001-00" value={companyForm.cnpj} onChange={e => setCompanyForm({...companyForm, cnpj: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Telefone de Contato</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:border-slate-900" placeholder="(00) 00000-0000" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Site / Website</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:border-slate-900" placeholder="WWW.EMPRESA.COM.BR" value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} />
             </div>
             <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Endereço Completo</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="RUA, NÚMERO, BAIRRO, CIDADE - UF" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} />
             </div>
          </div>
          <button onClick={handleUpdateCompany} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
             {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} ATUALIZAR DADOS EMPRESARIAIS
          </button>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm space-y-6">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-slate-900">
            <DollarSign size={20} className="text-emerald-500"/> Configuração de Metas e Preços
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black uppercase text-slate-400 border-b">
                  <th className="py-2">Serviço</th>
                  <th className="py-2 text-right">V. Unitário (R$)</th>
                  <th className="py-2 text-right">Meta Técnica (m²/KM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(localRates).map((serviceType) => (
                  <tr key={serviceType}>
                    <td className="py-3 text-[9px] font-black uppercase text-slate-600 truncate max-w-[120px]" title={serviceType}>
                      {serviceType}
                    </td>
                    <td className="py-2 text-right">
                      <input type="number" step="0.01" className="w-20 bg-slate-50 border border-slate-100 p-2 rounded-xl text-[10px] font-black text-right outline-none focus:bg-white" value={localRates[serviceType]} onChange={e => setLocalRates({...localRates, [serviceType]: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="py-2 text-right">
                      <input type="number" step="1" className="w-24 bg-slate-50 border border-slate-100 p-2 rounded-xl text-[10px] font-black text-right outline-none focus:bg-white" placeholder="Meta..." value={localServiceGoals[serviceType] || 0} onChange={e => setLocalServiceGoals({...localServiceGoals, [serviceType]: parseFloat(e.target.value) || 0})} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleUpdateRatesAndGoals} disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
             {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SALVAR PARÂMETROS TÉCNICOS
          </button>
        </div>

        <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl space-y-6 border border-white/5 lg:col-span-2">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3"><Target size={24} className="text-emerald-400"/> Planejamento Geral Mensal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Mês</label>
                 <input type="month" className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 text-white" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Tipo de Meta</label>
                 <select className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-xs font-black outline-none text-white" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                   <option value="production">PRODUÇÃO TOTAL (M²)</option>
                   <option value="revenue">FATURAMENTO TOTAL (R$)</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Valor Alvo</label>
                 <input type="number" className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-xs font-black outline-none text-white" placeholder="0.00" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
              </div>
            </div>
            <button onClick={handleSaveGoal} disabled={isLoading} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
               {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SALVAR META MENSAL
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-[40px] space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 flex gap-2 items-center tracking-widest"><Tag size={16}/> Categorias de Fluxo</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10px] font-black uppercase outline-none" placeholder="NOVO..." value={newEntries.finance} onChange={e => setNewEntries({...newEntries, finance: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('finance', 'add', newEntries.finance)} />
            <button onClick={() => handleUpdateList('finance', 'add', newEntries.finance)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-2xl"><Plus size={16}/></button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {state.financeCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {c} <button onClick={() => handleUpdateList('finance', 'remove', c)}><Trash2 size={12} className="text-slate-300 hover:text-rose-600"/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-[40px] space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-blue-600 flex gap-2 items-center tracking-widest"><Package size={16}/> Categorias Estoque</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10px] font-black uppercase outline-none" placeholder="NOVA..." value={newEntries.inventory} onChange={e => setNewEntries({...newEntries, inventory: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('inventory', 'add', newEntries.inventory)} />
            <button onClick={() => handleUpdateList('inventory', 'add', newEntries.inventory)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-2xl"><Plus size={16}/></button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {state.inventoryCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {c} <button onClick={() => handleUpdateList('inventory', 'remove', c)}><Trash2 size={12} className="text-slate-300 hover:text-rose-600"/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-[40px] space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 flex gap-2 items-center tracking-widest"><Users size={16}/> Cargos Unidade</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10px] font-black uppercase outline-none" placeholder="NOVO..." value={newEntries.roles} onChange={e => setNewEntries({...newEntries, roles: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('roles', 'add', newEntries.roles)} />
            <button onClick={() => handleUpdateList('roles', 'add', newEntries.roles)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-2xl"><Plus size={16}/></button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {state.employeeRoles.map(r => (
              <div key={r} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {r} <button onClick={() => handleUpdateList('roles', 'remove', r)}><Trash2 size={12} className="text-slate-300 hover:text-rose-600"/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-[40px] space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-rose-600 flex gap-2 items-center tracking-widest"><Users2 size={16}/> Equipes (Encarregados)</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10px] font-black uppercase outline-none" placeholder="NOVO ENCARREGADO..." value={newEntries.teams} onChange={e => setNewEntries({...newEntries, teams: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('teams', 'add', newEntries.teams)} />
            <button onClick={() => handleUpdateList('teams', 'add', newEntries.teams)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-2xl"><Plus size={16}/></button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {state.teams.map(t => (
              <div key={t} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {t} <button onClick={() => handleUpdateList('teams', 'remove', t)}><Trash2 size={12} className="text-slate-300 hover:text-rose-600"/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
