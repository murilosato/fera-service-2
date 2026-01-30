
import React, { useState } from 'react';
import { AppState, ServiceType } from '../types';
import { Save, Info, Target, ListTree, Plus, Trash2, ShieldCheck, DollarSign, Calendar, ChevronRight, Database, RefreshCw } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Settings: React.FC<SettingsProps> = ({ state, setState }) => {
  const [newCategory, setNewCategory] = useState('');
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<{ isOpen: boolean; monthKey: string } | null>(null);
  const [showCloudResetConfirm, setShowCloudResetConfirm] = useState(false);
  
  const [goalForm, setGoalForm] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    production: '',
    revenue: ''
  });

  const updateRate = (type: ServiceType, val: number) => {
    setState(prev => ({ ...prev, serviceRates: { ...prev.serviceRates, [type]: val } }));
  };

  const addCategory = () => {
    if(!newCategory.trim()) return;
    setState(prev => ({ ...prev, financeCategories: [...prev.financeCategories, newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setState(prev => ({ ...prev, financeCategories: prev.financeCategories.filter(c => c !== cat) }));
  };

  const handleSaveMonthlyGoal = () => {
    const prod = parseFloat(goalForm.production);
    const rev = parseFloat(goalForm.revenue);
    
    if (!goalForm.month || isNaN(prod) || isNaN(rev)) return;

    setState(prev => ({
      ...prev,
      monthlyGoals: {
        ...prev.monthlyGoals,
        [goalForm.month]: { production: prod, revenue: rev }
      }
    }));
    
    setGoalForm({ ...goalForm, production: '', revenue: '' });
  };

  const performDeleteGoal = () => {
    if (!confirmDeleteGoal) return;
    const { monthKey } = confirmDeleteGoal;
    setState(prev => {
      const newGoals = { ...prev.monthlyGoals };
      delete newGoals[monthKey];
      return { ...prev, monthlyGoals: newGoals };
    });
  };

  const handleResetCloud = () => {
    localStorage.removeItem('FERA_SUPABASE_URL');
    localStorage.removeItem('FERA_SUPABASE_ANON_KEY');
    window.location.reload();
  };

  const sortedMonthKeys = Object.keys(state.monthlyGoals).sort().reverse();

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurações Operacionais</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Personalização de Parâmetros e Objetivos Temporais</p>
        </div>
        
        <button 
          onClick={() => setShowCloudResetConfirm(true)}
          className="flex items-center gap-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
        >
          <Database size={14} /> Gerenciar Cloud
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3 text-emerald-600">
                  <Target size={20} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Metas por Período (Mês/Ano)</h3>
               </div>
            </div>
            
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mês/Ano</label>
                     <input type="month" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" value={goalForm.month} onChange={e => setGoalForm({...goalForm, month: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Meta Prod. (m²)</label>
                     <input type="number" placeholder="Ex: 50000" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" value={goalForm.production} onChange={e => setGoalForm({...goalForm, production: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Meta Fat. (R$)</label>
                     <input type="number" placeholder="Ex: 100000" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" value={goalForm.revenue} onChange={e => setGoalForm({...goalForm, revenue: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                     <button onClick={handleSaveMonthlyGoal} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all active:scale-95">Salvar Meta</button>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Cronograma de Metas Ativas</h4>
                  {sortedMonthKeys.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl"><p className="text-[10px] font-bold text-slate-300 uppercase">Nenhuma meta mensal definida</p></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {sortedMonthKeys.map(key => (
                        <div key={key} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 transition-all group">
                           <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px]">{key.split('-').reverse().join('/')}</div><div className="grid grid-cols-2 gap-6"><div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Produção</p><p className="text-xs font-black text-slate-800">{state.monthlyGoals[key].production.toLocaleString('pt-BR')} m²</p></div><div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Faturamento</p><p className="text-xs font-black text-emerald-600">R$ {state.monthlyGoals[key].revenue.toLocaleString('pt-BR')}</p></div></div></div>
                           <button onClick={() => setConfirmDeleteGoal({ isOpen: true, monthKey: key })} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3"><DollarSign size={18} className="text-blue-600" /><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Matriz de Preços por Serviço</h3></div>
            <div className="p-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.values(ServiceType).map(type => (<div key={type} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] font-black text-slate-700 uppercase leading-tight w-1/2">{type}</span><div className="relative w-1/3"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span><input type="number" step="0.01" className="w-full bg-white border border-slate-200 p-2 pl-8 rounded-lg text-xs font-black outline-none focus:border-blue-500" value={state.serviceRates[type]} onChange={e => updateRate(type, parseFloat(e.target.value) || 0)}/></div></div>))}</div></div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3"><ListTree size={18} className="text-indigo-600" /><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Categorias Financeiras</h3></div>
              <div className="p-6 space-y-4">
                 <div className="flex gap-2"><input className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Nova categoria..." value={newCategory} onChange={e => setNewCategory(e.target.value)} /><button onClick={addCategory} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-emerald-600 transition-colors"><Plus size={18} /></button></div>
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">{state.financeCategories.map(cat => (<div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group"><span className="text-[10px] font-black text-slate-600 uppercase">{cat}</span><button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button></div>))}</div>
              </div>
           </div>

           <div className="bg-slate-900 text-white p-8 rounded-[32px] border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw size={20} className="text-blue-400" />
                <h4 className="font-black text-xs uppercase tracking-widest">Sincronização Cloud</h4>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed mb-6">
                Este terminal está conectado a uma infraestrutura Supabase. Para alterar o banco de dados ou resetar as chaves de acesso:
              </p>
              <button 
                onClick={() => setShowCloudResetConfirm(true)}
                className="w-full py-3 bg-white/10 hover:bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Resetar Conexão Supabase
              </button>
           </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!confirmDeleteGoal?.isOpen}
        onClose={() => setConfirmDeleteGoal(null)}
        onConfirm={performDeleteGoal}
        title="Excluir Metas"
        message={`Deseja realmente excluir as metas do período ${confirmDeleteGoal?.monthKey?.split('-').reverse().join('/')}?`}
        confirmText="Excluir Agora"
      />

      <ConfirmationModal 
        isOpen={showCloudResetConfirm}
        onClose={() => setShowCloudResetConfirm(false)}
        onConfirm={handleResetCloud}
        title="Resetar Conexão Cloud"
        message="Esta ação irá remover as chaves da URL e Anon Key do seu navegador. Você precisará reconfigurá-las para acessar o sistema novamente."
        confirmText="Resetar Agora"
        type="warning"
      />
    </div>
  );
};

export default Settings;
