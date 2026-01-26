
import React from 'react';
import { Area, Service, AppState, ServiceType } from '../types';
import { Plus, Trash2, CheckCircle2, Clock, RotateCcw, LayoutGrid, AlertCircle } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants';

interface ProductionProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Production: React.FC<ProductionProps> = ({ state, setState }) => {
  const [isAddingArea, setIsAddingArea] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'open' | 'closed'>('open');
  const [newArea, setNewArea] = React.useState<Partial<Area>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startReference: '',
    endReference: '',
    observations: '',
    services: []
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const handleAddArea = () => {
    if (!newArea.name || !newArea.startReference) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    const area: Area = {
      id: Math.random().toString(36).substr(2, 9),
      name: newArea.name!,
      startDate: newArea.startDate!,
      startReference: newArea.startReference!,
      endReference: newArea.endReference || 'Não informado',
      observations: newArea.observations!,
      services: []
    };
    setState(prev => ({ ...prev, areas: [...prev.areas, area] }));
    setIsAddingArea(false);
  };

  const finalizeArea = (areaId: string) => {
    const endDate = prompt("Data de conclusão:", new Date().toISOString().split('T')[0]);
    if (endDate) {
      setState(prev => ({
        ...prev,
        areas: prev.areas.map(a => a.id === areaId ? { ...a, endDate } : a)
      }));
    }
  };

  const filteredAreas = state.areas.filter(a => {
    if (activeFilter === 'open') return !a.endDate;
    if (activeFilter === 'closed') return !!a.endDate;
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Produção Urbana</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Controle de O.S. e Metragem</p>
        </div>
        <button 
          onClick={() => setIsAddingArea(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Nova O.S.
        </button>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit border border-slate-200">
        <button 
          onClick={() => setActiveFilter('open')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeFilter === 'open' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Clock size={14} /> Pendentes
        </button>
        <button 
          onClick={() => setActiveFilter('closed')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeFilter === 'closed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
        >
          <CheckCircle2 size={14} /> Finalizadas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAreas.map(area => (
          <div key={area.id} className={`bg-white rounded-3xl shadow-sm border ${area.endDate ? 'border-emerald-100' : 'border-amber-100'} overflow-hidden`}>
            <div className={`px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${area.endDate ? 'bg-emerald-50/20' : 'bg-amber-50/10'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${area.endDate ? 'bg-emerald-600' : 'bg-amber-500'} text-white rounded-2xl flex items-center justify-center shadow-md transition-colors`}>
                  {area.endDate ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800 uppercase leading-none">{area.name}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${area.endDate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {area.endDate ? 'Finalizada' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {formatDate(area.startDate)} | {area.startReference}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <p className="text-[8px] uppercase font-black text-slate-400">Total O.S.</p>
                  <p className="text-lg font-black text-slate-800">R$ {formatMoney(area.services.reduce((acc, s) => acc + s.totalValue, 0))}</p>
                </div>
                {!area.endDate && (
                  <button onClick={() => finalizeArea(area.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">Encerrar</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Production;
