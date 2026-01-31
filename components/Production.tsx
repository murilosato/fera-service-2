
import React, { useState } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, Clock, LayoutGrid, AlertCircle, MapPin, Calendar, X, ChevronDown, ChevronUp, Calculator, Ruler, CalendarDays } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface ProductionProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Production: React.FC<ProductionProps> = ({ state, setState }) => {
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; areaId: string; serviceId?: string } | null>(null);
  const [finalizingAreaId, setFinalizingAreaId] = useState<string | null>(null);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  const [newArea, setNewArea] = useState<Partial<Area>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startReference: '',
    endReference: '',
    observations: ''
  });

  const [newService, setNewService] = useState({
    type: ServiceType.VARRICAO_KM,
    quantity: '',
    modality: 'UNITARIO' as 'UNITARIO' | 'MENSAL'
  });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleAddArea = async () => {
    if (!newArea.name || !newArea.startReference) return;
    setIsLoading(true);
    try {
      await dbSave('areas', {
        company_id: state.currentUser?.companyId,
        name: newArea.name,
        start_date: newArea.startDate,
        start_reference: newArea.startReference,
        end_reference: newArea.endReference,
        observations: newArea.observations
      });
      await refreshData();
      setIsAddingArea(false);
      setNewArea({ name: '', startDate: new Date().toISOString().split('T')[0], startReference: '', endReference: '', observations: '' });
    } catch (e) {
      alert("Erro ao salvar O.S.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async (areaId: string) => {
    const qty = parseFloat(newService.quantity);
    if (isNaN(qty) || qty <= 0) return;

    setIsLoading(true);
    try {
      const unitValue = state.serviceRates[newService.type] || 0;
      await dbSave('services', {
        company_id: state.currentUser?.companyId,
        area_id: areaId,
        type: newService.type,
        modality: newService.modality,
        quantity: qty,
        unit_value: unitValue,
        total_value: unitValue * qty,
        service_date: new Date().toISOString().split('T')[0]
      });
      await refreshData();
      setNewService({ ...newService, quantity: '' });
    } catch (e) {
      alert("Erro ao salvar serviço");
    } finally {
      setIsLoading(false);
    }
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
    } catch (e) {
      alert("Erro ao excluir.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!finalizingAreaId) return;
    setIsLoading(true);
    try {
      await dbSave('areas', { id: finalizingAreaId, end_date: closingDate });
      await refreshData();
      setFinalizingAreaId(null);
    } catch (e) {
      alert("Erro ao finalizar O.S.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAreas = state.areas.filter(a => {
    if (activeFilter === 'open') return !a.endDate;
    if (activeFilter === 'closed') return !!a.endDate;
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Produção em Campo</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Sincronizado com Nuvem Supabase</p>
        </div>
        <button onClick={() => setIsAddingArea(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
          <Plus size={16} strokeWidth={3} /> Nova O.S.
        </button>
      </header>

      {isAddingArea && (
        <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3 text-emerald-600">
                <MapPin size={20} />
                <h3 className="font-black text-xs uppercase tracking-widest">Abertura de Ordem de Serviço</h3>
             </div>
             <button onClick={() => setIsAddingArea(false)} className="text-slate-300 hover:text-slate-500"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação / Nº OS</label>
              <input className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500" placeholder="Ex: OS-001" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Início</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" value={newArea.startDate} onChange={e => setNewArea({...newArea, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Início</label>
              <input className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500" placeholder="Ex: Av. Central" value={newArea.startReference} onChange={e => setNewArea({...newArea, startReference: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência / Final</label>
              <input className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500" placeholder="Ex: Rua 10" value={newArea.endReference} onChange={e => setNewArea({...newArea, endReference: e.target.value})} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button disabled={isLoading} onClick={handleAddArea} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-600 transition-all flex items-center gap-2">
              {isLoading && <Clock size={14} className="animate-spin" />} {isLoading ? 'SALVANDO...' : 'ABRIR O.S.'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredAreas.map(area => {
          const totalOS = (area as any).services?.reduce((acc: number, s: any) => acc + (s.total_value || 0), 0) || 0;
          const isExpanded = expandedAreaId === area.id;

          return (
            <div key={area.id} className={`bg-white rounded-[24px] border ${area.endDate ? 'border-emerald-100 shadow-emerald-900/5' : 'border-slate-200 shadow-sm'} overflow-hidden transition-all duration-300`}>
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 ${area.endDate ? 'bg-emerald-600' : 'bg-slate-900'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                    {area.endDate ? <CheckCircle2 size={24} /> : <Calculator size={24} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase leading-none mb-1">{area.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{(area as any).start_reference} { (area as any).end_reference ? `➜ ${(area as any).end_reference}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Produzido</p>
                     <p className="text-lg font-black text-slate-900">{formatMoney(totalOS)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setExpandedAreaId(isExpanded ? null : area.id)} className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                     </button>
                     <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id })} className="p-3 text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-50 bg-slate-50/50 p-6 animate-in slide-in-from-top-2">
                   <div className="flex flex-col lg:flex-row gap-6">
                      {!area.endDate && (
                        <div className="lg:w-1/3 bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                           <div className="flex items-center gap-2 text-blue-600 mb-2">
                              <Ruler size={16} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Lançar Produção</h4>
                           </div>
                           <div className="space-y-3">
                              <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
                                 <button onClick={() => setNewService({...newService, modality: 'UNITARIO'})} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${newService.modality === 'UNITARIO' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Unitário</button>
                                 <button onClick={() => setNewService({...newService, modality: 'MENSAL'})} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${newService.modality === 'MENSAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mensal</button>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase">Tipo de Serviço</label>
                                 <select className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as ServiceType})}>
                                    {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase">Quantidade / M²</label>
                                 <input type="number" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" placeholder="0.00" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                              </div>
                              <button disabled={isLoading} onClick={() => handleAddService(area.id)} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all">
                                 {isLoading ? 'REGISTRANDO...' : 'REGISTRAR SERVIÇO'}
                              </button>
                           </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14} /> Histórico de Produção da O.S.</h4>
                         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                               <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                                  <tr><th className="px-5 py-3">Data</th><th className="px-5 py-3">Serviço</th><th className="px-5 py-3 text-right">Qtd</th><th className="px-5 py-3 text-right">Valor</th><th className="px-5 py-3 text-center">Ação</th></tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {(area as any).services?.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50">
                                       <td className="px-5 py-3 text-slate-500">{s.service_date}</td>
                                       <td className="px-5 py-3"><span className="font-black uppercase">{s.type}</span><br/><span className="text-[8px] opacity-50">{s.modality}</span></td>
                                       <td className="px-5 py-3 text-right font-black">{s.quantity}</td>
                                       <td className="px-5 py-3 text-right font-black text-emerald-600">{formatMoney(s.total_value)}</td>
                                       <td className="px-5 py-3 text-center"><button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id })} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmationModal isOpen={!!confirmDelete?.isOpen} onClose={() => setConfirmDelete(null)} onConfirm={performDelete} title={confirmDelete?.serviceId ? "Remover Serviço" : "Excluir O.S."} message="Esta ação é irreversível e excluirá o registro no Supabase." confirmText="Excluir Agora" />
    </div>
  );
};

export default Production;
