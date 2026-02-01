
import React, { useState } from 'react';
import { AppState, InventoryItem } from '../types';
import { Package, Plus, Search, X, Loader2, History, ArrowDownLeft, ArrowUpRight, Trash2, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface InventoryProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Inventory: React.FC<InventoryProps> = ({ state, setState, notify }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearchText, setItemSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [movementQty, setMovementQty] = useState('1');
  const [newItem, setNewItem] = useState({ name: '', category: '', currentQty: '0', minQty: '0', unitValue: '0' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'ok'>('all');

  const refreshData = async () => {
    if (state.currentUser?.companyId || state.currentUser?.role === 'DIRETORIA_MASTER') {
      const data = await fetchCompleteCompanyData(state.currentUser?.companyId || null, state.currentUser?.role === 'DIRETORIA_MASTER');
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category) return notify("Nome e categoria obrigatórios", "error");
    setIsLoading(true);
    try {
      await dbSave('inventory', {
        companyId: state.currentUser?.companyId,
        name: newItem.name.toUpperCase(),
        category: newItem.category,
        currentQty: parseFloat(newItem.currentQty),
        minQty: parseFloat(newItem.minQty),
        unitValue: parseFloat(newItem.unitValue)
      });
      await refreshData();
      setShowAddForm(false);
      setNewItem({ name: '', category: '', currentQty: '0', minQty: '0', unitValue: '0' });
      notify("Item sincronizado");
    } catch (e) { notify("Erro ao salvar no cloud", "error"); } finally { setIsLoading(false); }
  };

  const handleMovement = async (type: 'in' | 'out') => {
    if (!selectedItemId) return notify("Selecione um produto", "error");
    const qty = parseFloat(movementQty);
    if (isNaN(qty) || qty <= 0) return notify("Qtd inválida", "error");

    setIsLoading(true);
    try {
      const item = state.inventory.find(i => i.id === selectedItemId);
      if (!item) throw new Error();

      const newQty = type === 'in' ? Number(item.currentQty) + qty : Number(item.currentQty) - qty;
      if (type === 'out' && newQty < 0) {
        setIsLoading(false);
        return notify("Saldo insuficiente", "error");
      }

      await dbSave('inventory', { id: item.id, currentQty: newQty });
      await dbSave('inventory_exits', {
        companyId: state.currentUser?.companyId,
        itemId: selectedItemId,
        quantity: qty,
        date: new Date().toISOString().split('T')[0],
        destination: type === 'in' ? 'ALMOXARIFADO' : 'CAMPO',
        observation: type === 'in' ? `ENTRADA (+${qty})` : `SAÍDA (-${qty})`
      });

      await refreshData();
      setMovementQty('1');
      notify("Movimentação processada");
    } catch (e) { notify("Erro na sincronização", "error"); } finally { setIsLoading(false); }
  };

  const filteredItems = state.inventory.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(itemSearchText.toLowerCase());
    if (statusFilter === 'all') return nameMatch;
    if (statusFilter === 'critical') return nameMatch && item.currentQty <= item.minQty;
    return nameMatch && item.currentQty > item.minQty;
  });

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">Almoxarifado</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Saldos de Insumos e Materiais</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="bg-white border text-slate-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-sm">
             <History size={16}/> {showHistory ? 'ESTOQUE' : 'HISTÓRICO'}
          </button>
          <button onClick={() => { setShowAddForm(true); setNewItem({...newItem, category: state.inventoryCategories[0] || ''}); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2">
             <Plus size={16} /> NOVO ITEM
          </button>
        </div>
      </header>

      {/* Terminal de Movimentação */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative z-40">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-6 relative">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 block">BUSCAR PRODUTO</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-xs font-black outline-none" placeholder="PESQUISAR NOME..." value={itemSearchText} onFocus={() => setIsDropdownOpen(true)} onChange={e => setItemSearchText(e.target.value)} />
              {isDropdownOpen && itemSearchText && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] mt-2 p-2 max-h-56 overflow-auto">
                  {state.inventory.filter(i => i.name.toLowerCase().includes(itemSearchText.toLowerCase())).map(item => (
                    <button key={item.id} className="w-full text-left p-4 hover:bg-slate-50 border-b flex justify-between rounded-xl" onClick={() => { setSelectedItemId(item.id); setItemSearchText(item.name); setIsDropdownOpen(false); }}>
                      <span className="text-[10px] font-black uppercase">{item.name}</span>
                      <span className="text-[9px] font-bold text-slate-400">QTD: {item.currentQty}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 block">QTD</label>
            <input type="number" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs" value={movementQty} onChange={e => setMovementQty(e.target.value)} />
          </div>
          <div className="md:col-span-4 flex gap-3">
             <button onClick={() => handleMovement('out')} className="flex-1 bg-white border border-rose-200 text-rose-600 p-4 rounded-2xl font-black uppercase text-[10px]">RETIRADA</button>
             <button onClick={() => handleMovement('in')} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px]">ENTRADA</button>
          </div>
        </div>
      </div>

      {/* Lista de Estoque com Filtro */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase"><Filter size={16}/> Filtro Operacional</div>
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Tudo</button>
              <button onClick={() => setStatusFilter('critical')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${statusFilter === 'critical' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Crítico</button>
              <button onClick={() => setStatusFilter('ok')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${statusFilter === 'ok' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>OK</button>
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b">
            <tr><th className="px-8 py-5">Produto</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5 text-right">Saldo Atual</th><th className="px-8 py-5 text-center">Status</th></tr>
          </thead>
          <tbody className="divide-y text-[11px] font-black uppercase">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-8 py-4">{item.name}</td>
                <td className="px-8 py-4"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px]">{item.category}</span></td>
                <td className={`px-8 py-4 text-right font-black ${item.currentQty <= item.minQty ? 'text-rose-600' : 'text-slate-800'}`}>{item.currentQty}</td>
                <td className="px-8 py-4 text-center">
                   {item.currentQty <= item.minQty ? <span className="text-rose-600 flex justify-center gap-1"><AlertTriangle size={12}/> CRÍTICO</span> : <span className="text-emerald-600 flex justify-center gap-1"><CheckCircle2 size={12}/> OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <form onSubmit={handleAddItem} className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xs font-black uppercase">Novo Material</h3>
              <button type="button" onClick={() => setShowAddForm(false)}><X/></button>
            </div>
            <div className="space-y-4">
              <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" placeholder="NOME DO MATERIAL" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="">SELECIONE CATEGORIA</option>
                {state.inventoryCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs" placeholder="Saldo Inicial" value={newItem.currentQty} onChange={e => setNewItem({...newItem, currentQty: e.target.value})} />
                <input type="number" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs" placeholder="Mínimo" value={newItem.minQty} onChange={e => setNewItem({...newItem, minQty: e.target.value})} />
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl">
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'CADASTRAR MATERIAL'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default Inventory;
