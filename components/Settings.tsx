
import React, { useState, useEffect } from 'react';
import { AppState, ServiceType } from '../types';
import { Target, Map, DollarSign, Package, Loader2, Plus, Trash2, Tag, Users, Calendar, Save, Activity, CreditCard, CheckCircle } from 'lucide-react';
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

  // Estado local para a tabela de preços
  const [localRates, setLocalRates] = useState<Record<string, number>>(state.serviceRates);

  useEffect(() => {
    setLocalRates(state.serviceRates);
  }, [state.serviceRates]);

  const refreshData = async () => {
    if (state.currentUser?.companyId || state.currentUser?.role === 'DIRETORIA_MASTER') {
      const data = await fetchCompleteCompanyData(state.currentUser?.companyId || null, state.currentUser?.role === 'DIRETORIA_MASTER');
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleUpdateList = async (listKey: 'finance' | 'inventory' | 'roles', action: 'add' | 'remove', value: string) => {
    if (action === 'add' && !value.trim()) return;
    if (!state.currentUser?.companyId) return notify("Erro: Empresa não identificada", "error");

    setIsLoading(true);
    try {
      let updatedList: string[] = [];
      let dbField = '';
      
      if (listKey === 'finance') {
        dbField = 'finance_categories';
        updatedList = action === 'add' 
          ? [...state.financeCategories, value.trim()] 
          : state.financeCategories.filter(i => i !== value);
      } else if (listKey === 'inventory') {
        dbField = 'inventory_categories';
        updatedList = action === 'add' 
          ? [...state.inventoryCategories, value.trim()] 
          : state.inventoryCategories.filter(i => i !== value);
      } else {
        dbField = 'employee_roles';
        updatedList = action === 'add' 
          ? [...state.employeeRoles, value.trim()] 
          : state.employeeRoles.filter(i => i !== value);
      }

      await dbSave('companies', {
        id: state.currentUser.companyId,
        [dbField]: updatedList
      });

      await refreshData();
      setNewEntries({ ...newEntries, [listKey]: '' });
      notify("Lista corporativa atualizada!");
    } catch (e: any) { 
      notify("Erro ao atualizar parâmetros", "error"); 
    } finally { setIsLoading(false); }
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
        inventory_goal: existing.inventory,
        balance_goal: existing.finance
      });
      
      await refreshData();
      setGoalForm({...goalForm, value: ''});
      notify("Meta operacional atualizada!");
    } catch (e: any) { 
      console.error(e);
      notify("Erro ao sincronizar meta", "error"); 
    } finally { setIsLoading(false); }
  };

  const handleSaveRates = async () => {
    if (!state.currentUser?.companyId) return;
    setIsLoading(true);
    try {
      await dbSave('companies', {
        id: state.currentUser.companyId,
        service_rates: localRates
      });
      await refreshData();
      notify("Tabela de preços atualizada com sucesso!", "success");
    } catch (e) {
      notify("Erro ao salvar tabela de preços", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const currentGoalDisplay = state.monthlyGoals[goalForm.month];

  const getUnit = () => {
    if (goalForm.type === 'revenue') return 'R$';
    return goalForm.serviceType.includes('KM') ? 'KM' : 'm²';
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão Estratégica</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações Base e Planejamento Operacional</p>
        </div>
      </header>

      {/* Planejamento de Metas */}
      <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl space-y-8 border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3"><Target size={24} className="text-emerald-400"/> Monitoramento de Desempenho Mensal</h3>
            <span className="bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">Metas Reais de Campo</span>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-white/5 p-8 rounded-[32px] border border-white/10">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Calendar size={10}/> Mês Alvo</label>
               <input type="month" className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 transition-all text-white" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">KPI / Indicador</label>
               <select className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-all text-white" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                  <option value="production">PRODUÇÃO (VOLUMETRIA)</option>
                  <option value="revenue">FATURAMENTO (R$)</option>
               </select>
            </div>
            
            {goalForm.type === 'production' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Tipo de Serviço</label>
                <select className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-white" value={goalForm.serviceType} onChange={e => setGoalForm({...goalForm, serviceType: e.target.value as ServiceType})}>
                   {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Valor Alvo ({getUnit()})</label>
               <input type="number" className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 transition-all text-white" placeholder="0.00" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
            </div>
            <button onClick={handleSaveGoal} disabled={isLoading} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all hover:bg-emerald-400 flex items-center justify-center gap-2">
               {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={16}/>} 
               SINCRONIZAR META
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               { label: 'Meta de Produção Projetada', val: `${currentGoalDisplay?.production.toLocaleString('pt-BR') || 0} m²/KM`, color: 'text-blue-400', icon: Activity },
               { label: 'Meta de Faturamento Projetada', val: `R$ ${currentGoalDisplay?.revenue.toLocaleString('pt-BR') || 0}`, color: 'text-emerald-400', icon: DollarSign }
             ].map(i => (
               <div key={i.label} className="bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${i.color}`}><i.icon size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">{i.label}</p>
                    <p className={`text-xl font-black ${i.color}`}>{i.val}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Tabela de Preços de Produção */}
      <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><CreditCard size={24}/></div>
             <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Tabela de Preços por Unidade</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuração de valores para faturamento de O.S.</p>
             </div>
          </div>
          <button 
            onClick={handleSaveRates} 
            disabled={isLoading} 
            className="w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-blue-600"
          >
             {isLoading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
             SALVAR TABELA DE VALORES
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICE_OPTIONS.map(service => (
            <div key={service} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4 transition-all hover:shadow-md group">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{service}</span>
                  <span className="text-[8px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-100 group-hover:border-blue-200">{service.includes('KM') ? 'VALOR POR KM' : 'VALOR POR m²'}</span>
               </div>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-white border border-slate-200 pl-11 p-4 rounded-2xl text-xs font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={localRates[service] || 0}
                    onChange={e => setLocalRates({...localRates, [service]: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financeiro */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 flex gap-2 items-center tracking-widest"><Tag size={16}/> Categorias de Fluxo</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" placeholder="NOVO..." value={newEntries.finance} onChange={e => setNewEntries({...newEntries, finance: e.target.value})} />
            <button onClick={() => handleUpdateList('finance', 'add', newEntries.finance)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pt-2">
            {state.financeCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600 transition-all hover:border-emerald-200">
                {c} 
                <button onClick={() => handleUpdateList('finance', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Almoxarifado */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-blue-600 flex gap-2 items-center tracking-widest"><Package size={16}/> Categorias Estoque</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500" placeholder="NOVA..." value={newEntries.inventory} onChange={e => setNewEntries({...newEntries, inventory: e.target.value})} />
            <button onClick={() => handleUpdateList('inventory', 'add', newEntries.inventory)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pt-2">
            {state.inventoryCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600 transition-all hover:border-blue-200">
                {c} 
                <button onClick={() => handleUpdateList('inventory', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Cargos */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 flex gap-2 items-center tracking-widest"><Users size={16}/> Cargos da Unidade</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500" placeholder="NOVO..." value={newEntries.roles} onChange={e => setNewEntries({...newEntries, roles: e.target.value})} />
            <button onClick={() => handleUpdateList('roles', 'add', newEntries.roles)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pt-2">
            {state.employeeRoles.map(r => (
              <div key={r} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600 transition-all hover:border-indigo-200">
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
