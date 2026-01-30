
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
  ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, Wallet, Map, Package, Target, ArrowUpRight, BarChart3, ChevronRight, AlertCircle, Calendar, Filter, X } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setActiveTab: (tab: string) => void;
}

type MetricType = 'production' | 'revenue' | 'balance' | 'stock';

const Dashboard: React.FC<DashboardProps> = ({ state, setActiveTab }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('production');
  const [showFilter, setShowFilter] = useState(false);
  
  // Estados para o filtro de período
  const [rangeMonths, setRangeMonths] = useState(6);
  const [endPeriod, setEndPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Helper para gerar a série mensal baseada no filtro
  const monthlySeries = useMemo(() => {
    const months = [];
    const [year, month] = endPeriod.split('-').map(Number);
    
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({
        label: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
        fullName: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(),
        key: d.toISOString().substring(0, 7) // YYYY-MM
      });
    }
    return months;
  }, [endPeriod, rangeMonths]);

  // Dados Agrupados por Mês para o gráfico
  const chartData = useMemo(() => {
    return monthlySeries.map(m => {
      let prod = 0;
      let rev = 0;
      state.areas.forEach(area => {
        area.services.forEach(s => {
          if (s.serviceDate.startsWith(m.key)) {
            prod += s.areaM2;
            rev += s.totalValue;
          }
        });
      });

      const inc = state.cashIn.filter(c => c.date.startsWith(m.key)).reduce((acc, c) => acc + c.value, 0);
      const out = state.cashOut.filter(c => c.date.startsWith(m.key)).reduce((acc, c) => acc + c.value, 0);
      const bal = inc - out;
      const consumption = state.inventoryExits.filter(e => e.date.startsWith(m.key)).reduce((acc, e) => acc + e.quantity, 0);

      return {
        name: m.label,
        fullName: m.fullName,
        production: prod,
        revenue: rev,
        balance: bal,
        stock: consumption,
        targetProd: state.monthlyGoalM2,
        targetRev: state.monthlyGoalRevenue
      };
    });
  }, [state.areas, state.cashIn, state.cashOut, state.inventoryExits, state.monthlyGoalM2, state.monthlyGoalRevenue, monthlySeries]);

  // Totais do período selecionado para os Cards
  const periodTotals = useMemo(() => {
    const keys = monthlySeries.map(m => m.key);
    
    let prod = 0;
    let rev = 0;
    state.areas.forEach(area => {
      area.services.forEach(s => {
        if (keys.some(k => s.serviceDate.startsWith(k))) {
          prod += s.areaM2;
          rev += s.totalValue;
        }
      });
    });

    const inc = state.cashIn.filter(c => keys.some(k => c.date.startsWith(k))).reduce((acc, c) => acc + c.value, 0);
    const out = state.cashOut.filter(c => keys.some(k => c.date.startsWith(k))).reduce((acc, c) => acc + c.value, 0);
    
    return {
      production: prod,
      revenue: rev,
      balance: inc - out
    };
  }, [state.areas, state.cashIn, state.cashOut, monthlySeries]);

  const lowStock = state.inventory.filter(i => i.currentQty <= i.minQty);

  const stats = [
    { id: 'production', label: 'PRODUÇÃO', value: `${periodTotals.production.toLocaleString('pt-BR')} m²`, icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'revenue', label: 'FATURAMENTO', value: formatMoney(periodTotals.revenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'balance', label: 'SALDO NO PERÍODO', value: formatMoney(periodTotals.balance), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-100' },
    { id: 'stock', label: 'ESTOQUE CRÍTICO', value: `${lowStock.length} itens`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Monitoramento Estratégico</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Análise Mensal de Indicadores Chave</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:border-slate-300 transition-all group"
          >
            <Calendar size={16} className="text-slate-400 group-hover:text-slate-600" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Período: {monthlySeries[0].label} - {monthlySeries[monthlySeries.length-1].label}
            </span>
            <Filter size={14} className="text-slate-300" />
          </button>

          {showFilter && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Ajustar Período</h4>
                <button onClick={() => setShowFilter(false)} className="text-slate-300 hover:text-slate-900"><X size={16} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mês Final</label>
                  <input 
                    type="month" 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-slate-900"
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantidade de Meses</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-slate-900 appearance-none"
                    value={rangeMonths}
                    onChange={(e) => setRangeMonths(Number(e.target.value))}
                  >
                    <option value={3}>Últimos 3 Meses</option>
                    <option value={6}>Últimos 6 Meses</option>
                    <option value={12}>Últimos 12 Meses</option>
                    <option value={24}>Últimos 24 Meses</option>
                  </select>
                </div>

                <button 
                  onClick={() => setShowFilter(false)}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                >
                  Aplicar Filtro
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button 
            key={stat.id} 
            onClick={() => setActiveMetric(stat.id as MetricType)}
            className={`bg-white p-5 border text-left transition-all group ${activeMetric === stat.id ? 'border-slate-900 ring-4 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`p-2 rounded-sm ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </span>
              <ArrowUpRight size={14} className={`${activeMetric === stat.id ? 'text-slate-900' : 'text-slate-200'}`} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-black text-slate-900 truncate">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Dinâmico com Eixo X Mensal */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6 shadow-sm min-h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
              {activeMetric === 'stock' ? 'Reposição de Estoque Crítico' : `Análise Temporal: ${activeMetric.toUpperCase()}`}
            </h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 bg-slate-900 rounded-sm"></span>
                 <span className="text-[9px] font-black uppercase text-slate-400">Realizado</span>
               </div>
               { (activeMetric === 'production' || activeMetric === 'revenue') && (
                 <div className="flex items-center gap-2">
                   <span className="w-2.5 h-2.5 border border-dashed border-slate-300 rounded-sm"></span>
                   <span className="text-[9px] font-black uppercase text-slate-300">Meta</span>
                 </div>
               )}
            </div>
          </div>

          {activeMetric === 'stock' ? (
            <div className="space-y-3">
              {lowStock.length > 0 ? (
                lowStock.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded group hover:bg-rose-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-600 text-white rounded flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{item.name}</p>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">Status: Crítico</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Saldo / Mínimo</p>
                      <p className="text-sm font-black text-slate-900">{item.currentQty} / <span className="text-rose-600">{item.minQty}</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Package size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">Estoque Normalizado</p>
                </div>
              )}
              {lowStock.length > 0 && (
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="w-full mt-4 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Ir para Almoxarifado <ChevronRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="900" stroke="#94a3b8" />
                  <YAxis fontSize={10} fontWeight="900" stroke="#94a3b8" />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'black', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: any, props: any) => [
                      activeMetric === 'production' ? `${val.toLocaleString('pt-BR')} m²` : formatMoney(val),
                      props.payload.fullName
                    ]}
                  />
                  {activeMetric === 'production' && <ReferenceLine y={state.monthlyGoalM2} stroke="#3b82f6" strokeDasharray="4 4" label={{ position: 'right', value: 'META', fontSize: 8, fontWeight: 'bold', fill: '#3b82f6' }} />}
                  {activeMetric === 'revenue' && <ReferenceLine y={state.monthlyGoalRevenue} stroke="#10b981" strokeDasharray="4 4" label={{ position: 'right', value: 'META', fontSize: 8, fontWeight: 'bold', fill: '#10b981' }} />}
                  
                  <Bar 
                    dataKey={activeMetric} 
                    radius={[4, 4, 0, 0]} 
                    barSize={Math.min(40, 300 / rangeMonths)}
                  >
                     {chartData.map((entry, index) => {
                       let color = '#0f172a'; // Default
                       if(activeMetric === 'balance') color = entry.balance >= 0 ? '#10b981' : '#ef4444';
                       if(activeMetric === 'revenue') color = '#059669';
                       if(activeMetric === 'production') color = '#2563eb';
                       return <Cell key={`cell-${index}`} fill={color} />;
                     })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alertas e Bot */}
        <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl flex flex-col border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="font-black text-[10px] text-white uppercase tracking-[0.2em]">Insights do Período</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resumo do Período</p>
              <p className="text-xs font-medium mt-1 text-slate-200">
                Foram analisados {rangeMonths} meses ({monthlySeries[0].label} a {monthlySeries[monthlySeries.length-1].label}).
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Aderência à Meta</p>
              <p className="text-xs font-medium mt-1 text-slate-200">
                A produção acumulada de {periodTotals.production.toLocaleString('pt-BR')}m² representa um volume operacional significativo.
              </p>
            </div>

            {lowStock.length > 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Atenção Crítica</p>
                <p className="text-xs font-medium mt-1 text-rose-100">Necessidade de reposição para {lowStock.length} itens.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('ai')}
            className="mt-8 w-full py-4 bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
          >
             Consultar Fera Bot <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
