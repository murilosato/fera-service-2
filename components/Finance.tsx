
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, X, Wallet, Trash2, Loader2, DollarSign, Calendar, Tag, Search, Filter } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface FinanceProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Finance: React.FC<FinanceProps> = ({ state, setState, notify }) => {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string } | null>(null);
  
  // Estados para Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    value: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    category: 'Geral'
  });

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleSaveMove = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.value.replace(',', '.'));
    if (isNaN(val) || val <= 0) return notify("Valor inválido", "error");

    setIsLoading(true);
    try {
      await dbSave('cash_flow', {
        companyId: state.currentUser?.companyId,
        type: activeTab,
        value: val,
        date: formData.date,
        reference: formData.reference || (activeTab === 'in' ? 'Receita Diversa' : 'Despesa Diversa'),
        category: formData.category
      });
      await refreshData();
      setShowForm(false);
      setFormData({ value: '', date: new Date().toISOString().split('T')[0], reference: '', category: 'Geral' });
      notify("Lançamento efetivado");
    } catch (e: any) {
      console.error(e);
      notify("Erro na gravação.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Filtragem
  const filteredData = useMemo(() => {
    const list = activeTab === 'in' ? state.cashIn : state.cashOut;
    return list.filter(item => {
      const matchesSearch = item.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesDate = (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate);
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [activeTab, state.cashIn, state.cashOut, searchQuery, categoryFilter, startDate, endDate]);

  const totalIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const totalOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);
  const filteredTotal = filteredData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Fluxo de Caixa</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Saldos Unificados Cloud</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl">
          <Plus size={18} /> Novo Registro
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ArrowUpCircle size={24} /></div>
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Receitas Totais</p><p className="text-lg font-black text-emerald-600">{formatMoney(totalIn)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><ArrowDownCircle size={24} /></div>
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Despesas Totais</p><p className="text-lg font-black text-rose-600">{formatMoney(totalOut)}</p></div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/5">
           <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Disponível</p><p className="text-lg font-black text-emerald-400">{formatMoney(totalIn - totalOut)}</p></div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          <Filter size={14}/> Filtragem e Busca Avançada
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all" 
              placeholder="BUSCAR REFERÊNCIA..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">TODAS AS CATEGORIAS</option>
            {state.financeCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
             <Calendar size={14} className="text-slate-400" />
             <label className="text-[8px] font-black text-slate-400 uppercase">DE:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
             <label className="text-[8px] font-black text-slate-400 uppercase">ATÉ:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        {(searchQuery || categoryFilter !== 'ALL' || startDate || endDate) && (
          <button 
            onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); setStartDate(''); setEndDate(''); }}
            className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-2 hover:opacity-70"
          >
            <X size={14}/> Limpar filtros selecionados
          </button>
        )}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex bg-slate-50 p-2 border-b border-slate-100">
           <button onClick={() => setActiveTab('in')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'in' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Entradas</button>
           <button onClick={() => setActiveTab('out')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'out' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Saídas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
                <tr className="text-[9px] font-black uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5">Data</th><th className="px-8 py-5">Referência</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5 text-right">Valor</th><th className="px-8 py-5 text-center">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center italic text-slate-300 uppercase text-[10px] font-black">Nenhum lançamento encontrado para os critérios de busca</td></tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{item.date.split('-').reverse().join('/')}</td>
                      <td className="px-8 py-4 text-[10px] font-black uppercase text-slate-800">{item.reference}</td>
                      <td className="px-8 py-4"><span className="text-[8px] font-black uppercase bg-slate-100 px-3 py-1 rounded-lg text-slate-500">{item.category}</span></td>
                      <td className={`px-8 py-4 text-right font-black text-sm ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(item.value)}</td>
                      <td className="px-8 py-4 text-center"><button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button></td>
                    </tr>
                  ))
                )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t border-slate-100">
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-[9px] font-black uppercase text-slate-400">Total Filtrado ({activeTab === 'in' ? 'Receitas' : 'Despesas'})</td>
                  <td className={`px-8 py-4 text-right font-black text-sm ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(filteredTotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleSaveMove} className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-50 pb-5">
                <div><h3 className="font-black uppercase text-xs text-slate-900">Novo Lançamento</h3><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{activeTab === 'in' ? 'Entrada de Receita' : 'Saída de Despesa'}</p></div>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">VALOR DO LANÇAMENTO</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white focus:border-slate-900" placeholder="0.00" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">DATA DE COMPETÊNCIA</label>
                    <input type="date" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">REFERÊNCIA DO TÍTULO</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white" placeholder="EX: PAGAMENTO DE COMBUSTÍVEL" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CATEGORIA</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                       {state.financeCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                   {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'EFETIVAR LANÇAMENTO'}
                 </button>
              </div>
           </form>
        </div>
      )}
      <ConfirmationModal isOpen={!!confirmDelete?.isOpen} onClose={() => setConfirmDelete(null)} onConfirm={async () => { await dbDelete('cash_flow', confirmDelete!.id); await refreshData(); notify("Lançamento removido"); }} title="Excluir" message="Remover permanentemente do banco?" />
    </div>
  );
};

export default Finance;
