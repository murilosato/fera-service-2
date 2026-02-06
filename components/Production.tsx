
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
          // Fix: Explicitly ensuring numeric summation with Number() conversion to handle possible 'unknown' types
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

      {/* Barra de Filtros e Busca de Produção */}
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

        {/* Resumo Consolidado da Produção Selecionada */}
        <div className="pt-2 flex flex-wrap gap-2">
           <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Consolidado do Filtro:</span>
              <div className="flex gap-4">
                {Object.entries(productionTotals).length > 0 ? (
                  Object.entries(productionTotals).map(([type, total]) => (
                    <span key={type} className="text-[9px] font-black text-[#010a1b] uppercase">
                      {type}: <span className="text-emerald-600">{formatNumber(total)} {type.includes('KM') ? 'KM' : 'm²'}</span>
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
                      <h3 className="text-sm font-black text-[#010a1b] uppercase">{area.name}</h3>
                      <p className="text-[10px] text-[#2e3545] font-bold uppercase flex items-center gap-2">
                         <Calendar size={10} className="text-slate-400" /> 
                         {formatDate(area.startDate)} 
                         {area.status === 'finished' && <> <ArrowRight size={10}/> {formatDate(area.endDate)}</>}
                         <span className="mx-2 text-slate-300">|</span>
                         {area.startReference} <ArrowRight size={10} className="text-slate-300" /> {area.endReference}
                      </p>
                    </div>
                 </div>
                 <div className="flex gap-2 items-center">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setConfirmDelete({ isOpen: true, areaId: area.id }); 
                      }} 
                      className="p-4 rounded-2xl text-[#2e3545] hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Excluir O.S."
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className={`p-4 rounded-2xl transition-colors ${expandedAreaId === area.id ? 'bg-[#010a1b] text-white' : 'bg-slate-50 text-[#2e3545]'}`}>
                      {expandedAreaId === area.id ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                 </div>
              </div>

              {expandedAreaId === area.id && (
                <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4">
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6 border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-[#2e3545] tracking-[0.2em]">Lançamento de Produção</h4>
                        <select className="w-full bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-[#010a1b]" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as any})}>
                          {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none focus:border-[#010a1b]" placeholder="Quantidade (KM ou m²)" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                        <button onClick={(e) => { e.stopPropagation(); handleAddService(area.id); }} disabled={isLoading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-colors">
                          Confirmar Lançamento
                        </button>
                        {area.status === 'executing' ? (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setConfirmFinish({ isOpen: true, area, date: new Date().toISOString().split('T')[0] }); 
                            }} 
                            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Finalizar e Contabilizar
                          </button>
                        ) : (
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                            <p className="text-[9px] font-black text-emerald-600 uppercase">O.S. FINALIZADA EM {formatDate(area.endDate)}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#010a1b] p-8 rounded-[32px] text-white shadow-xl">
                        <h4 className="font-black uppercase text-[10px] text-slate-500 mb-4 tracking-widest flex items-center gap-2">
                          <DollarSign size={14}/> Faturamento do Trecho
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                             <span className="text-[9px] font-black opacity-60 uppercase">VALOR BRUTO TOTAL</span>
                             {/* Fix: Removed explicit generic type argument from reduce to resolve untyped function call error and explicitly typed arguments */}
                             <p className="text-xl font-black text-emerald-400">{formatMoney((area.services || []).reduce((acc: number, s: any) => acc + (Number(s.totalValue) || 0), 0))}</p>
                          </div>
                          <div className="space-y-3 pt-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resumo Quantitativo da O.S.:</p>
                            {(() => {
                               const areaTotals: Record<string, number> = {};
                               (area.services || []).forEach((s: Service) => {
                                 const val: number = Number(s.areaM2) || 0;
                                 const typeKey: string = s.type as string;
                                 areaTotals[typeKey] = (Number(areaTotals[typeKey]) || 0) + val;
                               });
                               const entries = Object.entries(areaTotals);
                               if (entries.length === 0) return <p className="text-[8px] font-bold text-slate-600 uppercase italic">Nenhuma produção registrada</p>;
                               return entries.map(([type, total]) => (
                                 <div key={type} className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="opacity-50">{type}</span>
                                    <span>{formatNumber(total)} {type.includes('KM') ? 'KM' : 'm²'}</span>
                                 </div>
                               ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                         <h4 className="text-[10px] font-black uppercase text-[#2e3545] tracking-widest">Detalhamento da Produção Técnica</h4>
                         <span className="px-4 py-1.5 bg-white border rounded-xl text-[9px] font-black uppercase text-[#2e3545]">{(area.services || []).length} Lançamentos</span>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[9px] font-black uppercase text-[#2e3545] border-b">
                            <tr>
                              <th className="px-8 py-5">Item / Serviço</th>
                              <th className="px-8 py-5 text-right">Quantidade Real</th>
                              <th className="px-8 py-5 text-right">V. Unitário</th>
                              <th className="px-8 py-5 text-center">Excluir</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-[11px] font-black uppercase text-[#010a1b]">
                            {(area.services || []).map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-4">{s.type}</td>
                                  <td className="px-8 py-4 text-right text-emerald-600 font-black">
                                    {formatNumber(s.areaM2)} {s.type.includes('KM') ? 'KM' : 'm²'}
                                  </td>
                                  <td className="px-8 py-4 text-right text-slate-400">{formatMoney(s.unitValue)}</td>
                                  <td className="px-8 py-4 text-center">
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id }); }} className="p-2 text-rose-300 hover:text-rose-600 transition-all">
                                      <Trash2 size={16}/>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Nova O.S. */}
      {isAddingArea && (
        <div className="fixed inset-0 bg-[#010a1b]/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <form onSubmit={handleAddArea} className="bg-white rounded-[40px] w-full max-w-xl p-10 space-y-8 shadow-2xl animate-in zoom-in-95 border border-white/20">
              <div className="flex justify-between items-center border-b pb-6 border-slate-100">
                <div>
                   <h3 className="text-lg font-black uppercase text-[#010a1b] tracking-tight">Nova Ordem de Serviço</h3>
                   <p className="text-[10px] font-bold text-[#2e3545] uppercase tracking-widest opacity-60">Início de Trecho Urbano</p>
                </div>
                <button type="button" onClick={() => setIsAddingArea(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-300 hover:text-[#010a1b]"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                   <label className="text-[10px] font-black text-[#2e3545] uppercase ml-1 block">Identificação / Equipe</label>
                   <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
                        placeholder="EX: EQUIPE 01 - ZONA SUL" 
                        value={newArea.name} 
                        onChange={e => setNewArea({...newArea, name: e.target.value.toUpperCase()})} 
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-[#2e3545] uppercase ml-1 block">Data de Início da O.S.</label>
                   <input 
                    type="date" 
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
                    value={newArea.startDate} 
                    onChange={e => setNewArea({...newArea, startDate: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-[#2e3545] uppercase ml-1 block">Ponto Referencial Início</label>
                   <input 
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
                    placeholder="EX: KM 0" 
                    value={newArea.startReference} 
                    onChange={e => setNewArea({...newArea, startReference: e.target.value.toUpperCase()})} 
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                   <label className="text-[10px] font-black text-[#2e3545] uppercase ml-1 block">Ponto Referencial Alvo (Fim)</label>
                   <input 
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
                    placeholder="EX: KM 15" 
                    value={newArea.endReference} 
                    onChange={e => setNewArea({...newArea, endReference: e.target.value.toUpperCase()})} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  type="button" 
                  onClick={() => setIsAddingArea(false)} 
                  className="flex-1 bg-slate-100 text-[#2e3545] py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                 <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 bg-[#010a1b] text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>ABRIR ORDEM <ArrowRight size={18}/></>}
                </button>
              </div>
           </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!confirmDelete?.isOpen} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={performDelete} 
        title="Remover Registro" 
        message={confirmDelete?.serviceId ? "Deseja excluir este lançamento?" : "Deseja excluir esta O.S. completa?"} 
      />

      {confirmFinish && (
        <div className="fixed inset-0 bg-[#010a1b]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="text-center space-y-2">
                 <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                 <h3 className="text-sm font-black uppercase text-[#010a1b]">Encerrar Ordem de Serviço</h3>
                 <p className="text-[10px] font-bold text-[#2e3545] uppercase tracking-widest opacity-70">A produção será contabilizada nesta data</p>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#2e3545] uppercase ml-1 block">Data de Finalização (Contábil)</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:border-[#010a1b]" value={confirmFinish.date} onChange={e => setConfirmFinish({...confirmFinish, date: e.target.value})} />
                 </div>
                 <button onClick={handleFinishArea} disabled={isLoading} className="w-full bg-[#010a1b] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-600 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CONFIRMAR E CONTABILIZAR'}
                 </button>
                 <button onClick={() => setConfirmFinish(null)} className="w-full bg-slate-100 text-[#2e3545] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Production;
