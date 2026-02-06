
import React, { useState, useMemo } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, MapPin, X, ChevronDown, ChevronUp, Loader2, Info, ArrowRight, Activity, Archive, Calendar, Edit3, Search, Filter, Clock, FileText, DollarSign, Layers, BarChart3 } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface ProductionProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Production: React.FC<ProductionProps> = ({ state, setState }) => {
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewStatus, setViewStatus] = useState<'executing' | 'finished'>('executing');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; areaId: string; serviceId?: string } | null>(null);
  const [confirmFinish, setConfirmFinish] = useState<{ isOpen: boolean; area: Area; date: string } | null>(null);

  const [searchName, setSearchName] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('ALL');

  const [newArea, setNewArea] = useState<Partial<Area>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startReference: '',
    endReference: '',
    observations: ''
  });

  const [newService, setNewService] = useState({ type: ServiceType.VARRICAO_KM, quantity: '' });

  const refreshData = async () => {
    if (state.currentUser?.companyId || state.currentUser?.role === 'DIRETORIA_MASTER') {
      const data = await fetchCompleteCompanyData(state.currentUser?.companyId || null, state.currentUser?.role === 'DIRETORIA_MASTER');
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.name || !newArea.startDate || !newArea.startReference || !newArea.endReference) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    setIsLoading(true);
    try {
      await dbSave('areas', { 
        ...newArea, 
        companyId: state.currentUser?.companyId, 
        status: 'executing' 
      });
      await refreshData();
      setIsAddingArea(false);
      setNewArea({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: '', startReference: '', endReference: '', observations: '' });
    } catch (e: any) { 
      alert("Erro ao criar O.S."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleAddService = async (areaId: string) => {
    const qty = parseFloat(newService.quantity.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) return alert("Quantidade inválida");
    setIsLoading(true);
    try {
      const unitValue = state.serviceRates[newService.type] || 0;
      await dbSave('services', {
        companyId: state.currentUser?.companyId,
        areaId: areaId,
        type: newService.type,
        areaM2: qty,
        unitValue: unitValue,
        totalValue: unitValue * qty,
        serviceDate: new Date().toISOString().split('T')[0]
      });
      await refreshData();
      setNewService({ ...newService, quantity: '' });
    } catch (e: any) { alert("Falha ao registrar serviço."); } finally { setIsLoading(false); }
  };

  const handleFinishArea = async () => {
    if (!confirmFinish?.date) return alert("Data de fim é obrigatória.");
    setIsLoading(true);
    try {
      await dbSave('areas', {
        id: confirmFinish.area.id,
        status: 'finished',
        endDate: confirmFinish.date
      });
      await refreshData();
      setConfirmFinish(null);
      setExpandedAreaId(null);
      setViewStatus('finished');
    } catch (e: any) { alert("Falha ao finalizar O.S."); } finally { setIsLoading(false); }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
      if (confirmDelete.serviceId) {
        await dbDelete('services', confirmDelete.serviceId);
      } else {
        await dbDelete('areas', confirmDelete.areaId);
      }
      await refreshData();
      setConfirmDelete(null);
    } catch (e: any) { alert("Falha ao excluir."); } finally { setIsLoading(false); }
  };

  const filteredAreas = useMemo(() => {
    return state.areas.filter(area => {
      const matchStatus = area.status === viewStatus;
      const matchName = area.name.toLowerCase().includes(searchName.toLowerCase());
      const matchType = filterServiceType === 'ALL' || (area.services || []).some(s => s.type === filterServiceType);
      
      let matchDate = true;
      if (filterDateStart) matchDate = matchDate && (area.startDate >= filterDateStart);
      if (filterDateEnd) matchDate = matchDate && (area.startDate <= filterDateEnd);
      
      return matchStatus && matchName && matchType && matchDate;
    });
  }, [state.areas, viewStatus, searchName, filterDateStart, filterDateEnd, filterServiceType]);

  const productionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredAreas.forEach(area => {
      (area.services || []).forEach(s => {
        if (filterServiceType === 'ALL' || s.type === filterServiceType) {
          const currentTotal = Number(totals[s.type as string]) || 0;
          totals[s.type as string] = currentTotal + (Number(s.areaM2) || 0);
        }
      });
    });
    return totals;
  }, [filteredAreas, filterServiceType]);

  const formatDate = (d?: string) => d ? d.split('-').reverse().join('/') : '--/--/----';
  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNumber = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#010a1b] uppercase">Produção de Campo</h2>
          <p className="text-[10px] text-[#2e3545] font-bold uppercase tracking-widest">Controle de O.S. e Metragem Urbana</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-200 p-1 rounded-xl flex-1 md:flex-none">
            <button onClick={() => setViewStatus('executing')} className={`flex-1 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'executing' ? 'bg-white text-[#010a1b] shadow-sm' : 'text-[#2e3545]'}`}>Em Execução</button>
            <button onClick={() => setViewStatus('finished')} className={`flex-1 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'finished' ? 'bg-white text-[#010a1b] shadow-sm' : 'text-[#2e3545]'}`}>Finalizadas</button>
          </div>
          <button 
            onClick={() => setIsAddingArea(true)} 
            className="bg-[#010a1b] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Plus size={18} /> Nova O.S.
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
              placeholder="BUSCAR O.S. POR NOME OU EQUIPE..." 
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <select 
              className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase outline-none appearance-none cursor-pointer focus:bg-white focus:border-[#010a1b]"
              value={filterServiceType}
              onChange={e => setFilterServiceType(e.target.value)}
            >
              <option value="ALL">TODOS OS SERVIÇOS</option>
              {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
               <Calendar size={14} className="text-[#2e3545]" />
               <label className="text-[8px] font-black text-[#2e3545] uppercase">INÍCIO:</label>
               <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
               <label className="text-[8px] font-black text-[#2e3545] uppercase">FIM:</label>
               <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
           <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Consolidado do Filtro:</span>
              <div className="flex gap-4">
                {Object.entries(productionTotals).length > 0 ? (
                  /* Fix: Explicitly cast total as number to satisfy type requirements on line 212/214 */
                  Object.entries(productionTotals).map(([type, total]) => (
                    <span key={type} className="text-[9px] font-black text-[#010a1b] uppercase">
                      {type}: <span className="text-emerald-600">{formatNumber(total as number)} {type.includes('KM') ? 'KM' : 'm²'}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] font-black text-slate-300 uppercase italic">Nenhuma produção acumulada</span>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-slate-200 text-center text-[#2e3545] font-black uppercase text-xs italic opacity-40">
            Nenhuma O.S. encontrada para os critérios selecionados
          </div>
        ) : (
          filteredAreas.map(area => (
            <div key={area.id} className={`bg-white rounded-[32px] border ${expandedAreaId === area.id ? 'border-[#010a1b] shadow-xl' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
              <div className="p-6 flex justify-between items-center bg-white cursor-pointer" onClick={() => setExpandedAreaId(expandedAreaId === area.id ? null : area.id)}>
                 <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white ${area.status === 'finished' ? 'bg-emerald-600' : 'bg-[#010a1b]'}`}>
                      {area.status === 'finished' ? <CheckCircle2 size={24}/> : <Clock size={24} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase">{area.name}</h3>
                    </div>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Production;
