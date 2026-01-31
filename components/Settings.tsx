
import React, { useState } from 'react';
import { AppState, ServiceType } from '../types';
import { Target, ListTree, Plus, Trash2, Database, RefreshCw, DollarSign } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Settings: React.FC<SettingsProps> = ({ state, setState }) => {
  const [newCategory, setNewCategory] = useState('');
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<{ isOpen: boolean; monthKey: string } | null>(null);
  const [showCloudResetConfirm, setShowCloudResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [goalForm, setGoalForm] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    production: '',
    revenue: ''
  });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleSaveMonthlyGoal = async () => {
    const prod = parseFloat(goalForm.production);
    const rev = parseFloat(goalForm.revenue);
    
    if (!goalForm.month || isNaN(prod) || isNaN(rev)) return;

    setIsLoading(true);
    try {
      await dbSave('monthly_goals', {
        company_id: state.currentUser?.companyId,
        month_key: goalForm.month,
        production_goal: prod,
        revenue_goal: rev
      });
      await refreshData();
      setGoalForm({ ...goalForm, production: '', revenue: '' });
    } catch (e: any) {
      alert("Erro ao salvar meta: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedMonthKeys = Object.keys(state.monthlyGoals).sort().reverse();

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Configurações Operacionais</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Metas e Parâmetros Cloud</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3 text-emerald-600">
                  <Target size={20} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Metas por Período</h3>
               </div>
            </div>
            
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mês/Ano</label>
                     <input type="month" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Meta Prod. (m²)</label>
                     <input type="number" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" value={goalForm.production} onChange={e => setGoalForm({...goalForm, production: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Meta Fat. (R$)</label>
                     <input type="number" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" value={goalForm.revenue} onChange={e => setGoalForm({...goalForm, revenue: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                     <button disabled={isLoading} onClick={handleSaveMonthlyGoal} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all">
                       {isLoading ? '...' : 'Salvar'}
                     </button>
                  </div>
               </div>

               <div className="space-y-3">
                  {sortedMonthKeys.map(key => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px]">{key.split('-').reverse().join('/')}</div>
                          <div className="grid grid-cols-2 gap-6">
                             <div><p className="text-[8px] font-black text-slate-400 uppercase">Produção</p><p className="text-xs font-black">{state.monthlyGoals[key].production.toLocaleString('pt-BR')} m²</p></div>
                             <div><p className="text-[8px] font-black text-slate-400 uppercase">Faturamento</p><p className="text-xs font-black text-emerald-600">R$ {state.monthlyGoals[key].revenue.toLocaleString('pt-BR')}</p></div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
