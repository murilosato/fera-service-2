
import React, { useState } from 'react';
import { AppState, InventoryItem } from '../types';
import { Package, Plus, Search, X, Loader2, History, Trash2, Filter, AlertTriangle, CheckCircle2, List, Undo2, ArrowRightLeft, DollarSign } from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

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
  const [movementPrice, setMovementPrice] = useState('0'); // Novo campo para valor de entrada
  const [movementDest, setMovementDest] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: '', currentQty: '0', minQty: '0', unitValue: '0' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'ok'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string } | null>(null);

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    } catch (e) { notify("Erro ao salvar material", "error"); } finally { setIsLoading(false); }
  };

  const handleMovement = async (type: 'in' | 'out') => {
    if (!selectedItemId) return notify("Selecione um produto", "error");
    if (!movementDest.trim()) return notify("Informe o Destino ou Origem", "error");
    
    const qty = parseFloat(movementQty);
    const price = parseFloat(movementPrice.replace(',', '.'));
    
    if (isNaN(qty) || qty <= 0) return notify("Quantidade inválida", "error");
    if (type === 'in' && (isNaN(price) || price < 0)) return notify("Informe o valor de entrada", "error");

    setIsLoading(true);
    try {
      const item = state.inventory.find(i => i.id === selectedItemId);
      if (!item) throw new Error();

      const newQty = type === 'in' ? Number(item.currentQty) + qty : Number(item.currentQty) - qty;
      if (type === 'out' && newQty < 0) {
        setIsLoading(false);
        return notify("Saldo insuficiente para retirada", "error");
      }

      // Atualiza saldo e preço de custo (se for entrada)
      await dbSave('inventory', { 
        id: item.id, 
        currentQty: newQty,
        unitValue: type === 'in' ? price : item.unitValue // Atualiza o preço médio/último na entrada
      });

      await dbSave('inventory_exits', {
        companyId: state.currentUser?.companyId,
        itemId: selectedItemId,
        quantity: type === 'in' ? qty : -qty,
        date: new Date().toISOString().split('T')[0],
        destination: movementDest.toUpperCase(),
        observation: type === 'in' ? `ENTRADA (+) - VALOR UN: ${formatMoney(price)}` : `RETIRADA (-) - ${item.name}`
      });

      await refreshData();
      setMovementQty('1');
      setMovementPrice('0');
      setMovementDest('');
      setItemSearchText('');
      setSelectedItemId('');
      notify("Movimentação registrada!");
    } catch (e) { notify("Erro na sincronização", "error"); } finally { setIsLoading(false); }
  };

  const handleDeleteHistory = async () => {
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
      await dbDelete('inventory_exits', confirmDelete.id);
      await refreshData();
      notify("Registro excluído do histórico");
    } catch (e) { notify("Erro ao excluir registro", "error"); } finally { 
      setIsLoading(false); 
      setConfirmDelete(null);
    }
  };

  const filteredItems = state.inventory.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(itemSearchText.toLowerCase());
    if (statusFilter === 'all') return nameMatch;
    if (statusFilter === 'critical') return nameMatch && item.currentQty <= item.minQty;
    return nameMatch && item.currentQty > item.minQty;
  });

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Almoxarifado Central</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Gestão de Insumos e Capital em Estoque</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm transition-all ${showHistory ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}
          >
             {showHistory ? <List size={16}/> : <History size={16}/>}
             {showHistory ? 'EXIBIR SALDOS' : 'HISTÓRICO MOV.'}
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
             <Plus size={16} /> CADASTRAR ITEM
          </button>
        </div>
      </header>

      {!showHistory ? (
        <>
          {/* Terminal de Movimentação com campo de Valor */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative z-40">
            <h3 className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><ArrowRightLeft size={14}/> Terminal de Lançamento e Precificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3 relative">
                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 ml-1 block">Produto</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl text-[11px] font-black outline-none focus:bg-white focus:border-slate-900 transition-all uppercase" placeholder="BUSCAR ITEM..." value={itemSearchText} onFocus={() => setIsDropdownOpen(true)} onChange={e => setItemSearchText(e.target.value)} />
                  {isDropdownOpen && itemSearchText && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] mt-2 p-2 max-h-56 overflow-auto animate-in fade-in slide-in-from-top-2">
                      {state.inventory.filter(i => i.name.toLowerCase().includes(itemSearchText.toLowerCase())).map(item => (
                        <button key={item.id} className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 flex justify-between rounded-xl transition-colors" onClick={() => { setSelectedItemId(item.id); setItemSearchText(item.name); setIsDropdownOpen(false); setMovementPrice(String(item.unitValue || 0)); }}>
                          <span className="text-[10px] font-black uppercase">{item.name}</span>
                          <span className="text-[9px] font-bold text-slate-400">SALDO: {item.currentQty}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 ml-1 block">Qtd</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-black text-[11px] outline-none focus:bg-white" value={movementQty} onChange={e => setMovementQty(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 ml-1 block">V. Unitário (R$)</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-black text-[11px] outline-none focus:bg-white" placeholder="0,00" value={movementPrice} onChange={e => setMovementPrice(e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 ml-1 block">Destino / Origem</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl font-black text-[11px] outline-none focus:bg-white uppercase" placeholder="EX: COMPRA NF 01" value={movementDest} onChange={e => setMovementDest(e.target.value)} />
              </div>
              <div className="md:col-span-3 flex gap-2">
                 <button onClick={() => handleMovement('out')} className="flex-1 bg-white border-2 border-rose-100 text-rose-600 p-3.5 rounded-2xl font-black uppercase text-[9px] hover:bg-rose-50 transition-all shadow-sm">RETIRADA</button>
                 <button onClick={() => handleMovement('in')} className="flex-1 bg-slate-900 text-white p-3.5 rounded-2xl font-black uppercase text-[9px] hover:bg-emerald-600 transition-all shadow-lg">ENTRADA</button>
              </div>
            </div>
          </div>

          {/* Lista de Saldos com Valor Total Imobilizado */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
               <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest"><Filter size={16}/> Gestão de Saldos e Custos</div>
               <div className="flex bg-slate-200 p-1 rounded-xl">
                  <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Tudo</button>
                  <button onClick={() => setStatusFilter('critical')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'critical' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Crítico</button>
                  <button onClick={() => setStatusFilter('ok')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === 'ok' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>OK</button>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Produto</th>
                    <th className="px-8 py-5 text-center">Saldo Atual</th>
                    <th className="px-8 py-5 text-right">Último Custo</th>
                    <th className="px-8 py-5 text-right">Valor em Estoque</th>
                    <th className="px-8 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-black uppercase text-slate-700">
                  {filteredItems.map(item => {
                    const isCritical = item.currentQty <= item.minQty;
                    const totalValue = (item.currentQty || 0) * (item.unitValue || 0);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-black">
                           {item.name}
                           <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                        </td>
                        <td className={`px-8 py-4 text-center font-black ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>{item.currentQty}</td>
                        <td className="px-8 py-4 text-right text-slate-400 font-bold">{formatMoney(item.unitValue || 0)}</td>
                        <td className="px-8 py-4 text-right text-emerald-600 font-black">{formatMoney(totalValue)}</td>
                        <td className="px-8 py-4 text-center">
                           {isCritical ? (
                             <span className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 mx-auto w-fit text-[9px]"><AlertTriangle size={12}/> CRÍTICO</span>
                           ) : (
                             <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 mx-auto w-fit text-[9px]"><CheckCircle2 size={12}/> OK</span>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                   <tr>
                      <td colSpan={3} className="px-8 py-4 text-[9px] font-black uppercase tracking-widest">Patrimônio Líquido em Almoxarifado</td>
                      <td className="px-8 py-4 text-right text-emerald-400 text-sm font-black">
                         {formatMoney(filteredItems.reduce((acc, item) => acc + ((item.currentQty || 0) * (item.unitValue || 0)), 0))}
                      </td>
                      <td></td>
                   </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Histórico Detalhado de Movimentações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b">
                 <tr>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Destino / Origem</th>
                    <th className="px-8 py-5 text-center">Qtd</th>
                    <th className="px-8 py-5">Observações / Detalhes</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-[10px] font-black uppercase text-slate-600">
                 {state.inventoryExits.map(exit => (
                   <tr key={exit.id} className="hover:bg-slate-50/30 transition-colors group">
                     <td className="px-8 py-4">{exit.date.split('-').reverse().join('/')}</td>
                     <td className="px-8 py-4">
                       <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${exit.quantity > 0 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`}>
                         {exit.destination}
                       </span>
                     </td>
                     <td className={`px-8 py-4 text-center font-black ${exit.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {exit.quantity > 0 ? '+' : ''}{exit.quantity}
                     </td>
                     <td className="px-8 py-4 text-slate-400 italic">{exit.observation}</td>
                     <td className="px-8 py-4 text-center">
                        <button onClick={() => setConfirmDelete({ isOpen: true, id: exit.id })} className="p-2 text-slate-200 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <form onSubmit={handleAddItem} className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Novo Material</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-slate-900"><X/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nomenclatura</label>
                <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="EX: FIO DE NYLON 3.0MM" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  <option value="">SELECIONE...</option>
                  {state.inventoryCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Saldo Inicial</label>
                  <input type="number" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={newItem.currentQty} onChange={e => setNewItem({...newItem, currentQty: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor Unit. (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" value={newItem.unitValue} onChange={e => setNewItem({...newItem, unitValue: e.target.value})} />
                </div>
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all hover:bg-emerald-600">
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'CADASTRAR MATERIAL'}
            </button>
          </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!confirmDelete?.isOpen} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDeleteHistory} 
        title="Remover Registro" 
        message="Deseja excluir este registro do histórico? O saldo de estoque não será alterado automaticamente."
      />
    </div>
  );
};
export default Inventory;
