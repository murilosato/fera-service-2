
import React, { useState } from 'react';
import { AppState, CashIn, CashOut } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, X, Wallet, Trash2, Clock } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface FinanceProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Finance: React.FC<FinanceProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string } | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    category: ''
  });

  const refreshData = async () => {
    const data = await fetchCompleteCompanyData(state.currentUser?.companyId || null);
    if (data) setState(prev => ({ ...prev, ...data }));
  };

  const handleSaveMove = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.value);
    if (isNaN(val) || val <= 0) return;

    setIsLoading(true);
    try {
      await dbSave('cash_flow', {
        company_id: state.currentUser?.companyId,
        type: activeTab,
        value: val,
        date: formData.date,
        reference: formData.reference,
        category: formData.category || 'Geral'
      });
      await refreshData();
      setShowForm(false);
      setFormData({ value: '', date: new Date().toISOString().split('T')[0], reference: '', category: '' });
    } catch (e) {
      alert("Erro ao registrar no banco.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await dbDelete('cash_flow', confirmDelete.id);
      await refreshData();
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  const totalIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const totalOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Financeiro Cloud</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Registros em tempo real</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">
          <Plus size={16} className="inline mr-2" /> Novo Lançamento
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <ArrowUpCircle className="text-emerald-500" size={32} />
           <div><p className="text-[9px] font-black text-slate-400 uppercase">Entradas</p><p className="text-lg font-black">R$ {formatMoney(totalIn)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <ArrowDownCircle className="text-rose-500" size={32} />
           <div><p className="text-[9px] font-black text-slate-400 uppercase">Saídas</p><p className="text-lg font-black">R$ {formatMoney(totalOut)}</p></div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
           <Wallet className="text-emerald-400" size={32} />
           <div><p className="text-[9px] font-black text-slate-400 uppercase">Saldo</p><p className="text-lg font-black">R$ {formatMoney(balance)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex bg-slate-50 p-1 border-b">
           <button onClick={() => setActiveTab('in')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'in' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Entradas</button>
           <button onClick={() => setActiveTab('out')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'out' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Saídas</button>
        </div>
        <table className="w-full text-left">
           <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50/50">
              <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Referência</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-center">Ação</th></tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {(activeTab === 'in' ? state.cashIn : state.cashOut).map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                   <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{item.date}</td>
                   <td className="px-6 py-4 text-[11px] font-black uppercase">{item.reference || 'Geral'}</td>
                   <td className={`px-6 py-4 text-right font-black ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {formatMoney(item.value)}</td>
                   <td className="px-6 py-4 text-center">
                      <button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="text-slate-200 hover:text-rose-500"><Trash2 size={16} /></button>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleSaveMove} className="bg-white rounded-[32px] w-full max-w-sm p-8 space-y-6">
              <div className="flex justify-between items-center"><h3 className="font-black uppercase text-xs">Novo Lançamento</h3><button type="button" onClick={() => setShowForm(false)}><X /></button></div>
              <div className="space-y-4">
                 <input type="number" step="0.01" required className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs" placeholder="Valor (R$)" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                 <input type="date" required className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                 <input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs uppercase" placeholder="Referência (ex: Aluguel)" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                 <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                   {isLoading ? <Clock className="animate-spin inline mr-2" size={14} /> : 'SALVAR NO BANCO'}
                 </button>
              </div>
           </form>
        </div>
      )}
      <ConfirmationModal isOpen={!!confirmDelete?.isOpen} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Excluir Registro" message="Esta ação é permanente." />
    </div>
  );
};

export default Finance;
