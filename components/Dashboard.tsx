
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
import { TrendingUp, AlertTriangle, Wallet, Map, Package, Target, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setActiveTab: (tab: string) => void;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    { label: 'PRODUÇÃO TOTAL', value: `${totalProductionM2.toLocaleString('pt-BR')} m²`, icon: Map, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'FATURAMENTO', value: formatMoney(totalProductionValue), icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'SALDO ATUAL', value: formatMoney(currentBalance), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-200' },
    { label: 'ESTOQUE CRÍTICO', value: `${lowStock.length} itens`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Painel de Controle Operacional</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Monitoramento de metas e fluxo de caixa em tempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-3 rounded shadow-sm">
          <Target size={16} className="text-slate-400" />
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Meta Mensal: {state.monthlyGoalM2.toLocaleString('pt-BR')} m²</div>
          <button onClick={() => {
            const n = prompt("Nova Meta Mensal (m²):", state.monthlyGoalM2.toString());
            if(n) setState(prev => ({...prev, monthlyGoalM2: Number(n)}));
          }} className="ml-3 text-[9px] font-black bg-slate-900 text-white px-3 py-1.5 rounded uppercase hover:bg-emerald-600 transition-colors">AJUSTAR</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 border border-slate-200 rounded shadow-sm hover:border-emerald-500 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className={`p-2 rounded-sm ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </span>
              <ArrowUpRight size={14} className="text-slate-300 group-hover:text-emerald-500" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{stat.label}</p>
            <p className="text-xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Acompanhamento de Metas</h3>
            <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded">{progressPercent.toFixed(1)}% CONCLUÍDO</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'REALIZADO', valor: totalProductionM2 },
                { name: 'META', valor: state.monthlyGoalM2 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} fontWeight="900" stroke="#94a3b8" />
                <YAxis fontSize={10} fontWeight="900" stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="valor" radius={[2, 2, 0, 0]} barSize={60}>
                   <Cell fill="#059669" />
                   <Cell fill="#e2e8f0" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Package size={16} className="text-rose-500" />
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Avisos de Almoxarifado</h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {lowStock.length > 0 ? lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border-l-4 border-l-rose-500 border border-slate-100 bg-slate-50/50 rounded-r">
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{item.name}</p>
                  <p className="text-[9px] text-rose-600 font-bold uppercase">Saldo: {item.currentQty} (Min: {item.minQty})</p>
                </div>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-10">
                <Package size={32} strokeWidth={1.5} className="mb-2 opacity-30" />
                <p className="text-[9px] font-black uppercase tracking-widest">Estoque em conformidade</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('inventory')}
            className="mt-6 w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded hover:bg-emerald-600 transition-colors"
          >
            GERENCIAR ESTOQUE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
