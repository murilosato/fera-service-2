import React, { useState, useMemo } from 'react';
import { AppState, DREStatement, DREEntry } from '../types';
import { 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calculator,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { dbSave } from '../lib/supabase';

interface DREProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (message: string, type?: 'success' | 'error') => void;
}

const DRE: React.FC<DREProps> = ({ state, setState, notify }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Find existing statement for selected month
  const currentStatement = useMemo(() => {
    return state.dreStatements.find(s => s.month === selectedMonth);
  }, [state.dreStatements, selectedMonth]);

  // Calculate automatic values
  const autoRevenue = useMemo(() => {
    return state.areas
      .filter(area => area.startDate.startsWith(selectedMonth))
      .reduce((acc, area) => {
        const areaTotal = area.services.reduce((sAcc, s) => sAcc + s.totalValue, 0);
        return acc + areaTotal;
      }, 0);
  }, [state.areas, selectedMonth]);

  const autoExpenses = useMemo(() => {
    return state.cashOut
      .filter(co => co.date.startsWith(selectedMonth))
      .reduce((acc, co) => acc + co.value, 0);
  }, [state.cashOut, selectedMonth]);

  // Initialize or update entries
  const entries = useMemo(() => {
    let baseEntries: DREEntry[] = [];
    
    if (currentStatement) {
        // Update automatic values if they are not overridden
        baseEntries = currentStatement.entries.map(e => {
            if (e.id === 'revenue-os' && !e.isManualOverride) {
                return { ...e, value: autoRevenue, originalValue: autoRevenue };
            }
            if (e.id === 'expense-finance' && !e.isManualOverride) {
                return { ...e, value: autoExpenses, originalValue: autoExpenses };
            }
            return e;
        });
    } else {
        // Default entries if no statement exists
        baseEntries = [
          {
            id: 'revenue-os',
            description: 'Faturamento Bruto (O.S)',
            value: autoRevenue,
            type: 'revenue',
            isPercentage: false,
            isManualOverride: false,
            originalValue: autoRevenue
          },
          {
            id: 'expense-finance',
            description: 'Despesas Financeiras (Módulo Financeiro)',
            value: autoExpenses,
            type: 'expense',
            isPercentage: false,
            isManualOverride: false,
            originalValue: autoExpenses
          }
        ];
    }

    // Calculate total revenue from non-percentage lines to use as base for percentage lines
    const baseRevenue = baseEntries
        .filter(e => e.type === 'revenue' && !e.isPercentage)
        .reduce((acc, e) => acc + e.value, 0);

    // Update percentage lines based on current base revenue
    return baseEntries.map(e => {
        if (e.isPercentage) {
            return {
                ...e,
                value: (baseRevenue * (e.percentageValue || 0)) / 100
            };
        }
        return e;
    });
  }, [currentStatement, autoRevenue, autoExpenses]);

  const totalRevenue = entries
    .filter(e => e.type === 'revenue')
    .reduce((acc, e) => acc + e.value, 0);

  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => acc + e.value, 0);

  const netResult = totalRevenue - totalExpenses;

  const handleSave = async (updatedEntries: DREEntry[]) => {
    if (!state.currentUser?.companyId) return;
    setIsSaving(true);
    try {
      const newStatement: DREStatement = {
        id: currentStatement?.id || crypto.randomUUID(),
        companyId: state.currentUser.companyId,
        month: selectedMonth,
        entries: updatedEntries
      };

      const newStatements = currentStatement
        ? state.dreStatements.map(s => s.id === currentStatement.id ? newStatement : s)
        : [...state.dreStatements, newStatement];

      await dbSave('dre_statements', newStatement);
      setState(prev => ({ ...prev, dreStatements: newStatements }));
      notify('DRE salva com sucesso!');
    } catch (e) {
      notify('Erro ao salvar DRE', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addEntry = (type: 'revenue' | 'expense', isPercentage: boolean = false) => {
    const newEntry: DREEntry = {
      id: crypto.randomUUID(),
      description: isPercentage ? 'Nova Linha (%)' : 'Nova Linha',
      value: 0,
      type,
      isPercentage,
      percentageValue: isPercentage ? 0 : undefined,
      isManualOverride: true
    };
    handleSave([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (id === 'revenue-os' || id === 'expense-finance') {
        notify('Esta linha automática não pode ser removida.', 'error');
        return;
    }
    handleSave(entries.filter(e => e.id !== id));
  };

  const startEditing = (entry: DREEntry) => {
    setEditingEntryId(entry.id);
    setEditDescription(entry.description);
    setEditValue(entry.isPercentage ? (entry.percentageValue?.toString() || '0') : entry.value.toString());
  };

  const saveEdit = () => {
    if (!editingEntryId) return;
    
    const updatedEntries = entries.map(e => {
      if (e.id === editingEntryId) {
        const val = parseFloat(editValue) || 0;
        if (e.isPercentage) {
          return {
            ...e,
            description: editDescription,
            percentageValue: val,
            value: (totalRevenue * val) / 100,
            isManualOverride: true
          };
        } else {
          return {
            ...e,
            description: editDescription,
            value: val,
            isManualOverride: true
          };
        }
      }
      return e;
    });

    // Recalculate percentages if revenue changed
    const finalEntries = updatedEntries.map(e => {
        if (e.isPercentage) {
            const newTotalRevenue = updatedEntries
                .filter(re => re.type === 'revenue')
                .reduce((acc, re) => acc + re.value, 0);
            return {
                ...e,
                value: (newTotalRevenue * (e.percentageValue || 0)) / 100
            };
        }
        return e;
    });

    handleSave(finalEntries);
    setEditingEntryId(null);
  };

  const resetToAuto = (id: string) => {
      const updatedEntries = entries.map(e => {
          if (e.id === id) {
              const autoVal = id === 'revenue-os' ? autoRevenue : autoExpenses;
              return {
                  ...e,
                  value: autoVal,
                  originalValue: autoVal,
                  isManualOverride: false
              };
          }
          return e;
      });
      handleSave(updatedEntries);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">DRE Gerencial</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Demonstração de Resultado do Exercício</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Calendar size={16} className="text-slate-400 ml-2" />
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor / Custo Financeiro</th>
                <th className="px-8 py-5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Revenue Section */}
              <tr className="bg-emerald-50/30">
                <td colSpan={3} className="px-8 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest">Receitas</td>
              </tr>
              {entries.filter(e => e.type === 'revenue').map(entry => (
                <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    {editingEntryId === entry.id ? (
                      <input 
                        type="text" 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase p-2 focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">{entry.description}</span>
                        {entry.isManualOverride && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">Editado</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {editingEntryId === entry.id ? (
                      <div className="flex items-center justify-end gap-2">
                        {entry.isPercentage && <span className="text-[10px] font-black text-slate-400">%</span>}
                        <input 
                          type="number" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 bg-slate-50 border-none rounded-lg text-[10px] font-bold text-right p-2 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
                        {entry.isPercentage && <span className="ml-2 text-slate-400 text-[8px]">({entry.percentageValue}%)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      {editingEntryId === entry.id ? (
                        <>
                          <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={14} /></button>
                          <button onClick={() => setEditingEntryId(null)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(entry)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                          {entry.originalValue !== undefined && entry.isManualOverride && (
                              <button onClick={() => resetToAuto(entry.id)} title="Resetar para valor automático" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><RefreshCw size={14} /></button>
                          )}
                          {entry.id !== 'revenue-os' && (
                            <button onClick={() => removeEntry(entry.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Expense Section */}
              <tr className="bg-rose-50/30">
                <td colSpan={3} className="px-8 py-3 text-[9px] font-black text-rose-600 uppercase tracking-widest">Custos e Despesas</td>
              </tr>
              {entries.filter(e => e.type === 'expense').map(entry => (
                <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    {editingEntryId === entry.id ? (
                      <input 
                        type="text" 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase p-2 focus:ring-2 focus:ring-rose-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle size={14} className="text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">{entry.description}</span>
                        {entry.isManualOverride && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">Editado</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {editingEntryId === entry.id ? (
                      <div className="flex items-center justify-end gap-2">
                        {entry.isPercentage && <span className="text-[10px] font-black text-slate-400">%</span>}
                        <input 
                          type="number" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 bg-slate-50 border-none rounded-lg text-[10px] font-bold text-right p-2 focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
                        {entry.isPercentage && <span className="ml-2 text-slate-400 text-[8px]">({entry.percentageValue}%)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      {editingEntryId === entry.id ? (
                        <>
                          <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={14} /></button>
                          <button onClick={() => setEditingEntryId(null)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(entry)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                          {entry.originalValue !== undefined && entry.isManualOverride && (
                              <button onClick={() => resetToAuto(entry.id)} title="Resetar para valor automático" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><RefreshCw size={14} /></button>
                          )}
                          {entry.id !== 'expense-finance' && (
                            <button onClick={() => removeEntry(entry.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Actions */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-4">
          <button 
            onClick={() => addEntry('revenue')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Plus size={14} /> Adicionar Receita
          </button>
          <button 
            onClick={() => addEntry('expense')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Plus size={14} /> Adicionar Despesa
          </button>
          <button 
            onClick={() => addEntry('expense', true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Calculator size={14} /> Adicionar Linha (%)
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Receita Total</p>
          <p className="text-2xl font-black text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Custos Totais</p>
          <p className="text-2xl font-black text-rose-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
          </p>
        </div>
        <div className={`p-8 rounded-[32px] shadow-xl border-2 ${netResult >= 0 ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2 opacity-80">Resultado Final</p>
          <p className="text-2xl font-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netResult)}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest mt-2">
            {netResult >= 0 ? 'Lucro do Período' : 'Prejuízo do Período'}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => handleSave(entries)}
          disabled={isSaving}
          className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          Salvar Fechamento DRE
        </button>
      </div>
    </div>
  );
};

export default DRE;
