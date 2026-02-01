
import React, { useState } from 'react';
import { AppState } from '../types';
import { Target, Map, DollarSign, Package, Loader2, Plus, Trash2, Tag, Users } from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';

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
    type: 'production' as 'production' | 'revenue' | 'inventory' | 'finance',
    value: ''
  });

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
        dbField = 'financeCategories';
        updatedList = action === 'add' 
          ? [...state.financeCategories, value.trim()] 
          : state.financeCategories.filter(i => i !== value);
      } else if (listKey === 'inventory') {
        dbField = 'inventoryCategories';
        updatedList = action === 'add' 
          ? [...state.inventoryCategories, value.trim()] 
          : state.inventoryCategories.filter(i => i !== value);
      } else {
        dbField = 'employeeRoles';
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
      notify("Lista atualizada com sucesso");
    } catch (e: any) { 
      console.error(e);
      notify("Erro ao atualizar lista no servidor", "error"); 
    } finally { setIsLoading(false); }
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
        inventoryGoal: goalForm.type === 'inventory' ? val : existing.inventory,
        balanceGoal: goalForm.type === 'finance' ? val : existing.finance
      });
      await refreshData();
      notify("Meta atualizada");
    } catch (e: any) { notify("Erro ao sincronizar meta", "error"); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Gestão de Tabelas Base</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações de Listas e Metas Mensais</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financeiro */}
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] space-y-4 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 flex gap-2 items-center"><Tag size={14}/> Categorias Financeiras</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" placeholder="Nova..." value={newEntries.finance} onChange={e => setNewEntries({...newEntries, finance: e.target.value})} />
            <button onClick={() => handleUpdateList('finance', 'add', newEntries.finance)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pt-2 scrollbar-hide">
            {state.financeCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {c} 
                <button onClick={() => handleUpdateList('finance', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Almoxarifado */}
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] space-y-4 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-blue-600 flex gap-2 items-center"><Package size={14}/> Categorias Almoxarifado</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500" placeholder="Nova..." value={newEntries.inventory} onChange={e => setNewEntries({...newEntries, inventory: e.target.value})} />
            <button onClick={() => handleUpdateList('inventory', 'add', newEntries.inventory)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-all">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pt-2 scrollbar-hide">
            {state.inventoryCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {c} 
                <button onClick={() => handleUpdateList('inventory', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Cargos */}
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] space-y-4 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 flex gap-2 items-center"><Users size={14}/> Cargos Operacionais</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500" placeholder="Novo..." value={newEntries.roles} onChange={e => setNewEntries({...newEntries, roles: e.target.value})} />
            <button onClick={() => handleUpdateList('roles', 'add', newEntries.roles)} disabled={isLoading} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 transition-all">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pt-2 scrollbar-hide">
            {state.employeeRoles.map(r => (
              <div key={r} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[8px] font-black flex items-center gap-2 uppercase text-slate-600">
                {r} 
                <button onClick={() => handleUpdateList('roles', 'remove', r)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planejamento de Metas */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
        <h3 className="font-black text-xs uppercase flex items-center gap-2"><Target size={22} className="text-slate-900"/> Planejamento de Metas Globais</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-[24px] border border-slate-100">
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mês Referência</label>
             <input type="month" className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:border-slate-900" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tipo de Indicador</label>
             <select className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-slate-900" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                <option value="production">PRODUÇÃO (M²)</option>
                <option value="revenue">FATURAMENTO (R$)</option>
                <option value="finance">SALDO CAIXA (R$)</option>
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor do Alvo</label>
             <input type="number" className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:border-slate-900" placeholder="VALOR NUMÉRICO" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
          </div>
          <button onClick={handleSaveGoal} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all hover:bg-emerald-600">
             {isLoading ? <Loader2 className="animate-spin mx-auto" size={18}/> : 'DEFINIR META CLOUD'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Settings;
