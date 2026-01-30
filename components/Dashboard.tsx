
import React, { useState, useMemo, useEffect } from 'react';
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
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  Map, 
  Package, 
  Target, 
  ArrowUpRight, 
  BarChart3, 
  ChevronRight, 
  AlertCircle, 
  Calendar, 
  Filter, 
  X, 
  Percent,
  Smartphone,
  Download,
  Info
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setActiveTab: (tab: string) => void;
}

type MetricType = 'production' | 'revenue' | 'balance' | 'stock';

const Dashboard: React.FC<DashboardProps> = ({ state, setActiveTab }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('production');
  const [showFilter, setShowFilter] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const [rangeMonths, setRangeMonths] = useState(6);
  const [endPeriod, setEndPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Helper robusto para gerar chaves de meses
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

  // Dados do gráfico: Agrupa serviços e inclui as metas individuais de cada mês
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
      
      // Busca a meta específica do mês ou usa 0 se não existir
      const goal = state.monthlyGoals[m.key] || { production: 0, revenue: 0 };

      return {
        name: m.label,
        fullName: m.fullName,
        production: prod,
        productionGoal: goal.production,
        revenue: rev,
        revenueGoal: goal.revenue,
        balance: inc - out,
        stock: state.inventoryExits.filter(e => e.date.startsWith(m.key)).reduce((acc, e) => acc + e.quantity, 0),
      };
    });
  }, [state.areas, state.cashIn, state.cashOut, state.inventoryExits, monthlySeries, state.monthlyGoals]);

  const periodTotals = useMemo(() => {
    const lastMonthKey = monthlySeries[monthlySeries.length - 1].key;
    const currentMonthGoal = state.monthlyGoals[lastMonthKey] || { production: 0, revenue: 0 };
    
    let prodMonth = 0;
    let revMonth = 0;
    
    state.areas.forEach(area => {
      area.services.forEach(s => {
        if (s.serviceDate.startsWith(lastMonthKey)) {
          prodMonth += s.areaM2;
          revMonth += s.totalValue;
        }
      });
    });

    const inc = state.cashIn.filter(c => c.date.startsWith(lastMonthKey)).reduce((acc, c) => acc + c.value, 0);
    const out = state.cashOut.filter(c => c.date.startsWith(lastMonthKey)).reduce((acc, c) => acc + c.value, 0);
    
    return {
      production: prodMonth,
      revenue: revMonth,
      balance: inc - out,
      goalProd: currentMonthGoal.production,
      goalRev: currentMonthGoal.revenue,
      prodPercentage: currentMonthGoal.production > 0 ? (prodMonth / currentMonthGoal.production) * 100 : 0,
      revPercentage: currentMonthGoal.revenue > 0 ? (revMonth / currentMonthGoal.revenue) * 100 : 0
    };
  }, [state.areas, state.cashIn, state.cashOut, state.monthlyGoals, monthlySeries]);

  const lowStock = state.inventory.filter(i => i.currentQty <= i.minQty);

  const stats = [
    { id: 'production', label: 'PRODUÇÃO MÊS', value: `${periodTotals.production.toLocaleString('pt-BR')} m²`, progress: periodTotals.prodPercentage, icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'revenue', label: 'FATURAMENTO MÊS', value: formatMoney(periodTotals.revenue), progress: periodTotals.revPercentage, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'balance', label: 'SALDO MENSAL', value: formatMoney(periodTotals.balance), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-100' },
    { id: 'stock', label: 'ESTOQUE CRÍTICO', value: `${lowStock.length} itens`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Monitoramento Estratégico</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Metas Dinâmicas Mensais vs Realizado</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Download size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Baixar App</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:border-slate-300 transition-all group"
            >
              <Calendar size={16} className="text-slate-400 group-hover:text-slate-600" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                Análise: {monthlySeries[0].label} - {monthlySeries[monthlySeries.length-1].label}
              </span>
              <Filter size={14} className="text-slate-300" />
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Filtro de Período</h4>
                  <button onClick={() => setShowFilter(false)} className="text-slate-300 hover:text-slate-900"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mês Final</label>
                    <input type="month" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-bold outline-none" value={endPeriod} onChange={(e) => setEndPeriod(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extensão</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-bold outline-none" value={rangeMonths} onChange={(e) => setRangeMonths(Number(e.target.value))}>
                      <option value={3}>3 Meses</option>
                      <option value={6}>6 Meses</option>
                      <option value={12}>12 Meses</option>
                    </select>
                  </div>
                  <button onClick={() => setShowFilter(false)} className="w-full bg-slate-900 text-white py-3 rounded-lg text-[9px] font-black uppercase tracking-widest">Filtrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner de Instalação (PWA) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[24px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/5 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Smartphone size={120} />
         </div>
         <div className="flex items-center gap-5 relative z-10 text-center md:text-left">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
               <Smartphone size={28} />
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-tight">Fera Service no seu Celular</h3>
               <p className="text-slate-400 text-xs font-medium max-w-md">Instale o aplicativo para ter acesso rápido aos lançamentos de campo, offline e notificações em tempo real.</p>
            </div>
         </div>
         <button 
           onClick={() => setShowInstallModal(true)}
           className="bg-white text-slate-900 px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 hover:text-slate-900 transition-all shadow-lg active:scale-95 relative z-10"
         >
            INSTALAR AGORA
         </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button 
            key={stat.id} 
            onClick={() => setActiveMetric(stat.id as MetricType)}
            className={`bg-white p-5 border text-left transition-all relative overflow-hidden group ${activeMetric === stat.id ? 'border-slate-900 ring-4 ring-slate-900/5 shadow-lg' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={20} /></span>
              {stat.progress !== undefined && (
                <span className={`text-[10px] font-black ${stat.progress >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                   {stat.progress.toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-black text-slate-900 truncate">{stat.value}</p>
            {stat.progress !== undefined && (
              <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${stat.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(stat.progress, 100)}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
              Histórico Mensal: {activeMetric === 'production' ? 'Produção vs Metas' : activeMetric === 'revenue' ? 'Faturamento vs Metas' : activeMetric.toUpperCase()}
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} fontWeight="900" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} fontWeight="900" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '900' }}
                  formatter={(val: any, name: string) => {
                    const label = name.includes('Goal') ? 'Meta do Mês' : 'Realizado';
                    const unit = activeMetric === 'production' ? ' m²' : '';
                    return [activeMetric === 'revenue' ? formatMoney(val) : `${val.toLocaleString('pt-BR')}${unit}`, label];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-400 ml-1">{value.includes('Goal') ? 'Meta' : 'Realizado'}</span>}
                />
                
                <Bar 
                  name="Realizado"
                  dataKey={activeMetric} 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                >
                   {chartData.map((entry: any, index) => {
                     let color = '#0f172a';
                     if(activeMetric === 'balance') color = entry.balance >= 0 ? '#10b981' : '#ef4444';
                     if(activeMetric === 'revenue') color = '#059669';
                     if(activeMetric === 'production') color = '#2563eb';
                     return <Cell key={`cell-${index}`} fill={color} />;
                   })}
                </Bar>

                {(activeMetric === 'production' || activeMetric === 'revenue') && (
                  <Bar 
                    name="Meta"
                    dataKey={activeMetric === 'production' ? 'productionGoal' : 'revenueGoal'} 
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl flex flex-col border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <Percent size={20} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Desempenho: Mês Atual</h3>
          </div>
          
          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produção</p>
                <p className="text-xs font-black text-white">{periodTotals.prodPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(periodTotals.prodPercentage, 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                {periodTotals.production.toLocaleString('pt-BR')} / {periodTotals.goalProd.toLocaleString('pt-BR')} m²
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento</p>
                <p className="text-xs font-black text-white">{periodTotals.revPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(periodTotals.revPercentage, 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                {formatMoney(periodTotals.revenue)} / {formatMoney(periodTotals.goalRev)}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('production')}
            className="mt-10 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
             Lançar Produção <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Modal de Instruções de Instalação */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Instalar Aplicativo</h3>
              </div>
              <button onClick={() => setShowInstallModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-900 text-xs">1</div>
                     <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Para Android (Chrome)</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Toque nos <span className="text-slate-900">três pontos</span> no canto superior e selecione <span className="text-emerald-600">"Instalar Aplicativo"</span> ou "Adicionar à tela inicial".</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-900 text-xs">2</div>
                     <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Para iPhone (Safari)</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Toque no ícone de <span className="text-slate-900">Compartilhar</span> (quadrado com seta) e selecione <span className="text-emerald-600">"Adicionar à Tela de Início"</span>.</p>
                     </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
                     <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-black text-blue-800 uppercase leading-relaxed tracking-tight">Isso permite usar o sistema como um App nativo, com mais espaço de tela e acesso imediato.</p>
                  </div>
               </div>

               <button 
                 onClick={() => setShowInstallModal(false)}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
               >
                  ENTENDI, VOU INSTALAR
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
