
import React from 'react';
import { AppState, CashIn, CashOut } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, FileText, Download, X, Wallet } from 'lucide-react';

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

  const totalIn = state.cashIn.reduce((acc, c) => acc + c.value, 0);
  const totalOut = state.cashOut.reduce((acc, c) => acc + c.value, 0);
  const balance = totalIn - totalOut;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const handleSaveMove = (e: React.FormEvent) => {
    e.preventDefault();
    const valueNum = parseFloat(formData.value);
    if (isNaN(valueNum)) return;

    if (activeTab === 'in') {
      const newItem: CashIn = {
        id: Math.random().toString(36).substr(2, 9),
        date: formData.date,
        value: valueNum,
        reference: formData.reference,
        type: formData.type || 'Recebimento'
      };
      setState(prev => ({ ...prev, cashIn: [...prev.cashIn, newItem] }));
    } else {
      const newItem: CashOut = {
        id: Math.random().toString(36).substr(2, 9),
        date: formData.date,
        value: valueNum,
        type: formData.type || 'Pagamento'
      };
      setState(prev => ({ ...prev, cashOut: [...prev.cashOut, newItem] }));
    }
    setShowForm(false);
    setFormData({ value: '', date: new Date().toISOString().split('T')[0], reference: '', type: '' });
  };

  const exportToCSV = () => {
    const data = activeTab === 'in' ? state.cashIn : state.cashOut;
    const headers = activeTab === 'in' ? "ID;Data;Valor;Referencia;Tipo" : "ID;Data;Valor;Tipo";
    // Ajustado para formatar o valor com vírgula para Excel BR
    const rows = data.map(item => {
        const values = Object.values(item);
        const formatted = values.map(v => typeof v === 'number' ? formatMoney(v) : v);
        return formatted.join(";");
    }).join("\n");
    const blob = new Blob(["\ufeff" + `${headers}\n${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestao_urbana_financeiro_${activeTab}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-slate-500">Fluxo de caixa e controle de medições mensais.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={exportToCSV}
            className="bg-white text-slate-600 border border-slate-200 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} /> Exportar CSV
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={20} /> Lançar Movimento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
             <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Entradas</p>
            <p className="text-2xl font-black text-slate-800">R$ {formatMoney(totalIn)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
             <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Saídas</p>
            <p className="text-2xl font-black text-slate-800">R$ {formatMoney(totalOut)}</p>
          </div>
        </div>
        <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
             <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] text-blue-200 font-bold uppercase">Saldo em Caixa</p>
            <p className="text-2xl font-black">R$ {formatMoney(balance)}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Novo Lançamento</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleSaveMove} className="p-8 space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button" onClick={() => setActiveTab('in')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'in' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >Entrada</button>
                <button 
                  type="button" onClick={() => setActiveTab('out')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'out' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >Saída</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Valor (R$)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full border p-3 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Data</label>
                  <input 
                    type="date" required
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Referência / Categoria</label>
                <input 
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Parcela Contrato Março"
                  value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Subtipo</label>
                <select 
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {activeTab === 'in' ? (
                    <>
                      <option value="1ª parcela">1ª Parcela (5º útil)</option>
                      <option value="2ª parcela">2ª Parcela (Dia 15)</option>
                      <option value="reajuste">Reajuste</option>
                      <option value="extra">Extra</option>
                    </>
                  ) : (
                    <>
                      <option value="salario">Salário Funcionários</option>
                      <option value="compra">Compra Insumos</option>
                      <option value="manutencao">Manutenção Máquinas</option>
                      <option value="imposto">Impostos</option>
                    </>
                  )}
                </select>
              </div>

              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('in')}
            className={`flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2 border-b-2 ${activeTab === 'in' ? 'border-emerald-500 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <ArrowUpCircle size={18} /> ENTRADAS
          </button>
          <button 
            onClick={() => setActiveTab('out')}
            className={`flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2 border-b-2 ${activeTab === 'out' ? 'border-rose-500 text-rose-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <ArrowDownCircle size={18} /> SAÍDAS
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 text-left text-[10px] uppercase text-slate-400 font-black tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Referência / Motivo</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'in' ? state.cashIn : state.cashOut).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">Nenhum registro encontrado para este filtro.</td>
                </tr>
              )}
              {(activeTab === 'in' ? state.cashIn : state.cashOut).map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{formatDate(item.date)}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase tracking-tight">{item.reference || 'NÃO ESPECIFICADO'}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${activeTab === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className={`px-8 py-5 text-lg font-black text-right ${activeTab === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {formatMoney(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Finance;
