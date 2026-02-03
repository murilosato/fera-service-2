
import React, { useState, useEffect } from 'react';
import { AppState, ServiceType } from '../types';
import { Target, Map, DollarSign, Package, Loader2, Plus, Trash2, Tag, Users, Calendar, Save, Activity, CreditCard, CheckCircle, X } from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';
import { SERVICE_OPTIONS } from '../constants';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ state, setState, notify }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newEntries, setNewEntries] = useState({ finance: '', inventory: '', roles: '' });
  
  const [goalForm, setGoalForm] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: 'production' as 'production' | 'revenue',
    serviceType: ServiceType.ROCADA_MECANIZADA_M2,
    value: ''
  });

  const [localRates, setLocalRates] = useState<Record<string, number>>(state.serviceRates);

  useEffect(() => {
    setLocalRates(state.serviceRates);
  }, [state.serviceRates]);

  const refreshData = async () => {
    const targetId = state.currentUser?.companyId;
    if (targetId) {
      const data = await fetchCompleteCompanyData(targetId, state.currentUser?.role === 'DIRETORIA_MASTER');
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleUpdateList = async (listKey: 'finance' | 'inventory' | 'roles', action: 'add' | 'remove', value: string) => {
    const companyId = state.currentUser?.companyId;
    if (!companyId) return notify("Erro: Empresa não identificada", "error");

    const trimmedValue = value.trim().toUpperCase();
    if (action === 'add' && !trimmedValue) return;

    setIsLoading(true);

    try {
      let dbField = '';
      let stateKey: keyof AppState;

      if (listKey === 'finance') {
        dbField = 'finance_categories';
        stateKey = 'financeCategories';
      } else if (listKey === 'inventory') {
        dbField = 'inventory_categories';
        stateKey = 'inventoryCategories';
      } else {
        dbField = 'employee_roles';
        stateKey = 'employeeRoles';
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

      // Salva no banco de dados usando o nome da coluna em snake_case
      await dbSave('companies', {
        id: companyId,
        [dbField]: updatedList
      });

      // Atualiza o estado local
      setState(prev => ({ ...prev, [stateKey]: updatedList }));

      if (action === 'add') {
        setNewEntries(prev => ({ ...prev, [listKey]: '' }));
      }

      notify(action === 'add' ? "Parâmetro adicionado" : "Parâmetro removido");
    } catch (e: any) {
      console.error(e);
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
        company_id: state.currentUser?.companyId,
        month_key: goalForm.month,
        production_goal: goalForm.type === 'production' ? val : existing.production,
        revenue_goal: goalForm.type === 'revenue' ? val : existing.revenue,
      });
      await refreshData();
      setGoalForm({...goalForm, value: ''});
      notify("Meta mensal atualizada!");
    } catch (e) { notify("Erro ao salvar meta", "error"); } finally { setIsLoading(false); }
  };

  const handleSaveRates = async () => {
    if (!state.currentUser?.companyId) return;
    setIsLoading(true);
    try {
      await dbSave('companies', { id: state.currentUser.companyId, service_rates: localRates });
      await refreshData();
      notify("Tabela de preços salva!");
    } catch (e) { notify("Erro ao salvar preços", "error"); } finally { setIsLoading(false); }
  };

  const currentGoalDisplay = state.monthlyGoals[goalForm.month];

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurações Gerais</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Definição de Parâmetros e Metas</p>
      </header>

      {/* Metas */}
      <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl space-y-8 border border-white/5">
          <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3"><Target size={24} className="text-emerald-400"/> Planejamento Mensal</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-white/5 p-6 rounded-[32px]">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Mês</label>
               <input type="month" className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 text-white" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Indicador</label>
               <select className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500 text-white" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                  <option value="production">PRODUÇÃO</option>
                  <option value="revenue">FATURAMENTO</option>
               </select>
            </div>
            {goalForm.type === 'production' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Serviço</label>
                <select className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-[10px] font-black uppercase outline-none text-white" value={goalForm.serviceType} onChange={e => setGoalForm({...goalForm, serviceType: e.target.value as ServiceType})}>
                   {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Valor Alvo</label>
               <input type="number" className="w-full bg-slate-800 border border-white/10 p-3.5 rounded-2xl text-xs font-black outline-none text-white" placeholder="0.00" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
            </div>
            <button onClick={handleSaveGoal} disabled={isLoading} className="w-full bg-emerald-500 text-slate-900 py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
               {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SALVAR META
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-blue-400"><Activity size={24}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Produção Alvo</p>
                  <p className="text-xl font-black text-blue-400">{currentGoalDisplay?.production.toLocaleString('pt-BR') || 0} m²/KM</p>
                </div>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-emerald-400"><DollarSign size={24}/></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Receita Alvo</p>
                  <p className="text-xl font-black text-emerald-400">R$ {currentGoalDisplay?.revenue.toLocaleString('pt-BR') || 0}</p>
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 flex gap-2 items-center tracking-widest"><Tag size={16}/> Categorias de Fluxo</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" placeholder="NOVO..." value={newEntries.finance} onChange={e => setNewEntries({...newEntries, finance: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('finance', 'add', newEntries.finance)} />
            <button onClick={() => handleUpdateList('finance', 'add', newEntries.finance)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {(state.financeCategories || []).map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600">
                {c} 
                <button onClick={() => handleUpdateList('finance', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-blue-600 flex gap-2 items-center tracking-widest"><Package size={16}/> Categorias Estoque</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" placeholder="NOVA..." value={newEntries.inventory} onChange={e => setNewEntries({...newEntries, inventory: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('inventory', 'add', newEntries.inventory)} />
            <button onClick={() => handleUpdateList('inventory', 'add', newEntries.inventory)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {(state.inventoryCategories || []).map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600">
                {c} 
                <button onClick={() => handleUpdateList('inventory', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 flex gap-2 items-center tracking-widest"><Users size={16}/> Cargos Unidade</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" placeholder="NOVO..." value={newEntries.roles} onChange={e => setNewEntries({...newEntries, roles: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleUpdateList('roles', 'add', newEntries.roles)} />
            <button onClick={() => handleUpdateList('roles', 'add', newEntries.roles)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {(state.employeeRoles || []).map(r => (
              <div key={r} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600">
                {r} 
                <button onClick={() => handleUpdateList('roles', 'remove', r)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
