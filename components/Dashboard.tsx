
import React from 'react';
import { AppState } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, AlertTriangle, Wallet, Map, Package, Target } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setActiveTab: (tab: string) => void;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Dashboard: React.FC<DashboardProps> = ({ state, setState, setActiveTab }) => {
  const totalProductionM2 = state.areas.reduce((acc, area) => 
    acc + area.services.reduce((sAcc, s) => sAcc + s.areaM2, 0), 0
  );
  
  const totalProductionValue = state.areas.reduce((acc, area) => 
    acc + area.services.reduce((sAcc, s) => sAcc + s.totalValue, 0), 0
  );

  const cashIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const cashOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);
  const currentBalance = cashIn - cashOut;

  const progressPercent = Math.min((totalProductionM2 / state.monthlyGoalM2) * 100, 100);
  const lowStock = state.inventory.filter(i => i.currentQty <= i.minQty);

  const stats = [
    { label: 'Produção (m²)', value: totalProductionM2.toLocaleString('pt-BR'), icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Faturamento (R$)', value: formatMoney(totalProductionValue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Saldo (R$)', value: formatMoney(currentBalance), icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Alertas Estoque', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const updateGoal = () => {
    const newGoal = prompt("Defina a nova meta mensal em m²:", state.monthlyGoalM2.toString());
    if (newGoal && !isNaN(parseFloat(newGoal))) {
      setState(prev => ({ ...prev, monthlyGoalM2: parseFloat(newGoal) }));
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">Painel de Controle</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Visão geral das operações urbanas.</p>
        </div>
        <button 
          onClick={updateGoal}
          className="bg-white border-2 border-slate-100 p-3 md:p-4 rounded-2xl flex items-center gap-3 hover:border-blue-400 active:scale-95 transition-all shadow-sm w-full md:w-auto"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Target size={20} /></div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Meta Mensal</p>
            <p className="text-sm font-bold text-slate-800">{state.monthlyGoalM2.toLocaleString('pt-BR')} m²</p>
          </div>
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between hover:shadow-md transition-shadow gap-3">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg md:text-2xl font-black text-slate-800 mt-1 md:mt-2 leading-none">{stat.value}</p>
            </div>
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} shadow-sm self-start`}>
              <stat.icon size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800">Progresso da Meta</h3>
              <p className="text-xs text-slate-400 font-medium">Volume executado vs planejado.</p>
            </div>
            <div className="text-right">
               <span className="text-3xl md:text-4xl font-black text-blue-600">{progressPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="h-60 md:h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Executado', valor: totalProductionM2, fill: '#2563eb' },
                { name: 'Meta Restante', valor: Math.max(0, state.monthlyGoalM2 - totalProductionM2), fill: '#f1f5f9' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="valor" radius={[10, 10, 10, 10]} barSize={60}>
                   { [0, 1].map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#f1f5f9'} />) }
                </Bar>
              </BarChart>
            {/* Fix: Corrigido fechamento da tag ResponsiveContainer */}
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-4">
             <div className="p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase">Realizado</p>
                <p className="text-lg md:text-xl font-black text-blue-700">{totalProductionM2.toLocaleString('pt-BR')} m²</p>
             </div>
             <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Faltante</p>
                <p className="text-lg md:text-xl font-black text-slate-700">{Math.max(0, state.monthlyGoalM2 - totalProductionM2).toLocaleString('pt-BR')} m²</p>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
             <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-2xl"><Package size={22} /></div>
             <h3 className="text-lg md:text-xl font-black text-slate-800">Alertas de Estoque</h3>
          </div>
          
          {lowStock.length > 0 ? (
            <div className="space-y-3 flex-1">
              {lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100 group">
                  <div>
                    <p className="font-black text-amber-900 uppercase text-[10px] md:text-xs tracking-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] md:text-[10px] font-bold text-amber-600">QTD: {item.currentQty}</span>
                       <span className="w-1 h-1 bg-amber-300 rounded-full"></span>
                       <span className="text-[9px] md:text-[10px] font-bold text-amber-600">MIN: {item.minQty}</span>
                    </div>
                  </div>
                  <AlertTriangle className="text-amber-500 animate-pulse" size={18} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center">
                 <Package size={32} className="md:w-10 md:h-10" />
              </div>
              <p className="font-bold text-sm">Estoque OK</p>
            </div>
          )}
          
          <button 
            onClick={() => setActiveTab('inventory')}
            className="mt-6 md:mt-8 w-full py-3 md:py-4 bg-slate-900 text-white font-black text-[11px] md:text-sm rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest"
          >
            Gerenciar Almoxarifado
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
