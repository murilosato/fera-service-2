
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  Map, 
  Calendar, 
  Filter, 
  X, 
  Package
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setActiveTab: (tab: string) => void;
}

type MetricType = 'production' | 'revenue' | 'balance';

const Dashboard: React.FC<DashboardProps> = ({ state, setActiveTab }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('production');
  const [showFilter, setShowFilter] = useState(false);
  
  const [rangeMonths, setRangeMonths] = useState(6);
  const [endPeriod, setEndPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const COLORS = {
    realized: '#010a1b',
    goal: '#10b981',
    goalOpacity: 'rgba(16, 185, 129, 0.2)',
    danger: '#ef4444'
  };

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const monthlySeries = useMemo(() => {
    const months = [];
    const [year, month] = endPeriod.split('-').map(Number);
    
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const yKey = d.getFullYear();
      const mKey = String(d.getMonth() + 1).padStart(2, '0');
      
      months.push({
        label: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
        fullName: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(),
        key: `${yKey}-${mKey}` 
      });
    }
    return months;
  }, [endPeriod, rangeMonths]);

  const chartData = useMemo(() => {
    return monthlySeries.map(m => {
      let prod = 0;
      let rev = 0;
      
      state.areas.forEach(area => {
        const isFinished = area.status === 'finished';
        const finishedInThisMonth = area.endDate?.startsWith(m.key);
        
        if (isFinished && finishedInThisMonth) {
          (area.services || []).forEach(s => {
            prod += s.areaM2;
            rev += s.totalValue;
          });
        }
      });

      const inc = state.cashIn.filter(c => c.date?.startsWith(m.key)).reduce((acc, c) => acc + c.value, 0);
      const out = state.cashOut.filter(c => c.date?.startsWith(m.key)).reduce((acc, c) => acc + c.value, 0);
      
      const goal = state.monthlyGoals[m.key] || { production: 0, revenue: 0 };

      return {
        name: m.label,
        fullName: m.fullName,
        production: prod,
        productionGoal: goal.production,
        revenue: rev,
        revenueGoal: goal.revenue,
        balance: inc - out,
        income: inc,
        expense: out
      };
    });
  }, [state.areas, state.cashIn, state.cashOut, monthlySeries, state.monthlyGoals]);

  const periodTotals = useMemo(() => {
    const lastMonthKey = monthlySeries[monthlySeries.length - 1].key;
    const currentMonthGoal = state.monthlyGoals[lastMonthKey] || { production: 0, revenue: 0 };
    
    let prodMonth = 0;
    let revMonth = 0;
    
    state.areas.forEach(area => {
      if (area.status === 'finished' && area.endDate?.startsWith(lastMonthKey)) {
        (area.services || []).forEach(s => {
          prodMonth += s.areaM2;
          revMonth += s.totalValue;
        });
      }
    });

    const inc = state.cashIn.filter(c => c.date?.startsWith(lastMonthKey)).reduce((acc, c) => acc + c.value, 0);
    const out = state.cashOut.filter(c => c.date?.startsWith(lastMonthKey)).reduce((acc, c) => acc + c.value, 0);
    
    const currentInventoryValue = state.inventory.reduce((acc, item) => acc + ((item.currentQty || 0) * (item.unitValue || 0)), 0);

    return {
      production: prodMonth,
      revenue: revMonth,
      balance: inc - out,
      inventoryValue: currentInventoryValue,
      goalProd: currentMonthGoal.production,
      goalRev: currentMonthGoal.revenue,
      prodPercentage: currentMonthGoal.production > 0 ? (prodMonth / currentMonthGoal.production) * 100 : 0,
      revPercentage: currentMonthGoal.revenue > 0 ? (revMonth / currentMonthGoal.revenue) * 100 : 0
    };
  }, [state.areas, state.cashIn, state.cashOut, state.monthlyGoals, state.inventory, monthlySeries]);

  const lowStock = state.inventory.filter(i => i.currentQty <= i.minQty);

  const stats = [
    { id: 'production', label: 'PRODUÇÃO MÊS (FINALIZADA)', value: `${periodTotals.production.toLocaleString('pt-BR')} m²`, progress: periodTotals.prodPercentage, icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'revenue', label: 'FATURAMENTO MÊS (FECHADO)', value: formatMoney(periodTotals.revenue), progress: periodTotals.revPercentage, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'inventoryValue', label: 'VALOR EM ESTOQUE', value: formatMoney(periodTotals.inventoryValue), icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'stock', label: 'ESTOQUE CRÍTICO', value: `${lowStock.length} itens`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#010a1b] tracking-tight uppercase">Monitoramento Estratégico</h2>
          <p className="text-[10px] text-[#2e3545] font-bold uppercase tracking-widest opacity-70">Cálculo baseado em O.S. Finalizadas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-auto">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between md:justify-start gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:border-[#010a1b] transition-all group"
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#2e3545] group-hover:text-[#010a1b]" />
                <span className="text-[10px] font-black text-[#2e3545] uppercase tracking-widest whitespace-nowrap">
                  Período: {monthlySeries[0].label} - {monthlySeries[monthlySeries.length-1].label}
                </span>
              </div>
              <Filter size={14} className="text-slate-300" />
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-full md:w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-[#010a1b] uppercase tracking-[0.2em]">Filtro de Período</h4>
                  <button onClick={() => setShowFilter(false)} className="text-slate-300 hover:text-[#010a1b]"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#2e3545] uppercase tracking-widest">Mês Final</label>
                    <input type="month" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#010a1b]" value={endPeriod} onChange={(e) => setEndPeriod(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#2e3545] uppercase tracking-widest">Extensão</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#010a1b]" value={rangeMonths} onChange={(e) => setRangeMonths(Number(e.target.value))}>
                      <option value={1}>1 Mês</option>
                      <option value={3}>3 Meses</option>
                      <option value={6}>6 Meses</option>
                      <option value={12}>12 Meses</option>
                    </select>
                  </div>
                  <button onClick={() => setShowFilter(false)} className="w-full bg-[#010a1b] text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest">Filtrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button 
            key={stat.id} 
            onClick={() => {
              if (stat.id === 'inventoryValue' || stat.id === 'stock') {
                setActiveTab('inventory');
              } else {
                setActiveMetric(stat.id as MetricType);
              }
            }}
            className={`bg-white p-6 border text-left transition-all relative overflow-hidden group rounded-[32px] ${activeMetric === stat.id ? 'border-[#010a1b] ring-4 ring-[#010a1b]/5 shadow-lg' : 'border-slate-200 hover:border-[#010a1b]'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={20} /></span>
              {stat.progress !== undefined && (
                <span className={`text-[10px] font-black ${stat.progress >= 100 ? 'text-emerald-600' : 'text-[#2e3545]'}`}>
                   {stat.progress.toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-[9px] font-black text-[#2e3545] uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-black text-[#010a1b] truncate">{stat.value}</p>
            {stat.progress !== undefined && (
              <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${stat.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(stat.progress, 100)}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm min-h-[400px] w-full">
            <h3 className="font-black text-[10px] text-[#2e3545] uppercase tracking-[0.2em] mb-8">
              Gráfico de Desempenho Mensal (Itens Finalizados)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="900" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} fontWeight="900" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '900', color: '#010a1b', textTransform: 'uppercase' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                  
                  <Bar 
                    name="Realizado" 
                    dataKey={activeMetric} 
                    fill={COLORS.realized}
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  >
                    {chartData.map((entry, index) => {
                      // Se for saldo, mantém cores de alerta, senão usa o padrão preto (realizado)
                      let color = COLORS.realized;
                      if(activeMetric === 'balance') color = entry.balance >= 0 ? COLORS.goal : COLORS.danger;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>

                  {(activeMetric === 'production' || activeMetric === 'revenue') && (
                    <Bar 
                      name="Meta" 
                      dataKey={activeMetric === 'production' ? 'productionGoal' : 'revenueGoal'} 
                      fill={COLORS.goal} 
                      fillOpacity={0.4} 
                      radius={[4, 4, 0, 0]} 
                      barSize={20} 
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm overflow-hidden">
             <h3 className="font-black text-[10px] text-[#2e3545] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Wallet size={16} className="text-blue-500" /> Fluxo de Caixa Mensal
             </h3>
             <div className="overflow-x-auto -mx-8 px-8">
               <table className="w-full text-left min-w-[500px]">
                  <thead className="text-[9px] font-black uppercase text-[#2e3545] border-b">
                     <tr>
                        <th className="py-4">Mês</th>
                        <th className="py-4">Entradas</th>
                        <th className="py-4">Saídas</th>
                        <th className="py-4 text-right">Saldo</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y text-[10px] font-black uppercase text-[#010a1b]">
                     {chartData.map((month, idx) => (
                       <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 text-[#2e3545]">{month.name}</td>
                          <td className="py-4 text-emerald-600">{formatMoney(month.income)}</td>
                          <td className="py-4 text-rose-600">{formatMoney(month.expense)}</td>
                          <td className={`py-4 text-right ${month.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {formatMoney(month.balance)}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>

        <div className="bg-[#010a1b] text-white rounded-[40px] p-10 shadow-xl space-y-10 flex flex-col border border-white/5">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-emerald-400" />
            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Metas: Mês Atual</h3>
          </div>
          
          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase">Produção (Finalizada)</p>
                <p className="text-[10px] font-black">{periodTotals.prodPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(periodTotals.prodPercentage, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase">Faturamento (Auditado)</p>
                <p className="text-[10px] font-black">{periodTotals.revPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(periodTotals.revPercentage, 100)}%` }} />
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
               <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Valor Imobilizado</p>
               <p className="text-2xl font-black text-white tracking-tighter">{formatMoney(periodTotals.inventoryValue)}</p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('production')}
            className="w-full py-5 bg-white text-[#010a1b] rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-emerald-400 hover:text-white transition-all active:scale-95"
          >
             Acessar Gestão de Produção
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
