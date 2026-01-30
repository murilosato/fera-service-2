
import React from 'react';
import { AppState, CashIn, CashOut } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, Download, X, Wallet, Trash2 } from 'lucide-react';

interface FinanceProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Finance: React.FC<FinanceProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = React.useState<'in' | 'out'>('in');
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    value: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    type: ''
  });

  const deleteEntry = (id: string) => {
    if(window.confirm("Deseja realmente excluir este lançamento? Esta ação é irreversível.")) {
      setState(prev => ({ ...prev, cashIn: prev.cashIn.filter(c => c.id !== id) }));
    }
  };

  const deleteExit = (id: string) => {
    if(window.confirm("Deseja realmente excluir este lançamento?")) {
      setState(prev => ({ ...prev, cashOut: prev.cashOut.filter(c => c.id !== id) }));
    }
  };

  const totalIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const totalOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);
  const balance = totalIn - totalOut;

  const formatDate = (dateStr: string) => dateStr.split('-').reverse().join('/');

  const handleSaveMove = (e: React.FormEvent) => {
    e.preventDefault();
    const valueNum = parseFloat(formData.value);
    if (isNaN(valueNum)) return;

    if (activeTab === 'in') {
      const newItem: CashIn = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: state.currentUser?.companyId || 'default-company',
        date: formData.date,
        value: valueNum,
        reference: formData.reference,
        type: formData.type || 'Faturamento'
      };
      setState(prev => ({ ...prev, cashIn: [...prev.cashIn, newItem] }));
    } else {
      const newItem: CashOut = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: state.currentUser?.companyId || 'default-company',
        date: formData.date,
        value: valueNum,
        type: formData.type || 'Geral'
      };
      setState(prev => ({ ...prev, cashOut: [...prev.cashOut, newItem] }));
    }
    setShowForm(false);
    setFormData({ value: '', date: new Date().toISOString().split('T')[0], reference: '', type: '' });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gestão Financeira</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Fluxo de Caixa e Controle de Custos</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-5 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> NOVO LANÇAMENTO
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded flex items-center gap-4">
           <ArrowUpCircle className="text-emerald-500" size={24} />
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entradas</p>
              <p className="text-xl font-black text-slate-800">R$ {formatMoney(totalIn)}</p>
           </div>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded flex items-center gap-4">
           <ArrowDownCircle className="text-rose-500" size={24} />
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Saídas</p>
              <p className="text-xl font-black text-slate-800">R$ {formatMoney(totalOut)}</p>
           </div>
        </div>
        <div className="bg-slate-900 p-5 rounded flex items-center gap-4 text-white shadow-lg">
           <Wallet className="text-emerald-400" size={24} />
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo Atual</p>
              <p className="text-xl font-black">R$ {formatMoney(balance)}</p>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
           <button onClick={() => setActiveTab('in')} className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === 'in' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}>Entradas</button>
           <button onClick={() => setActiveTab('out')} className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === 'out' ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600' : 'text-slate-400 hover:bg-slate-50'}`}>Saídas</button>
        </div>

        <table className="w-full text-left">
           <thead>
              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                 <th className="px-6 py-4">Data</th>
                 <th className="px-6 py-4">Referência</th>
                 <th className="px-6 py-4">Categoria</th>
                 <th className="px-6 py-4 text-right">Valor</th>
                 <th className="px-6 py-4 text-center">Ações</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {(activeTab === 'in' ? state.cashIn : state.cashOut).map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{formatDate(item.date)}</td>
                   <td className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-tight">{(item as any).reference || 'Gasto Operacional'}</td>
                   <td className="px-6 py-4">
                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{item.type}</span>
                   </td>
                   <td className={`px-6 py-4 text-sm font-black text-right ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {formatMoney(item.value)}</td>
                   <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => activeTab === 'in' ? deleteEntry(item.id) : deleteExit(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                 <h3 className="font-black text-xs uppercase tracking-widest">Novo Lançamento Financeiro</h3>
                 <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded"><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveMove} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label>
                       <input type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-black text-sm outline-none" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Data</label>
                       <input type="date" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-xs font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Referência</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-xs font-bold uppercase outline-none" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-xs font-bold uppercase outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                       <option value="">Selecione...</option>
                       {state.financeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
                 <button className="w-full bg-slate-900 text-white py-4 rounded font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-600 transition-all">Confirmar Lançamento</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
