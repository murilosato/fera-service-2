
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
          const currentTotal = totals[s.type] || 0;
          totals[s.type] = currentTotal + (Number(s.areaM2) || 0);
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

      {/* Filtros */}
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
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
           <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Resumo Filtrado:</span>
              <div className="flex gap-4">
                {Object.entries(productionTotals).length > 0 ? (
                  // Fix: Added explicit type cast to total to ensure it's treated as a number during formatting
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
          filteredAreas.map(area => {
            // Fix: Explicitly type the accumulator in reduce to avoid 'unknown' type inference issues
            const areaTotalM2 = (area.services || []).reduce((acc: number, s) => acc + (Number(s.areaM2) || 0), 0);
            const areaTotalValue = (area.services || []).reduce((acc: number, s) => acc + (Number(s.totalValue) || 0), 0);
            const isExpanded = expandedAreaId === area.id;

            return (
              <div key={area.id} className={`bg-white rounded-[32px] border ${isExpanded ? 'border-[#010a1b] shadow-xl' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
                <div 
                  className="p-6 flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50/50" 
                  onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white ${area.status === 'finished' ? 'bg-emerald-600' : 'bg-[#010a1b]'}`}>
                      {area.status === 'finished' ? <CheckCircle2 size={24}/> : <Clock size={24} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase leading-tight">{area.name}</h3>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Iniciada em {formatDate(area.startDate)} • Ref: {area.startReference}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                     <div className="hidden sm:block text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Produção Acumulada</p>
                        <p className="text-[12px] font-black text-[#010a1b]">{formatNumber(areaTotalM2)} Uni.</p>
                     </div>
                     <div className="hidden sm:block text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor Bruto O.S.</p>
                        <p className="text-[12px] font-black text-emerald-600">{formatMoney(areaTotalValue)}</p>
                     </div>
                     {isExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Lançamento de Serviço */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                          <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2">
                             <Activity size={16} className="text-blue-500"/> Registrar Medição
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Tipo de Serviço</label>
                              <select 
                                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[10px] font-black uppercase outline-none"
                                value={newService.type}
                                onChange={e => setNewService({...newService, type: e.target.value as ServiceType})}
                              >
                                {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Quantidade (m²/KM)</label>
                              <input 
                                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[10px] font-black outline-none focus:bg-white focus:border-[#010a1b]"
                                placeholder="0,00"
                                value={newService.quantity}
                                onChange={e => setNewService({...newService, quantity: e.target.value})}
                              />
                            </div>
                            <button 
                              onClick={() => handleAddService(area.id)}
                              disabled={isLoading}
                              className="w-full bg-[#010a1b] text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                               {isLoading ? <Loader2 className="animate-spin" size={16}/> : <><Plus size={16}/> LANÇAR NA O.S.</>}
                            </button>
                          </div>
                        </div>

                        {area.status === 'executing' && (
                          <button 
                            onClick={() => setConfirmFinish({ isOpen: true, area: area, date: new Date().toISOString().split('T')[0] })}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16}/> FINALIZAR ORDEM DE SERVIÇO
                          </button>
                        )}
                        
                        <button 
                          onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id })}
                          className="w-full bg-white text-rose-600 border border-rose-100 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16}/> EXCLUIR O.S. DO SISTEMA
                        </button>
                      </div>

                      {/* Histórico de Serviços da Área */}
                      <div className="lg:col-span-2 space-y-6">
                         <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
                               <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                                  <FileText size={16} className="text-slate-400"/> Histórico de Lançamentos
                               </h4>
                               <span className="text-[9px] font-black uppercase text-slate-400">{area.services?.length || 0} Registros</span>
                            </div>
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                  <thead>
                                     <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase border-b">
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Serviço</th>
                                        <th className="px-6 py-4 text-right">Qtd</th>
                                        <th className="px-6 py-4 text-right">V. Total</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                     </tr>
                                  </thead>
                                  <tbody className="text-[10px] font-black uppercase text-slate-700 divide-y divide-slate-50">
                                     {(area.services || []).length === 0 ? (
                                       <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic">Nenhum serviço registrado nesta O.S.</td></tr>
                                     ) : (
                                       (area.services || []).map(s => (
                                         <tr key={s.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-slate-400">{formatDate(s.serviceDate)}</td>
                                            <td className="px-6 py-4">{s.type}</td>
                                            <td className="px-6 py-4 text-right">{formatNumber(s.areaM2)} {s.type.includes('KM') ? 'KM' : 'm²'}</td>
                                            <td className="px-6 py-4 text-right text-emerald-600">{formatMoney(s.totalValue)}</td>
                                            <td className="px-6 py-4 text-center">
                                               <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id })} className="p-2 text-slate-200 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                            </td>
                                         </tr>
                                       ))
                                     )}
                                  </tbody>
                               </table>
                            </div>
                         </div>

                         <div className="bg-slate-900 rounded-3xl p-6 text-white grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Metragem O.S.</p>
                               <p className="text-xl font-black">{formatNumber(areaTotalM2)} <span className="text-[10px] text-slate-500 uppercase">Uni.</span></p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Faturado</p>
                               <p className="text-xl font-black text-emerald-400">{formatMoney(areaTotalValue)}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova O.S. */}
      {isAddingArea && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleAddArea} className="bg-white rounded-[40px] w-full max-w-xl p-10 space-y-8 shadow-2xl animate-in zoom-in-95 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-6">
                <div>
                   <h3 className="text-sm font-black uppercase text-slate-900">Abertura de Nova O.S.</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identificação e Ponto de Partida</p>
                </div>
                <button type="button" onClick={() => setIsAddingArea(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Identificação da O.S. (Nome/Área)</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b]" placeholder="EX: AVENIDA CENTRAL - EQUIPE ALFA" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Data de Início</label>
                    <input type="date" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black outline-none" value={newArea.startDate} onChange={e => setNewArea({...newArea, startDate: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ref. Inicial (Ponto A)</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none" placeholder="EX: KM 01 OU RUA X" value={newArea.startReference} onChange={e => setNewArea({...newArea, startReference: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ref. Final (Ponto B)</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none" placeholder="EX: KM 10 OU RUA Y" value={newArea.endReference} onChange={e => setNewArea({...newArea, endReference: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Observações Técnicas</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase h-24 outline-none resize-none" placeholder="DESCREVA DETALHES DA EXECUÇÃO..." value={newArea.observations} onChange={e => setNewArea({...newArea, observations: e.target.value.toUpperCase()})} />
                 </div>
              </div>

              <button disabled={isLoading} type="submit" className="w-full bg-[#010a1b] text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all hover:bg-emerald-600 active:scale-95 flex items-center justify-center gap-3">
                 {isLoading ? <Loader2 className="animate-spin" size={18}/> : <><MapPin size={18}/> ABRIR ORDEM DE SERVIÇO</>}
              </button>
           </form>
        </div>
      )}

      {/* Modal Finalizar O.S. */}
      {confirmFinish && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-100 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 mb-2">
                 <CheckCircle2 size={32}/>
              </div>
              <div>
                 <h3 className="text-sm font-black uppercase text-slate-900">Finalizar Execução?</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-tight">O.S.: {confirmFinish.area.name}</p>
              </div>
              <div className="space-y-1 text-left">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Data Real de Conclusão</label>
                 <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black" value={confirmFinish.date} onChange={e => setConfirmFinish({...confirmFinish, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setConfirmFinish(null)} className="py-4 rounded-2xl font-black uppercase text-[10px] text-slate-400 bg-slate-50">CANCELAR</button>
                 <button onClick={handleFinishArea} className="py-4 rounded-2xl font-black uppercase text-[10px] text-white bg-emerald-600 shadow-lg hover:bg-emerald-700">CONFIRMAR</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Deletar */}
      <ConfirmationModal 
        isOpen={!!confirmDelete?.isOpen} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={performDelete} 
        title={confirmDelete?.serviceId ? "Excluir Medição" : "Excluir O.S."}
        message={confirmDelete?.serviceId ? "Deseja remover este lançamento de serviço? O valor será deduzido do total da O.S." : "Esta ação removerá permanentemente a Ordem de Serviço e todos os seus lançamentos vinculados."}
      />
    </div>
  );
};

export default Production;
