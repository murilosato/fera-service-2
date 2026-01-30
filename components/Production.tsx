
import React, { useState } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, Clock, LayoutGrid, AlertCircle, MapPin, Calendar, X, ChevronDown, ChevronUp, Calculator, Ruler, CalendarDays } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants';
import ConfirmationModal from './ConfirmationModal';

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
  
  // Estado para Confirmações
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; areaId: string; serviceId?: string } | null>(null);

  // Estado para Finalização de O.S.
  const [finalizingAreaId, setFinalizingAreaId] = useState<string | null>(null);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para Nova O.S.
  const [newArea, setNewArea] = useState<Partial<Area>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startReference: '',
    endReference: '',
    observations: '',
    services: []
  });

  // Estados para Novo Serviço
  const [newService, setNewService] = useState({
    type: ServiceType.VARRICAO_KM,
    quantity: ''
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const handleAddArea = () => {
    if (!newArea.name || !newArea.startReference) return;
    const area: Area = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.currentUser?.companyId || 'default-company',
      name: newArea.name!,
      startDate: newArea.startDate!,
      startReference: newArea.startReference!,
      endReference: newArea.endReference || '',
      observations: newArea.observations || '',
      services: []
    };
    setState(prev => ({ ...prev, areas: [area, ...prev.areas] }));
    setIsAddingArea(false);
    setNewArea({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      startReference: '',
      endReference: '',
      observations: '',
      services: []
    });
  };

  const handleAddService = (areaId: string) => {
    const qty = parseFloat(newService.quantity);
    if (isNaN(qty) || qty <= 0) return;

    const unitValue = state.serviceRates[newService.type] || 0;
    const totalValue = unitValue * qty;

    const service: Service = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: state.currentUser?.companyId || 'default-company',
      areaId,
      type: newService.type,
      areaM2: qty,
      unitValue,
      totalValue,
      serviceDate: new Date().toISOString().split('T')[0]
    };

    setState(prev => ({
      ...prev,
      areas: prev.areas.map(a => 
        a.id === areaId ? { ...a, services: [...a.services, service] } : a
      )
    }));

    setNewService({ ...newService, quantity: '' });
  };

  const performDelete = () => {
    if (!confirmDelete) return;
    const { areaId, serviceId } = confirmDelete;

    if (serviceId) {
      setState(prev => ({
        ...prev,
        areas: prev.areas.map(a => 
          a.id === areaId ? { ...a, services: a.services.filter(s => s.id !== serviceId) } : a
        )
      }));
    } else {
      setState(prev => ({ ...prev, areas: prev.areas.filter(a => a.id !== areaId) }));
    }
  };

  const handleFinalize = () => {
    if (!finalizingAreaId) return;
    
    setState(prev => ({
      ...prev,
      areas: prev.areas.map(a => a.id === finalizingAreaId ? { ...a, endDate: closingDate } : a)
    }));
    
    setFinalizingAreaId(null);
    setActiveFilter('closed');
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
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Lançamento de Metragem e Controle de O.S.</p>
        </div>
        <button 
          onClick={() => setIsAddingArea(true)}
          className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Nova O.S.
        </button>
      </header>

      {/* FORM NOVA O.S. */}
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
              <input 
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500"
                placeholder="Ex: OS-001"
                value={newArea.name}
                onChange={e => setNewArea({...newArea, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Início</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                value={newArea.startDate}
                onChange={e => setNewArea({...newArea, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Início</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500"
                placeholder="Ex: Av. Central"
                value={newArea.startReference}
                onChange={e => setNewArea({...newArea, startReference: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência / Final</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500"
                placeholder="Ex: Rua 10"
                value={newArea.endReference}
                onChange={e => setNewArea({...newArea, endReference: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setIsAddingArea(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
            <button onClick={handleAddArea} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-600 transition-all">Abrir O.S.</button>
          </div>
        </div>
      )}

      {/* FECHAMENTO DE O.S. */}
      {finalizingAreaId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest">Encerrar Ordem de Serviço</h3>
               <button onClick={() => setFinalizingAreaId(null)} className="text-slate-300"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Conclusão</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  value={closingDate}
                  onChange={e => setClosingDate(e.target.value)}
                />
              </div>
              <button 
                onClick={handleFinalize}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Confirmar Encerramento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button 
          onClick={() => setActiveFilter('open')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeFilter === 'open' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
        >
          <Clock size={14} /> Em Aberto
        </button>
        <button 
          onClick={() => setActiveFilter('closed')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeFilter === 'closed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
        >
          <CheckCircle2 size={14} /> Finalizadas
        </button>
      </div>

      {/* LISTAGEM DE O.S. */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white py-24 rounded-[32px] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
             <AlertCircle size={48} className="text-slate-200 mb-4" />
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma Ordem de Serviço encontrada</p>
          </div>
        ) : (
          filteredAreas.map(area => {
            const totalOS = area.services.reduce((acc, s) => acc + s.totalValue, 0);
            const isExpanded = expandedAreaId === area.id;

            return (
              <div key={area.id} className={`bg-white rounded-[24px] border ${area.endDate ? 'border-emerald-100 shadow-emerald-900/5' : 'border-slate-200 shadow-sm'} overflow-hidden transition-all duration-300`}>
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 ${area.endDate ? 'bg-emerald-600' : 'bg-slate-900'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                      {area.endDate ? <CheckCircle2 size={24} /> : <Calculator size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="text-base font-black text-slate-900 uppercase leading-none">{area.name}</h3>
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${area.endDate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                           {area.endDate ? 'Finalizada' : 'Ativa'}
                         </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {area.startReference} {area.endReference ? `➜ ${area.endReference}` : ''}
                        </p>
                        {area.endDate ? (
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                               <CalendarDays size={10} className="text-blue-500" />
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Início: {formatDate(area.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg">
                               <CheckCircle2 size={10} className="text-emerald-500" />
                               <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">Fim: {formatDate(area.endDate)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1 bg-slate-50 w-fit px-2 py-1 rounded-lg">
                            <CalendarDays size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Aberta em: {formatDate(area.startDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Total Produzido</p>
                       <p className="text-lg font-black text-slate-900 leading-none">{formatMoney(totalOS)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                        className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                       >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                       </button>
                       {!area.endDate && (
                         <button 
                          onClick={() => setFinalizingAreaId(area.id)} 
                          className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-md"
                         >
                           Encerrar
                         </button>
                       )}
                       <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id })} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>

                {/* DETALHES E LANÇAMENTOS (EXPANDIDO) */}
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
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-400 uppercase">Tipo de Serviço</label>
                                   <select 
                                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500"
                                      value={newService.type}
                                      onChange={e => setNewService({...newService, type: e.target.value as ServiceType})}
                                   >
                                      {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                   </select>
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-400 uppercase">Quantidade / M²</label>
                                   <input 
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                                      placeholder="0.00"
                                      value={newService.quantity}
                                      onChange={e => setNewService({...newService, quantity: e.target.value})}
                                   />
                                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic">Data automática: {new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                                <button 
                                   onClick={() => handleAddService(area.id)}
                                   className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                                >
                                   Registrar Serviço
                                </button>
                             </div>
                          </div>
                        )}

                        <div className="flex-1 overflow-hidden">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Calendar size={14} /> Histórico de Produção da O.S.
                           </h4>
                           <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                              <table className="w-full text-left">
                                 <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                       <th className="px-5 py-3">Data</th>
                                       <th className="px-5 py-3">Serviço</th>
                                       <th className="px-5 py-3 text-right">Qtd</th>
                                       <th className="px-5 py-3 text-right">Valor</th>
                                       {!area.endDate && <th className="px-5 py-3 text-center">Ação</th>}
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {area.services.length === 0 ? (
                                      <tr><td colSpan={5} className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase italic">Nenhum serviço registrado nesta O.S.</td></tr>
                                    ) : (
                                      area.services.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                           <td className="px-5 py-3 text-[10px] font-bold text-slate-500">{formatDate(s.serviceDate)}</td>
                                           <td className="px-5 py-3 text-[10px] font-black text-slate-800 uppercase leading-tight">{s.type}</td>
                                           <td className="px-5 py-3 text-[11px] font-black text-slate-700 text-right">{s.areaM2.toLocaleString('pt-BR')}</td>
                                           <td className="px-5 py-3 text-[11px] font-black text-emerald-600 text-right">{formatMoney(s.totalValue)}</td>
                                           {!area.endDate && (
                                             <td className="px-5 py-3 text-center">
                                                <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id })} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                             </td>
                                           )}
                                        </tr>
                                      ))
                                    )}
                                 </tbody>
                              </table>
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

      <ConfirmationModal 
        isOpen={!!confirmDelete?.isOpen}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title={confirmDelete?.serviceId ? "Remover Serviço" : "Excluir O.S."}
        message={confirmDelete?.serviceId 
          ? "Deseja remover este serviço da O.S.? Esta ação não pode ser desfeita." 
          : "Deseja EXCLUIR permanentemente esta O.S. e todos os seus serviços?"}
        confirmText="Excluir Agora"
      />
    </div>
  );
};

export default Production;
