
import React, { useState } from 'react';
import { AppState, ServiceType } from '../types';
import { Save, Info, Target, ListTree, Plus, Trash2, ShieldCheck, DollarSign } from 'lucide-react';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Settings: React.FC<SettingsProps> = ({ state, setState }) => {
  const [newCategory, setNewCategory] = useState('');

  const updateRate = (type: ServiceType, val: number) => {
    setState(prev => ({ ...prev, serviceRates: { ...prev.serviceRates, [type]: val } }));
  };

  const updateGoal = (type: ServiceType, val: number) => {
    setState(prev => ({ ...prev, serviceGoals: { ...prev.serviceGoals, [type]: val } }));
  };

  const addCategory = () => {
    if(!newCategory.trim()) return;
    setState(prev => ({ ...prev, financeCategories: [...prev.financeCategories, newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setState(prev => ({ ...prev, financeCategories: prev.financeCategories.filter(c => c !== cat) }));
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurações Gerais</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Definições de Metas e Parâmetros de Sistema</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metas e Valores */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <Target size={18} className="text-emerald-600" />
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Matriz de Metas e Preços</h3>
            </div>
            <div className="p-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                     <span className="col-span-1">Tipo de Serviço</span>
                     <span>Valor Unitário (R$)</span>
                     <span>Meta Mensal (Qtd/m²)</span>
                  </div>
                  {Object.values(ServiceType).map(type => (
                    <div key={type} className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded border border-slate-100">
                       <span className="text-[11px] font-bold text-slate-700 uppercase leading-tight">{type}</span>
                       <input 
                        type="number" step="0.01"
                        className="bg-white border border-slate-200 p-2 rounded text-xs font-bold outline-none focus:border-emerald-500"
                        value={state.serviceRates[type]}
                        onChange={e => updateRate(type, parseFloat(e.target.value) || 0)}
                       />
                       <input 
                        type="number"
                        className="bg-white border border-slate-200 p-2 rounded text-xs font-bold outline-none focus:border-emerald-500"
                        value={state.serviceGoals[type]}
                        onChange={e => updateGoal(type, parseInt(e.target.value) || 0)}
                       />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
               <div className="flex items-center gap-3 mb-4 text-blue-600">
                  <ShieldCheck size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Meta Global (Produção)</h3>
               </div>
               <div className="space-y-2">
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded text-lg font-black outline-none focus:border-blue-500"
                      value={state.monthlyGoalM2}
                      onChange={e => setState(prev => ({...prev, monthlyGoalM2: parseInt(e.target.value) || 0}))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">m²</span>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest px-1">Meta acumulada de área trabalhada</p>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
               <div className="flex items-center gap-3 mb-4 text-emerald-600">
                  <DollarSign size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Meta de Faturamento</h3>
               </div>
               <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">R$</span>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 p-4 pl-10 rounded text-lg font-black outline-none focus:border-emerald-500"
                      value={state.monthlyGoalRevenue}
                      onChange={e => setState(prev => ({...prev, monthlyGoalRevenue: parseInt(e.target.value) || 0}))}
                    />
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest px-1">Meta de receita bruta mensal</p>
               </div>
            </div>
          </div>
        </div>

        {/* Categorias Financeiras */}
        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                 <ListTree size={18} className="text-indigo-600" />
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Categorias de Fluxo</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded text-xs font-bold outline-none"
                      placeholder="Nova categoria..."
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                    />
                    <button 
                      onClick={addCategory}
                      className="bg-slate-900 text-white p-2 rounded hover:bg-emerald-600 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                 </div>
                 <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {state.financeCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 group">
                         <span className="text-[10px] font-bold text-slate-600 uppercase">{cat}</span>
                         <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 text-white p-6 rounded shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Info size={20} className="text-emerald-400" />
                <h4 className="font-black text-xs uppercase tracking-widest">Aviso Operacional</h4>
              </div>
              <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase">Os valores de meta aqui definidos são utilizados para calcular a saúde financeira do negócio no Painel Inicial e nos relatórios do Fera Bot.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
