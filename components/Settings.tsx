
import React, { useState } from 'react';
import { AppState } from '../types';
// Added missing Save import from lucide-react
import { Target, Map, DollarSign, Package, Loader2, Plus, Trash2, Tag, Users, Calendar, Save } from 'lucide-react';
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
      notify("Lista atualizada");
    } catch (e: any) { 
      notify("Erro ao atualizar lista", "error"); 
    } finally { setIsLoading(false); }
  };

  const handleSaveGoal = async () => {
    const val = parseFloat(goalForm.value);
    if (!goalForm.month || isNaN(val)) return notify("Valor da meta inválido", "error");
    
    setIsLoading(true);
    try {
      // No Supabase, month_key + company_id é único (definido no SQL).
      // Buscamos o ID se já existir para fazer UPDATE em vez de INSERT direto se necessário.
      // O dbSave já trata isso se passarmos o ID.
      
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
      setGoalForm({...goalForm, value: ''});
      notify("Meta operacional atualizada!");
    } catch (e: any) { 
      console.error(e);
      notify("Erro ao sincronizar meta", "error"); 
    } finally { setIsLoading(false); }
  };

  const currentGoalDisplay = state.monthlyGoals[goalForm.month];

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão Estratégica</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações Base e Planejamento</p>
        </div>
      </header>

      {/* Planejamento de Metas */}
      <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl space-y-8 border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3"><Target size={24} className="text-emerald-400"/> Planejamento de Metas Mensais</h3>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-white/5 p-8 rounded-[32px] border border-white/10">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Calendar size={10}/> Mês de Referência</label>
               <input type="month" className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 transition-all text-white" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Indicador</label>
               <select className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-all text-white" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                  <option value="production">PRODUÇÃO (M²)</option>
                  <option value="revenue">FATURAMENTO (R$)</option>
                  <option value="finance">SALDO EM CAIXA (R$)</option>
                  <option value="inventory">ESTOQUE GERAL</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-1 block">Valor Alvo</label>
               <input type="number" className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 transition-all text-white" placeholder="0.00" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
            </div>
            <button onClick={handleSaveGoal} disabled={isLoading} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all hover:bg-emerald-400 flex items-center justify-center gap-2">
               {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={16}/>} 
               ATUALIZAR META
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Produção', val: `${currentGoalDisplay?.production.toLocaleString('pt-BR') || 0} m²`, color: 'text-blue-400' },
               { label: 'Receita', val: `R$ ${currentGoalDisplay?.revenue.toLocaleString('pt-BR') || 0}`, color: 'text-emerald-400' },
               { label: 'Saldo Caixa', val: `R$ ${currentGoalDisplay?.finance.toLocaleString('pt-BR') || 0}`, color: 'text-orange-400' },
               { label: 'Almoxarifado', val: `${currentGoalDisplay?.inventory || 0} itens`, color: 'text-purple-400' }
             ].map(i => (
               <div key={i.label} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">{i.label}</p>
                  <p className={`text-sm font-black ${i.color}`}>{i.val}</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financeiro */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-emerald-600 flex gap-2 items-center tracking-widest"><Tag size={16}/> Categorias Financeiras</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" placeholder="NOVA CATEGORIA..." value={newEntries.finance} onChange={e => setNewEntries({...newEntries, finance: e.target.value})} />
            <button onClick={() => handleUpdateList('finance', 'add', newEntries.finance)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 scrollbar-hide">
            {state.financeCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600 transition-all hover:border-emerald-200">
                {c} 
                <button onClick={() => handleUpdateList('finance', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Almoxarifado */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-blue-600 flex gap-2 items-center tracking-widest"><Package size={16}/> Categorias Materiais</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500" placeholder="NOVA..." value={newEntries.inventory} onChange={e => setNewEntries({...newEntries, inventory: e.target.value})} />
            <button onClick={() => handleUpdateList('inventory', 'add', newEntries.inventory)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 scrollbar-hide">
            {state.inventoryCategories.map(c => (
              <div key={c} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 uppercase text-slate-600 transition-all hover:border-blue-200">
                {c} 
                <button onClick={() => handleUpdateList('inventory', 'remove', c)} className="text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Cargos */}
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] space-y-5 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 flex gap-2 items-center tracking-widest"><Users size={16}/> Cargos Operacionais</h4>
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500" placeholder="NOVO CARGO..." value={newEntries.roles} onChange={e => setNewEntries({...newEntries, roles: e.target.value})} />
            <button onClick={() => handleUpdateList('roles', 'add', newEntries.roles)} disabled={isLoading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
               {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 scrollbar-hide">
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
