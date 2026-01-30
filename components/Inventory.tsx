
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppState, InventoryItem, InventoryExit } from '../types';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  ArrowRightLeft, 
  X, 
  Trash2, 
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ListFilter,
  ChevronDown,
  Filter,
  CheckCircle2,
  Tag
} from 'lucide-react';

interface InventoryProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Inventory: React.FC<InventoryProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estados para o painel de movimentação com busca
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearchText, setItemSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [movementQty, setMovementQty] = useState('1');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'insumos',
    currentQty: 0,
    minQty: 0,
    unitValue: 0
  });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  // Lógica de filtragem combinada
  const filteredItems = state.inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    const isCritical = item.currentQty <= item.minQty;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'critical' && isCritical) || 
                         (statusFilter === 'ok' && !isCritical);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredDropdownItems = useMemo(() => {
    return state.inventory
      .filter(item => item.name.toLowerCase().includes(itemSearchText.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.inventory, itemSearchText]);

  const handleMovement = (type: 'in' | 'out') => {
    if (!selectedItemId) {
      alert("Selecione um item da lista primeiro.");
      return;
    }
    const qty = parseInt(movementQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Insira uma quantidade válida.");
      return;
    }

    const item = state.inventory.find(i => i.id === selectedItemId);
    if (type === 'out' && item && item.currentQty < qty) {
      if (!window.confirm(`Saldo insuficiente (${item.currentQty}). Deseja negativar o estoque?`)) return;
    }

    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => {
        if (i.id !== selectedItemId) return i;
        const newQty = type === 'in' ? i.currentQty + qty : i.currentQty - qty;
        return { ...i, currentQty: newQty };
      }),
      inventoryExits: [
        ...prev.inventoryExits,
        {
          id: Math.random().toString(36).substr(2, 9),
          companyId: state.currentUser?.companyId || 'default-company',
          itemId: selectedItemId,
          quantity: qty,
          date: new Date().toISOString().split('T')[0],
          destination: type === 'in' ? 'Reposição' : 'Operação Diária',
          observation: type === 'in' ? 'Entrada centralizada' : 'Saída centralizada'
        }
      ]
    }));

    setMovementQty('1');
    setSelectedItemId('');
    setItemSearchText('');
  };

  const deleteMovement = (movementId: string) => {
    const movement = state.inventoryExits.find(m => m.id === movementId);
    if (!movement) return;

    const item = state.inventory.find(i => i.id === movement.itemId);
    const isEntry = movement.destination === 'Reposição';

    if (window.confirm(`Estornar este lançamento de ${movement.quantity} unidades?`)) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => {
          if (i.id !== movement.itemId) return i;
          const adjustment = isEntry ? -movement.quantity : movement.quantity;
          return { ...i, currentQty: i.currentQty + adjustment };
        }),
        inventoryExits: prev.inventoryExits.filter(m => m.id !== movementId)
      }));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.currentUser?.companyId || 'default-company',
      name: newItem.name!,
      category: newItem.category as any,
      currentQty: newItem.currentQty || 0,
      minQty: newItem.minQty || 0,
      unitValue: newItem.unitValue
    };

    setState(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
    setShowAddForm(false);
    setNewItem({ name: '', category: 'insumos', currentQty: 0, minQty: 0, unitValue: 0 });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">Almoxarifado</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Lançamento e Controle de Saldo</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={18} strokeWidth={3} /> Cadastrar Produto
        </button>
      </div>

      {/* PAINEL DE MOVIMENTAÇÃO CENTRALIZADO */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm relative z-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ArrowRightLeft size={20} />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lançar Entrada ou Saída</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* BUSCA DE ITEM DINÂMICA */}
          <div className="md:col-span-6 space-y-1 relative" ref={dropdownRef}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Item</label>
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDropdownOpen ? 'text-blue-500' : 'text-slate-400'}`} size={16} />
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 pl-11 pr-10 py-4 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Digite o nome do produto..."
                value={itemSearchText}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={e => {
                  setItemSearchText(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedItemId) setSelectedItemId(''); // Reseta seleção se digitar
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {selectedItemId && (
                  <button 
                    onClick={() => {
                      setSelectedItemId('');
                      setItemSearchText('');
                    }}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                  >
                    <X size={14} />
                  </button>
                )}
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* LISTA FILTRADA */}
              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto z-[100]">
                  {filteredDropdownItems.length > 0 ? (
                    filteredDropdownItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0 hover:bg-blue-50 group ${selectedItemId === item.id ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setItemSearchText(item.name.toUpperCase());
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-tight ${selectedItemId === item.id ? 'text-blue-600' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black ${item.currentQty <= item.minQty ? 'text-rose-500' : 'text-slate-400'}`}>
                            Saldo: {item.currentQty}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase italic">Nenhum item encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
            <input 
              type="number"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              value={movementQty}
              onChange={e => setMovementQty(e.target.value)}
            />
          </div>

          <div className="md:col-span-4 flex gap-2">
            <button 
              onClick={() => handleMovement('out')}
              className="flex-1 bg-white border-2 border-slate-100 text-slate-600 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowDownCircle size={16} /> Saída
            </button>
            <button 
              onClick={() => handleMovement('in')}
              className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              <ArrowUpCircle size={16} /> Entrada
            </button>
          </div>
        </div>
      </div>

      {/* TABELA DE ESTOQUE ATUAL COM FILTROS */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative z-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center"><ListFilter size={16} /></div>
               <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">Saldo em Estoque</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 w-full md:w-64"
                placeholder="Pesquisar no saldo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* BARRA DE FILTROS ADICIONAIS */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              <Tag size={14} className="text-slate-400" />
              <select 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas Categorias</option>
                <option value="peças">Peças</option>
                <option value="insumos">Insumos</option>
                <option value="EPIs">EPIs</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              <Filter size={14} className="text-slate-400" />
              <select 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos Status</option>
                <option value="ok">Status: OK</option>
                <option value="critical">Status: Crítico</option>
              </select>
            </div>

            {(categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm !== '') && (
              <button 
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="text-[9px] font-black text-blue-600 uppercase hover:underline"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-8 py-5">Produto</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5 text-center">Mínimo</th>
                <th className="px-8 py-5 text-right">Saldo Atual</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isCritical = item.currentQty <= item.minQty;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-800 text-sm uppercase">{item.name}</td>
                    <td className="px-8 py-5">
                       <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">
                         {item.category}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-center text-slate-400 font-bold">{item.minQty}</td>
                    <td className={`px-8 py-5 text-right font-black text-lg ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                      {item.currentQty}
                    </td>
                    <td className="px-8 py-5 text-center">
                       {isCritical ? (
                         <div className="flex items-center justify-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full inline-flex">
                            <AlertCircle size={12} strokeWidth={3} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Crítico</span>
                         </div>
                       ) : (
                         <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex">
                            <CheckCircle2 size={12} strokeWidth={3} />
                            <span className="text-[8px] font-black uppercase tracking-widest">OK</span>
                         </div>
                       )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-300 font-black uppercase italic text-xs">
                    Nenhum item corresponde aos filtros selecionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTÓRICO DE MOVIMENTAÇÕES */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
          <HistoryIcon size={18} className="text-blue-600" />
          <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">Histórico Recente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4">Item</th>
                <th className="px-8 py-4">Qtd</th>
                <th className="px-8 py-4">Operação</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
              {state.inventoryExits.slice(-10).reverse().map(exit => {
                const item = state.inventory.find(i => i.id === exit.itemId);
                const isOut = exit.destination !== 'Reposição';
                return (
                  <tr key={exit.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-4 text-slate-400 font-bold">{formatDate(exit.date)}</td>
                    <td className="px-8 py-4 font-black text-slate-800 uppercase">{item?.name || 'Item Removido'}</td>
                    <td className={`px-8 py-4 font-black ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isOut ? '-' : '+'}{exit.quantity}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isOut ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {exit.destination}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button 
                        onClick={() => deleteMovement(exit.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                        title="Estornar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {state.inventoryExits.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-300 font-bold uppercase tracking-wider">Sem movimentações</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cadastrar Novo Produto</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X /></button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Ex: Fio de Nylon" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd Inicial</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/20" value={newItem.currentQty} onChange={e => setNewItem({...newItem, currentQty: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd Mínima</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/20" value={newItem.minQty} onChange={e => setNewItem({...newItem, minQty: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                  <option value="peças">Peças</option>
                  <option value="insumos">Insumos</option>
                  <option value="EPIs">EPIs</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all mt-4">Salvar Cadastro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryIcon = ({size, className}: {size: number, className: string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Inventory;
