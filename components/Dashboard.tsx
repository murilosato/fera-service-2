
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
    { label: 'PRODUÇÃO', value: `${totalProductionM2.toLocaleString('pt-BR')} m²`, icon: Map, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'FATURAMENTO', value: formatMoney(totalProductionValue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'SALDO ATUAL', value: formatMoney(currentBalance), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-100', border: 'border-slate-200' },
    { label: 'ESTOQUE CRÍTICO', value: lowStock.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">VISÃO GERAL DO SISTEMA</h2>
          <p className="text-xs text-slate-500 font-medium">Controle operacional e financeiro em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg">
          <Target size={16} className="text-slate-400" />
          <div className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Meta: {state.monthlyGoalM2.toLocaleString('pt-BR')} m²</div>
          <button onClick={() => {
            const n = prompt("Nova Meta:", state.monthlyGoalM2.toString());
            if(n) setState(prev => ({...prev, monthlyGoalM2: Number(n)}));
          }} className="ml-2 text-[10px] bg-slate-900 text-white px-2 py-1 rounded">ALTERAR</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white p-5 border ${stat.border} rounded-lg shadow-sm group hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-3">
              <span className={`p-2 rounded ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </span>
              <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Desempenho da Meta</h3>
            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded">{progressPercent.toFixed(1)}% CONCLUÍDO</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'REALIZADO', valor: totalProductionM2, color: '#059669' },
                { name: 'RESTANTE', valor: Math.max(0, state.monthlyGoalM2 - totalProductionM2), color: '#e2e8f0' }
              ]}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke="#94a3b8" />
                <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={50}>
                   { [0, 1].map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#e2e8f0'} />) }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight mb-6">Insumos em Baixa</h3>
          <div className="space-y-3 flex-1">
            {lowStock.length > 0 ? lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded bg-slate-50/50">
                <div>
                  <p className="text-xs font-bold text-slate-700">{item.name}</p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase">Saldo: {item.currentQty}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="p-2 bg-white border border-slate-200 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Package size={14} />
                </button>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-10">
                <Package size={32} strokeWidth={1.5} className="mb-2" />
                <p className="text-xs font-bold uppercase">Estoque Normalizado</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('inventory')}
            className="mt-6 w-full py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-colors"
          >
            Acessar Almoxarifado
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
