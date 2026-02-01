
import React, { useState } from 'react';
import { AppState } from '../types';
import { Target, Map, DollarSign, Package, Wallet, Loader2 } from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ state, setState, notify }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [goalForm, setGoalForm] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: 'production' as 'production' | 'revenue' | 'inventory' | 'finance',
    value: ''
  });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleSaveMonthlyGoal = async () => {
    const val = parseFloat(goalForm.value);
    if (!goalForm.month || isNaN(val)) return notify("Valor inválido", "error");

    setIsLoading(true);
    try {
      // Buscar se já existe meta para este mês para não zerar os outros campos
      const existing = state.monthlyGoals[goalForm.month] || { production: 0, revenue: 0, inventory: 0, finance: 0 };
      
      const payload: any = {
        companyId: state.currentUser?.companyId,
        monthKey: goalForm.month,
        // Atualiza apenas o campo selecionado, mantém os outros
        productionGoal: goalForm.type === 'production' ? val : (existing.production || 0),
        revenueGoal: goalForm.type === 'revenue' ? val : (existing.revenue || 0),
        inventoryGoal: goalForm.type === 'inventory' ? val : (existing.inventory || 0),
        balanceGoal: goalForm.type === 'finance' ? val : (existing.finance || 0)
      };

      console.log("Salvando Meta:", payload);
      await dbSave('monthly_goals', payload);
      await refreshData();
      
      setGoalForm({ ...goalForm, value: '' });
      notify(`Meta de ${goalForm.type.toUpperCase()} definida!`);
    } catch (e: any) {
      console.error(e);
      notify("Erro ao sincronizar meta", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const sortedMonthKeys = Object.keys(state.monthlyGoals).sort().reverse();

  return (
    <div className="space-y-6 pb-24">
      <header><h2 className="text-xl font-black text-slate-900 uppercase">Configurações Operacionais</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Metas e Planejamento Cloud</p></header>

      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-3 text-emerald-600"><Target size={20} /><h3 className="text-[10px] font-black uppercase tracking-widest">Painel de Planejamento Estratégico</h3></div>
        </div>
        
        <div className="p-8">
           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 ml-1">Mês de Referência</label>
                <input type="month" className="w-full bg-white border p-4 rounded-2xl text-xs font-black outline-none focus:border-slate-900" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 ml-1">Tipo da Meta</label>
                <select className="w-full bg-white border p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-slate-900" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value as any})}>
                   <option value="production">PRODUÇÃO (M²)</option>
                   <option value="revenue">FATURAMENTO (R$)</option>
                   <option value="inventory">LIMITE ESTOQUE (UN)</option>
                   <option value="finance">SALDO CAIXA (R$)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 ml-1">Valor Alvo</label>
                <input type="number" className="w-full bg-white border p-4 rounded-2xl text-xs font-black outline-none focus:border-slate-900" placeholder="0.00" value={goalForm.value} onChange={e => setGoalForm({...goalForm, value: e.target.value})} />
              </div>
              <button disabled={isLoading} onClick={handleSaveMonthlyGoal} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                 {isLoading ? <Loader2 size={16} className="animate-spin"/> : 'DEFINIR META NO CLOUD'}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedMonthKeys.length === 0 ? (
                <div className="col-span-2 text-center p-10 opacity-20"><Target size={30} className="mx-auto mb-2" /><p className="text-[9px] font-black uppercase">Nenhuma meta configurada</p></div>
              ) : (
                sortedMonthKeys.map(key => (
                  <div key={key} className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:border-emerald-500 transition-all group">
                     <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                          {key.split('-')[1]}/{key.split('-')[0].slice(2)}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-900">Mês de Competência</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{key}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-blue-600 font-black text-[8px] uppercase tracking-tighter"><Map size={10}/> Produção</div>
                          <p className="text-sm font-black text-slate-800">{state.monthlyGoals[key].production?.toLocaleString() || 0} m²</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-emerald-600 font-black text-[8px] uppercase tracking-tighter"><DollarSign size={10}/> Receita</div>
                          <p className="text-sm font-black text-slate-800">R$ {state.monthlyGoals[key].revenue?.toLocaleString() || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-rose-600 font-black text-[8px] uppercase tracking-tighter"><Package size={10}/> Estoque</div>
                          <p className="text-sm font-black text-slate-800">{state.monthlyGoals[key].inventory?.toLocaleString() || 0} un</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-900 font-black text-[8px] uppercase tracking-tighter"><Wallet size={10}/> Saldo</div>
                          <p className="text-sm font-black text-slate-800">R$ {state.monthlyGoals[key].finance?.toLocaleString() || 0}</p>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
