
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

  // Estados para Filtros
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
      return alert("Preencha todos os campos obrigatórios (Nome, Data, Referências).");
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
    } catch (e: any) { alert("Erro ao criar O.S. Verifique sua conexão."); } finally { setIsLoading(false); }
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
    } catch (e: any) { 
      console.error(e);
      alert("Falha ao finalizar O.S. no servidor."); 
    } finally { setIsLoading(false); }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
      if (confirmDelete.serviceId) {
        await dbDelete('services', confirmDelete.serviceId);
      } else {
        // Excluir a área (O.S.) completa
        await dbDelete('areas', confirmDelete.areaId);
      }
      await refreshData();
      setConfirmDelete(null);
    } catch (e: any) { 
      alert("Falha ao excluir registro."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // Lógica de Filtragem Avançada
  const filteredAreas = useMemo(() => {
    return state.areas.filter(area => {
      const matchStatus = area.status === viewStatus;
      const matchName = area.name.toLowerCase().includes(searchName.toLowerCase());
      
      let matchDate = true;
      if (filterDateStart) {
        matchDate = matchDate && (area.startDate >= filterDateStart);
      }
      if (filterDateEnd) {
        matchDate = matchDate && (area.startDate <= filterDateEnd);
      }

      return matchStatus && matchName && matchDate;
    });
  }, [state.areas, viewStatus, searchName, filterDateStart, filterDateEnd]);

  const formatDate = (d?: string) => d ? d.split('-').reverse().join('/') : '--/--/----';

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Produção de Campo</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de O.S. e Metragem Urbana</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button onClick={() => setViewStatus('executing')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'executing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Em Execução</button>
            <button onClick={() => setViewStatus('finished')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'finished' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Finalizadas</button>
          </div>
          <button onClick={() => setIsAddingArea(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all"><Plus size={18} /> Nova O.S.</button>
        </div>
      </header>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all" 
            placeholder="BUSCAR O.S. POR NOME OU EQUIPE..." 
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
             <Calendar size={14} className="text-slate-400" />
             <label className="text-[8px] font-black text-slate-400 uppercase">DE:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
             <label className="text-[8px] font-black text-slate-400 uppercase">ATÉ:</label>
             <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
          </div>
          {(searchName || filterDateStart || filterDateEnd) && (
            <button 
              onClick={() => { setSearchName(''); setFilterDateStart(''); setFilterDateEnd(''); }}
              className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
              title="Limpar Filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {isAddingArea && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Abertura de Nova O.S.</h3>
            <button onClick={() => setIsAddingArea(false)} className="text-slate-400 hover:text-slate-900"><X/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Identificação / Equipe</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-slate-900" placeholder="Ex: EQUIPE-JOAO-01" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Data de Início</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black" value={newArea.startDate} onChange={e => setNewArea({...newArea, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Ponto Inicial</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-slate-900" placeholder="Rua / Ponto A" value={newArea.startReference} onChange={e => setNewArea({...newArea, startReference: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Ponto Final</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-slate-900" placeholder="Rua / Ponto B" value={newArea.endReference} onChange={e => setNewArea({...newArea, endReference: e.target.value})} />
            </div>
          </div>
          <button onClick={handleAddArea} disabled={isLoading} className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ABERTURA'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-slate-200 text-center text-slate-300 font-black uppercase text-xs italic">
            { (searchName || filterDateStart || filterDateEnd) ? 'Nenhum resultado para os filtros aplicados' : 'Nenhuma O.S. encontrada neste status' }
          </div>
        ) : (
          filteredAreas.map(area => (
            <div key={area.id} className={`bg-white rounded-[32px] border ${expandedAreaId === area.id ? 'border-slate-900 shadow-xl' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
              <div className="p-6 flex justify-between items-center bg-white cursor-pointer" onClick={() => setExpandedAreaId(expandedAreaId === area.id ? null : area.id)}>
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${area.status === 'finished' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                      {area.status === 'finished' ? <CheckCircle2 size={20}/> : <Clock size={20} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase">{area.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                         <Calendar size={10} className="text-slate-400" /> {formatDate(area.startDate)} | {area.startReference} <ArrowRight size={10} className="text-slate-300" /> {area.endReference}
                      </p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {area.status === 'finished' && (
                      <div className="hidden sm:flex px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase items-center gap-2">
                        <Archive size={12}/> Faturado
                      </div>
                    )}
                    
                    {/* Botão de Excluir O.S. Completa */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setConfirmDelete({ isOpen: true, areaId: area.id }); 
                      }} 
                      className="p-4 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                      title="Excluir O.S. Completa"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className={`p-4 rounded-2xl transition-colors ${expandedAreaId === area.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {expandedAreaId === area.id ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                 </div>
              </div>

              {expandedAreaId === area.id && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-slate-400">Painel de Lançamento</h4>
                          <Edit3 size={14} className="text-blue-500" />
                        </div>
                        <select className="w-full bg-slate-50 p-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-slate-900" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as any})}>
                          {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <input type="number" className="w-full bg-slate-50 p-4 rounded-xl text-xs font-black outline-none focus:border-slate-900" placeholder="Quantidade / Metragem" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                        <button onClick={(e) => { e.stopPropagation(); handleAddService(area.id); }} disabled={isLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-colors">
                          Lançar Produção
                        </button>
                        
                        {area.status === 'executing' ? (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              // Permite finalizar no mesmo dia preenchendo com a data de hoje por padrão
                              setConfirmFinish({ isOpen: true, area, date: new Date().toISOString().split('T')[0] }); 
                            }} 
                            className="w-full border-2 border-emerald-500 text-emerald-600 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-50 transition-all"
                          >
                            Finalizar para Faturamento
                          </button>
                        ) : (
                          <div className="p-3 bg-emerald-600 rounded-xl text-white text-center">
                            <p className="text-[10px] font-black uppercase">O.S. FINALIZADA EM {formatDate(area.endDate)}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                        <h4 className="font-black uppercase text-[10px] text-slate-500 mb-2">Resumo da O.S.</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                             <span className="text-[9px] font-black opacity-60">TOTAL PRODUZIDO</span>
                             <p className="text-lg font-black text-emerald-400">{(area.services || []).reduce((acc, s) => acc + s.areaM2, 0).toLocaleString('pt-BR')} {area.services?.[0]?.type.includes('KM') ? 'KM' : 'm²'}</p>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black opacity-60">VALOR ESTIMADO</span>
                             <p className="text-lg font-black">{(area.services || []).reduce((acc, s) => acc + (s.totalValue || 0), 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[300px]">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalhamento dos Serviços</h4>
                         <span className="px-2 py-1 bg-white border rounded-lg text-[8px] font-black uppercase text-slate-500">{(area.services || []).length} Registros</span>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-white shadow-sm text-[9px] font-black uppercase text-slate-400 border-b">
                            <tr>
                              <th className="px-6 py-4">Data Registro</th>
                              <th className="px-6 py-4">Tipo de Serviço</th>
                              <th className="px-6 py-4 text-right">Produção</th>
                              <th className="px-6 py-4 text-center">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-[11px] font-black uppercase text-slate-700">
                            {(!area.services || area.services.length === 0) ? (
                              <tr><td colSpan={4} className="px-6 py-10 text-center italic text-slate-300">Nenhum serviço registrado nesta O.S.</td></tr>
                            ) : (
                              area.services.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-3 text-slate-500 font-bold">{formatDate(s.serviceDate)}</td>
                                  <td className="px-6 py-3">{s.type}</td>
                                  <td className="px-6 py-3 text-right text-emerald-600">{s.areaM2.toLocaleString('pt-BR')}</td>
                                  <td className="px-6 py-3 text-center">
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id }); }} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                      <Trash2 size={14}/>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
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
        title={confirmDelete?.serviceId ? "Excluir Registro" : "Excluir O.S. Completa"} 
        message={confirmDelete?.serviceId ? "Deseja remover este registro de produção?" : "ATENÇÃO: Isso excluirá a O.S. inteira e TODOS os seus lançamentos de produção. Esta ação não pode ser desfeita."} 
      />
      
      {confirmFinish && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
               </div>
               <h3 className="font-black uppercase text-sm text-slate-900 tracking-tight">Finalizar para Faturamento</h3>
               <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Informe a data de conclusão da equipe.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Data de Conclusão</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-xs outline-none focus:border-emerald-600 transition-all" value={confirmFinish.date} onChange={e => setConfirmFinish({...confirmFinish, date: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setConfirmFinish(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500">Voltar</button>
              <button onClick={handleFinishArea} disabled={isLoading} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">
                {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
