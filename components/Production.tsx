
import React, { useState, useMemo } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, MapPin, X, ChevronDown, ChevronUp, Loader2, Info, ArrowRight, Activity, Archive, Calendar, Edit3, Search, Filter, Clock } from 'lucide-react';
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

  const handleAddArea = async () => {
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
    } catch (e: any) { alert("Erro ao criar O.S."); } finally { setIsLoading(false); }
  };

  const handleAddService = async (areaId: string) => {
    const qty = parseFloat(newService.quantity);
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
      let matchDate = true;
      if (filterDateStart) matchDate = matchDate && (area.startDate >= filterDateStart);
      if (filterDateEnd) matchDate = matchDate && (area.startDate <= filterDateEnd);
      return matchStatus && matchName && matchDate;
    });
  }, [state.areas, viewStatus, searchName, filterDateStart, filterDateEnd]);

  const formatDate = (d?: string) => d ? d.split('-').reverse().join('/') : '--/--/----';

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#010a1b] uppercase">Produção de Campo</h2>
          <p className="text-[10px] text-[#2e3545] font-bold uppercase tracking-widest">Controle de O.S. e Metragem Urbana</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button onClick={() => setViewStatus('executing')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'executing' ? 'bg-white text-[#010a1b] shadow-sm' : 'text-[#2e3545]'}`}>Em Execução</button>
            <button onClick={() => setViewStatus('finished')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'finished' ? 'bg-white text-[#010a1b] shadow-sm' : 'text-[#2e3545]'}`}>Finalizadas</button>
          </div>
          <button onClick={() => setIsAddingArea(true)} className="bg-[#010a1b] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all"><Plus size={18} /> Nova O.S.</button>
        </div>
      </header>

      <div className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-[#010a1b] transition-all" 
            placeholder="BUSCAR O.S. POR NOME OU EQUIPE..." 
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
             <Calendar size={14} className="text-[#2e3545]" />
             <label className="text-[8px] font-black text-[#2e3545] uppercase">DE:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
             <label className="text-[8px] font-black text-[#2e3545] uppercase">ATÉ:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-slate-200 text-center text-[#2e3545] font-black uppercase text-xs italic opacity-40">
            Nenhuma O.S. encontrada
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
                         <Calendar size={10} className="text-slate-400" /> {formatDate(area.startDate)} | {area.startReference} <ArrowRight size={10} className="text-slate-300" /> {area.endReference}
                      </p>
                    </div>
                 </div>
                 <div className="flex gap-2 items-center">
                    {/* Botão de Excluir O.S. reintroduzido */}
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
                        <h4 className="text-[10px] font-black uppercase text-[#2e3545] tracking-[0.2em]">Painel de Lançamento</h4>
                        <select className="w-full bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-[#010a1b]" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as any})}>
                          {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none focus:border-[#010a1b]" placeholder="Metragem / Qtd" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                        <button onClick={(e) => { e.stopPropagation(); handleAddService(area.id); }} disabled={isLoading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-colors">
                          Lançar Produção
                        </button>
                        {area.status === 'executing' && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setConfirmFinish({ isOpen: true, area, date: new Date().toISOString().split('T')[0] }); 
                            }} 
                            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Finalizar Ordem
                          </button>
                        )}
                      </div>

                      <div className="bg-[#010a1b] p-8 rounded-[32px] text-white shadow-xl">
                        <h4 className="font-black uppercase text-[10px] text-slate-500 mb-4 tracking-widest">Resumo da O.S.</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                             <span className="text-[9px] font-black opacity-60">PRODUZIDO</span>
                             <p className="text-xl font-black text-emerald-400">{(area.services || []).reduce((acc, s) => acc + s.areaM2, 0).toLocaleString('pt-BR')} {area.services?.[0]?.type.includes('KM') ? 'KM' : 'm²'}</p>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black opacity-60">VALOR TOTAL</span>
                             <p className="text-xl font-black">{(area.services || []).reduce((acc, s) => acc + (s.totalValue || 0), 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                         <h4 className="text-[10px] font-black uppercase text-[#2e3545] tracking-widest">Detalhamento da Equipe</h4>
                         <span className="px-4 py-1.5 bg-white border rounded-xl text-[9px] font-black uppercase text-[#2e3545]">{(area.services || []).length} Lançamentos</span>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                          <thead className="bg-white text-[9px] font-black uppercase text-[#2e3545] border-b">
                            <tr>
                              <th className="px-8 py-5">Data</th>
                              <th className="px-8 py-5">Serviço</th>
                              <th className="px-8 py-5 text-right">Qtd</th>
                              <th className="px-8 py-5 text-center">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-[11px] font-black uppercase text-[#010a1b]">
                            {(area.services || []).map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-4 text-[#2e3545]">{formatDate(s.serviceDate)}</td>
                                  <td className="px-8 py-4">{s.type}</td>
                                  <td className="px-8 py-4 text-right text-emerald-600 font-black">{s.areaM2.toLocaleString('pt-BR')}</td>
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

      <ConfirmationModal 
        isOpen={!!confirmDelete?.isOpen} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={performDelete} 
        title="Remover Registro" 
        message={confirmDelete?.serviceId ? "Deseja excluir permanentemente este lançamento de produção?" : "Deseja excluir permanentemente esta Ordem de Serviço e todos os seus lançamentos?"} 
      />

      {confirmFinish && (
        <div className="fixed inset-0 bg-[#010a1b]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="text-center space-y-2">
                 <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                 <h3 className="text-sm font-black uppercase text-[#010a1b]">Finalizar Ordem de Serviço</h3>
                 <p className="text-[10px] font-bold text-[#2e3545] uppercase tracking-widest opacity-70">Confirme a data de conclusão para arquivamento</p>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#2e3545] uppercase ml-1 block">Data de Encerramento</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:border-[#010a1b]" value={confirmFinish.date} onChange={e => setConfirmFinish({...confirmFinish, date: e.target.value})} />
                 </div>
                 <button onClick={handleFinishArea} disabled={isLoading} className="w-full bg-[#010a1b] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-600 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CONFIRMAR FINALIZAÇÃO'}
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
