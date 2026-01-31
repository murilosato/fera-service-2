
import React, { useState } from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, Clock, MapPin, Calendar, X, ChevronDown, ChevronUp, Calculator, Ruler, Loader2 } from 'lucide-react';
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
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; areaId: string; serviceId?: string } | null>(null);

  const [newArea, setNewArea] = useState<Partial<Area>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startReference: '',
    observations: ''
  });

  const [newService, setNewService] = useState({
    type: ServiceType.VARRICAO_KM,
    quantity: ''
  });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleAddArea = async () => {
    if (!newArea.name || !newArea.startReference) {
      alert("Preencha o Número da OS e o Logradouro");
      return;
    }
    
    setIsLoading(true);
    try {
      await dbSave('areas', {
        company_id: state.currentUser?.companyId,
        name: newArea.name,
        start_date: newArea.startDate,
        start_reference: newArea.startReference,
        observations: newArea.observations
      });
      await refreshData();
      setIsAddingArea(false);
      setNewArea({ name: '', startDate: new Date().toISOString().split('T')[0], startReference: '', observations: '' });
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async (areaId: string) => {
    const qty = parseFloat(newService.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    setIsLoading(true);
    try {
      const unitValue = state.serviceRates[newService.type] || 0;
      await dbSave('services', {
        company_id: state.currentUser?.companyId,
        area_id: areaId,
        type: newService.type,
        area_m2: qty, // Nome correto da coluna no banco
        unit_value: unitValue,
        total_value: unitValue * qty,
        service_date: new Date().toISOString().split('T')[0]
      });
      await refreshData();
      setNewService({ ...newService, quantity: '' });
    } catch (e: any) {
      alert("Erro ao registrar serviço: " + e.message);
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
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Produção de Campo</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de O.S.</p>
        </div>
        <button onClick={() => setIsAddingArea(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl">
          <Plus size={18} /> Nova O.S.
        </button>
      </header>

      {isAddingArea && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
             <h3 className="font-black text-sm uppercase tracking-widest">Nova Ordem de Serviço</h3>
             <button onClick={() => setIsAddingArea(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número da OS</label>
              <input className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-slate-900" placeholder="Ex: OS-2024-001" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Trecho</label>
              <input className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-slate-900" placeholder="Rua / Avenida" value={newArea.startReference} onChange={e => setNewArea({...newArea, startReference: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button disabled={isLoading} onClick={handleAddArea} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-700 transition-all">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'CRIAR O.S. NO BANCO'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {state.areas.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
            <p className="text-xs font-black text-slate-300 uppercase">Aguardando registros da nuvem...</p>
          </div>
        ) : (
          state.areas.map(area => (
            <div key={area.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
              <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">OS</div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">{area.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{area.startReference}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id })} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                  <button onClick={() => setExpandedAreaId(expandedAreaId === area.id ? null : area.id)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    {expandedAreaId === area.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {expandedAreaId === area.id && (
                <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lançar Produção</h4>
                         <select className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase outline-none" value={newService.type} onChange={e => setNewService({...newService, type: e.target.value as ServiceType})}>
                            {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                         </select>
                         <input type="number" className="w-full bg-slate-50 border p-4 rounded-2xl text-xs font-black outline-none" placeholder="Quantidade (m² ou KM)" value={newService.quantity} onChange={e => setNewService({...newService, quantity: e.target.value})} />
                         <button disabled={isLoading} onClick={() => handleAddService(area.id)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all">
                            {isLoading ? 'SINCRONIZANDO...' : 'LANÇAR NO BANCO'}
                         </button>
                      </div>
                      <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        <table className="w-full text-left">
                           <thead className="bg-slate-100 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                              <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Serviço</th><th className="px-6 py-4 text-right">Qtd</th><th className="px-6 py-4 text-center">Ações</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {area.services?.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-[10px] font-black text-slate-300 uppercase italic">Nenhum serviço lançado nesta OS</td></tr>
                              ) : (
                                area.services?.map(s => (
                                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{s.serviceDate.split('-').reverse().join('/')}</td>
                                     <td className="px-6 py-4 text-[11px] font-black uppercase text-slate-800">{s.type}</td>
                                     <td className="px-6 py-4 text-right text-[11px] font-black text-emerald-600">{s.areaM2.toLocaleString('pt-BR')}</td>
                                     <td className="px-6 py-4 text-center">
                                        <button onClick={() => setConfirmDelete({ isOpen: true, areaId: area.id, serviceId: s.id })} className="text-rose-300 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
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
        title="Confirmar Exclusão" 
        message="Esta operação removerá os dados permanentemente do servidor central. Deseja prosseguir?" 
      />
    </div>
  );
};

export default Production;
