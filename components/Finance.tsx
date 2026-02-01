
import React, { useState } from 'react';
import { AppState } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, X, Wallet, Trash2, Loader2, DollarSign, Calendar, Tag } from 'lucide-react';
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
      notify("Erro na gravação. Verifique as colunas do SQL.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const totalIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const totalOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);

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
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Receitas</p><p className="text-lg font-black text-emerald-600">{formatMoney(totalIn)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><ArrowDownCircle size={24} /></div>
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Despesas</p><p className="text-lg font-black text-rose-600">{formatMoney(totalOut)}</p></div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/5">
           <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
           <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Atual</p><p className="text-lg font-black text-emerald-400">{formatMoney(totalIn - totalOut)}</p></div>
        </div>
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
                {(activeTab === 'in' ? state.cashIn : state.cashOut).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{item.date.split('-').reverse().join('/')}</td>
                    <td className="px-8 py-4 text-[10px] font-black uppercase text-slate-800">{item.reference}</td>
                    <td className="px-8 py-4"><span className="text-[8px] font-black uppercase bg-slate-100 px-3 py-1 rounded-lg text-slate-500">{item.category}</span></td>
                    <td className={`px-8 py-4 text-right font-black text-sm ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(item.value)}</td>
                    <td className="px-8 py-4 text-center"><button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
            </tbody>
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
