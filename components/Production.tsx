
import React, { useState } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, MapPin, X, ChevronDown, ChevronUp, Loader2, Info, ArrowRight, Activity, Archive, Calendar } from 'lucide-react';
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
      return alert("Preencha Nome O.S, Data de Início, Local de Início e Local de Fim.");
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
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleAddService = async (areaId: string) => {
    const qty = parseFloat(newService.quantity);
    if (isNaN(qty) || qty <= 0) return alert("Qtd inválida");
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
        service_date: new Date().toISOString().split('T')[0]
      });
      await refreshData();
      setNewService({ ...newService, quantity: '' });
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleFinishArea = async () => {
    if (!confirmFinish?.date) return alert("Data de fim é obrigatória.");
    setIsLoading(true);
    try {
      const areaToUpdate = {
        id: confirmFinish.area.id,
        status: 'finished' as const,
        endDate: confirmFinish.date
      };
      await dbSave('areas', areaToUpdate);
      await refreshData();
      setConfirmFinish(null);
      setExpandedAreaId(null);
      setViewStatus('finished');
    } catch (e: any) { 
      console.error(e);
      alert("Falha ao finalizar O.S. Verifique a conexão."); 
    } finally { setIsLoading(false); }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
      if (confirmDelete.serviceId) await dbDelete('services', confirmDelete.serviceId);
      else await dbDelete('areas', confirmDelete.areaId);
      await refreshData();
      setConfirmDelete(null);
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const filteredAreas = state.areas.filter(area => (area.status || 'executing') === viewStatus);
  const formatDate = (d: string) => d ? d.split('-').reverse().join('/') : '--/--/----';

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Produção de Campo</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de O.S. e Metragem Urbana</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button onClick={() => setViewStatus('executing')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'executing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Execução</button>
            <button onClick={() => setViewStatus('finished')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewStatus === 'finished' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Arquivadas</button>
          </div>
          <button onClick={() => setIsAddingArea(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Nova O.S.</button>
        </div>
      </header>

      {isAddingArea && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xs uppercase tracking-widest">Abrir Nova Ordem de Serviço</h3>
            <button onClick={() => setIsAddingArea(false)}><X/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Nome O.S</label>
              <input className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black uppercase" placeholder="Ex: OS-001" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Data Início</label>
              <input type="date" className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black" value={newArea.startDate} onChange={e => setNewArea({...newArea, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Local Início</label>
              <input className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black uppercase" placeholder="Ponto de partida" value={newArea.startReference} onChange={e => setNewArea({...newArea, startReference: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Local Fim</label>
              <input className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black uppercase" placeholder="Ponto de chegada" value={newArea.endReference} onChange={e => setNewArea({...newArea, endReference: e.target.value})} />
            </div>
          </div>
          <button onClick={handleAddArea} disabled={isLoading} className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ABERTURA DE O.S.'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border-2 border-dashed text-center text-slate-300 font-black uppercase text-xs italic">Nenhuma O.S. encontrada neste status</div>
        ) : (
          filteredAreas.map(area => (
            <div key={area.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${area.status === 'finished' ? 'bg-emerald-600' : 'bg-slate-900'}`}>{area.status === 'finished' ? <CheckCircle2 size={20}/> : 'OS'}</div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">{area.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                       {area.startReference} <ArrowRight size={10} className="text-slate-300" /> {area.endReference}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id })} className="p-2 text-slate-200 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                  <button onClick={() => setExpandedAreaId(expandedAreaId === area.id ? null : area.id)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">{expandedAreaId === area.id ? <ChevronUp/> : <ChevronDown/>}</button>
                </div>
              </div>
              {expandedAreaId === area.id && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                  <div className="space-y-4">
                    {area.status === 'executing' ? (
                      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Painel de Lançamento</h4>
                        <select className="w-full bg-slate-50 p-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-slate-900" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as any})}>{SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        <input type="number" className="w-full bg-slate-50 p-4 rounded-xl text-xs font-black outline-none focus:border-slate-900" placeholder="Metragem/Qtd" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                        <button onClick={() => handleAddService(area.id)} disabled={isLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">ADICIONAR PRODUÇÃO</button>
                        <button onClick={() => setConfirmFinish({ isOpen: true, area, date: new Date().toISOString().split('T')[0] })} className="w-full border border-emerald-500 text-emerald-600 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-50 transition-all">FINALIZAR O.S.</button>
                      </div>
                    ) : (
                      <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl">
                        <h4 className="font-black uppercase text-xs mb-2">Concluída & Arquivada</h4>
                        <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed mb-4">Finalizado em {formatDate(area.endDate || '')}</p>
                        <div className="pt-4 border-t border-white/20">
                           <span className="text-[8px] font-black opacity-60">TOTAL PRODUZIDO</span>
                           <p className="text-xl font-black">{area.services?.reduce((acc, s) => acc + s.areaM2, 0).toLocaleString('pt-BR')} m²</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
                        <tr><th className="px-6 py-4">Data Registro</th><th className="px-6 py-4">Tipo Serviço</th><th className="px-6 py-4 text-right">Produção</th>{area.status === 'executing' && <th className="px-6 py-4 text-center">Ação</th>}</tr>
                      </thead>
                      <tbody className="divide-y text-[10px] font-black uppercase text-slate-700">
                        {area.services?.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-10 text-center italic text-slate-300">Nenhum registro para esta O.S.</td></tr>
                        ) : (
                          area.services?.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 text-slate-500">{formatDate(s.service_date)}</td>
                              <td className="px-6 py-3">{s.type}</td>
                              <td className="px-6 py-3 text-right text-emerald-600">{s.areaM2.toLocaleString('pt-BR')}</td>
                              {area.status === 'executing' && <td className="px-6 py-3 text-center"><button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id })} className="text-rose-300 hover:text-rose-600"><Trash2 size={14}/></button></td>}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmationModal isOpen={!!confirmDelete?.isOpen} onClose={() => setConfirmDelete(null)} onConfirm={performDelete} title="Excluir Registro" message="Esta ação removerá permanentemente os dados de produção do servidor." />
      
      {confirmFinish && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-2 mb-6">
               <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
               <h3 className="font-black uppercase text-xs">Finalizar O.S. {confirmFinish.area.name}</h3>
               <p className="text-[10px] text-slate-400 uppercase font-bold">Informe a data de encerramento real</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data de Fim</label>
              <input type="date" className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:border-emerald-600" value={confirmFinish.date} onChange={e => setConfirmFinish({...confirmFinish, date: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmFinish(null)} className="flex-1 py-4 font-black uppercase text-[10px] bg-slate-100 rounded-2xl text-slate-500">Voltar</button>
              <button onClick={handleFinishArea} disabled={isLoading} className="flex-1 py-4 font-black uppercase text-[10px] bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700">
                {isLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
