
import React, { useState } from 'react';
import { AppState, CashIn, CashOut } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, X, Wallet, Trash2, Clock, Loader2 } from 'lucide-react';
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
    if (isNaN(val) || val <= 0) {
      alert("Insira um valor válido");
      return;
    }

    if (!state.currentUser?.companyId || state.currentUser.companyId === 'setup-pending') {
      alert("Aguarde a sincronização do perfil...");
      return;
    }

    setIsLoading(true);
    try {
      await dbSave('cash_flow', {
        company_id: state.currentUser.companyId,
        type: activeTab,
        value: val,
        date: formData.date,
        reference: formData.reference || 'Sem referência',
        category: formData.category || 'Geral'
      });
      await refreshData();
      setShowForm(false);
      setFormData({ value: '', date: new Date().toISOString().split('T')[0], reference: '', category: '' });
    } catch (e: any) {
      alert("Erro ao registrar: " + (e.message || "Erro de conexão"));
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
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Fluxo de Caixa</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de receitas e despesas cloud</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2">
          <Plus size={16} /> Novo Lançamento
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ArrowUpCircle size={24} />
           </div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entradas</p><p className="text-lg font-black text-emerald-600">R$ {formatMoney(totalIn)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <ArrowDownCircle size={24} />
           </div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saídas</p><p className="text-lg font-black text-rose-600">R$ {formatMoney(totalOut)}</p></div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Wallet size={24} />
           </div>
           <div><p className="text-[9px] font-black text-slate-400/60 uppercase tracking-widest">Saldo Disponível</p><p className="text-lg font-black">R$ {formatMoney(balance)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex bg-slate-50 p-1.5 border-b border-slate-100">
           <button onClick={() => setActiveTab('in')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl transition-all tracking-widest ${activeTab === 'in' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Visualizar Entradas</button>
           <button onClick={() => setActiveTab('out')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl transition-all tracking-widest ${activeTab === 'out' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Visualizar Saídas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50/50 tracking-widest">
                <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Referência / Descrição</th><th className="px-8 py-4 text-right">Valor do Título</th><th className="px-8 py-4 text-center">Ação</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {(activeTab === 'in' ? state.cashIn : state.cashOut).length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-[10px] font-bold text-slate-300 uppercase italic">Nenhum registro encontrado</td></tr>
                ) : (
                  (activeTab === 'in' ? state.cashIn : state.cashOut).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{item.date.split('-').reverse().join('/')}</td>
                      <td className="px-8 py-4 text-[11px] font-black uppercase text-slate-700">{item.reference}</td>
                      <td className={`px-8 py-4 text-right font-black ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {formatMoney(item.value)}</td>
                      <td className="px-8 py-4 text-center">
                          <button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleSaveMove} className="bg-white rounded-[40px] w-full max-w-sm p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-black uppercase text-xs text-slate-900 tracking-tight">Novo Lançamento</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{activeTab === 'in' ? 'Entrada de Receita' : 'Saída de Despesa'}</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none focus:border-slate-900" placeholder="0,00" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Lançamento</label>
                    <input type="date" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Referência</label>
                    <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs uppercase outline-none focus:border-slate-900" placeholder="Ex: Aluguel de Máquina" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                 </div>
                 <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                   {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'EFETIVAR LANÇAMENTO'}
                 </button>
              </div>
           </form>
        </div>
      )}
      <ConfirmationModal isOpen={!!confirmDelete?.isOpen} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Excluir Registro" message="Esta ação é permanente e não poderá ser desfeita no banco de dados." />
    </div>
  );
};

export default Finance;
