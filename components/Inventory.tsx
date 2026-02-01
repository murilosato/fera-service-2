
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
      notify("Item cadastrado com sucesso!");
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

      await dbSave('inventory', { ...item, currentQty: newQty });
      await dbSave('inventory_exits', {
        companyId: state.currentUser?.companyId,
        itemId: selectedItemId,
        quantity: qty,
        date: new Date().toISOString().split('T')[0],
        destination: type === 'in' ? 'ALMOXARIFADO CENTRAL' : 'EQUIPE DE CAMPO',
        observation: type === 'in' ? `ENTRADA MANUAL (+${qty})` : `SAÍDA MANUAL (-${qty})`
      });

      await refreshData();
      setMovementQty('1');
      setSelectedItemId('');
      setItemSearchText('');
      notify("Movimentação processada");
    } catch (e) { notify("Erro na sincronização Cloud", "error"); } finally { setIsLoading(false); }
  };

  const handleDeleteExit = async (id: string) => {
    if (!confirm("Remover permanentemente esta movimentação do histórico?")) return;
    try {
      await dbDelete('inventory_exits', id);
      await refreshData();
      notify("Movimentação removida");
    } catch (e) { notify("Erro ao excluir registro", "error"); }
  };

  const filteredItems = state.inventory.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(itemSearchText.toLowerCase());
    if (statusFilter === 'all') return nameMatch;
    if (statusFilter === 'critical') return nameMatch && item.currentQty <= item.minQty;
    return nameMatch && item.currentQty > item.minQty;
  });

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">Almoxarifado & Estoque</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão Centralizada de Insumos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="bg-white border text-slate-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-sm hover:border-slate-300">
             <History size={16}/> {showHistory ? 'EXIBIR ESTOQUE' : 'VER MOVIMENTAÇÃO'}
          </button>
          <button onClick={() => { setShowAddForm(true); setNewItem({...newItem, category: state.inventoryCategories[0] || ''}); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2">
             <Plus size={16} /> NOVO MATERIAL
          </button>
        </div>
      </header>

      {showHistory ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-6 border-b bg-slate-50 flex items-center gap-3"><History size={18} className="text-blue-500"/><h3 className="text-[10px] font-black uppercase tracking-widest">Fluxo Recente de Materiais</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b">
                <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Item</th><th className="px-8 py-4">Quantidade</th><th className="px-8 py-4">Destino/Origem</th><th className="px-8 py-4 text-center">Ações</th></tr>
              </thead>
              <tbody className="divide-y text-[10px] font-black uppercase text-slate-700">
                {state.inventoryExits.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 text-slate-500">{ex.date.split('-').reverse().join('/')}</td>
                    <td className="px-8 py-4">{state.inventory.find(i => i.id === ex.itemId)?.name || '---'}</td>
                    <td className={`px-8 py-4 flex items-center gap-2 ${ex.observation.includes('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                       {ex.observation.includes('-') ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                       {ex.quantity}
                    </td>
                    <td className="px-8 py-4 text-slate-400">{ex.destination}</td>
                    <td className="px-8 py-4 text-center">
                       <button onClick={() => handleDeleteExit(ex.id)} className="text-slate-200 hover:text-rose-600 transition-all"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative z-40">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Terminal de Movimentação Cloud</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-6 relative">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 block">BUSCAR PRODUTO</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-slate-900 transition-all" placeholder="DIGITE O NOME DO ITEM..." value={itemSearchText} onFocus={() => setIsDropdownOpen(true)} onChange={e => setItemSearchText(e.target.value)} />
                  {isDropdownOpen && itemSearchText && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] mt-2 p-2 max-h-56 overflow-auto">
                      {state.inventory.filter(i => i.name.toLowerCase().includes(itemSearchText.toLowerCase())).map(item => (
                        <button key={item.id} className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center rounded-xl" onClick={() => { setSelectedItemId(item.id); setItemSearchText(item.name); setIsDropdownOpen(false); }}>
                          <span className="text-[10px] font-black uppercase">{item.name}</span>
                          <span className="text-[9px] font-bold text-slate-400">SALDO: {item.currentQty}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 block">QUANTIDADE</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={movementQty} onChange={e => setMovementQty(e.target.value)} />
              </div>
              <div className="md:col-span-4 flex gap-3">
                 <button onClick={() => handleMovement('out')} disabled={isLoading} className="flex-1 bg-white border border-rose-200 text-rose-600 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-rose-50 shadow-sm transition-all">RETIRADA (-)</button>
                 <button onClick={() => handleMovement('in')} disabled={isLoading} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-blue-700 transition-all">ENTRADA (+)</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 text-slate-500"><Filter size={16}/><h3 className="text-[10px] font-black uppercase tracking-widest">Estoque Consolidado</h3></div>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Tudo</button>
                  <button onClick={() => setStatusFilter('critical')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'critical' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Crítico</button>
                  <button onClick={() => setStatusFilter('ok')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'ok' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>OK</button>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100">
                  <tr><th className="px-8 py-5">Nome do Material</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5 text-right">Saldo Atual</th><th className="px-8 py-5 text-center">Status Operacional</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-black uppercase text-slate-700">
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center italic text-slate-300">Nenhum item filtrado</td></tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">{item.name}</td>
                        <td className="px-8 py-4"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500">{item.category}</span></td>
                        <td className={`px-8 py-4 text-right font-black text-sm ${item.currentQty <= item.minQty ? 'text-rose-600' : 'text-slate-800'}`}>{item.currentQty}</td>
                        <td className="px-8 py-4 text-center">
                           {item.currentQty <= item.minQty ? (
                             <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-[8px] font-black"><AlertTriangle size={10}/> CRÍTICO</span>
                           ) : (
                             <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[8px] font-black"><CheckCircle2 size={10}/> OK</span>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <form onSubmit={handleAddItem} className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-xs font-black uppercase">Novo Material Cloud</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">NOME DO MATERIAL</label>
                <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="EX: FIO DE NYLON STIHL" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CATEGORIA</label>
                <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  <option value="">SELECIONE CATEGORIA</option>
                  {state.inventoryCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">SALDO INICIAL</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={newItem.currentQty} onChange={e => setNewItem({...newItem, currentQty: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ESTOQUE MÍN</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={newItem.minQty} onChange={e => setNewItem({...newItem, minQty: e.target.value})} />
                </div>
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-emerald-600 transition-all">
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'CADASTRAR MATERIAL'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default Inventory;
