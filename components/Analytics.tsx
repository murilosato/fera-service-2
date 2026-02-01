
import React, { useState, useMemo, useEffect } from 'react';
import { AppState } from '../types';
import { 
  Printer, Fingerprint, CreditCard, CheckCircle2, Search, Calendar, FileText, X, Phone, MapPin, User, Hash
} from 'lucide-react';

interface AnalyticsProps {
  state: AppState;
}

const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateStr: string) => dateStr.split('-').reverse().join('/');
  const isWithinRange = (dateStr: string) => dateStr >= startDate && dateStr <= endDate;

  const filteredEmployees = state.employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedEmployee = state.employees.find(e => e.id === selectedEmployeeId);
  
  const attendanceHistory = useMemo(() => {
    return state.attendanceRecords
      .filter(r => r.employeeId === selectedEmployeeId && isWithinRange(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.attendanceRecords, selectedEmployeeId, startDate, endDate]);

  const totalToPay = attendanceHistory
    .filter(r => r.status === 'present')
    .reduce((acc, r) => acc + r.value, 0);

  useEffect(() => {
    if (showPrintView) {
      setTimeout(() => {
        window.print();
        setShowPrintView(false);
      }, 500);
    }
  }, [showPrintView]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Auditoria & Analytics</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Ficha de Acerto de Colaboradores</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
          <span className="text-slate-300">|</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm lg:col-span-1 h-[calc(100vh-250px)] flex flex-col">
          <div className="p-4 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none" placeholder="BUSCAR NOME..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {filteredEmployees.map(emp => (
               <button 
                 key={emp.id}
                 onClick={() => setSelectedEmployeeId(emp.id)}
                 className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selectedEmployeeId === emp.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
               >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${selectedEmployeeId === emp.id ? 'bg-blue-600' : 'bg-slate-100'}`}>{emp.name.charAt(0)}</div>
                  <div className="min-w-0">
                     <p className="text-[10px] font-black uppercase truncate">{emp.name}</p>
                     <p className="text-[8px] font-bold uppercase tracking-tight opacity-60">{emp.role}</p>
                  </div>
               </button>
             ))}
          </div>
        </div>

        <div className="lg:col-span-3">
           {selectedEmployee ? (
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="p-8 bg-slate-900 text-white space-y-6">
                   <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/5"><User size={20} className="text-emerald-400" /></div>
                            <div>
                               <h4 className="text-xl font-black uppercase leading-tight tracking-tight">{selectedEmployee.name}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEmployee.role}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Hash size={12}/> CPF: <span className="text-white">{selectedEmployee.cpf || 'NÃO CADASTRADO'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Phone size={12}/> CONTATO: <span className="text-white">{selectedEmployee.phone || '--'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><CreditCard size={12}/> PIX: <span className="text-white truncate max-w-[150px]">{selectedEmployee.pixKey || '--'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><MapPin size={12}/> ENDEREÇO: <span className="text-white truncate max-w-[150px]">{selectedEmployee.address || '--'}</span></div>
                         </div>
                      </div>
                      <div className="md:w-64 bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col justify-center text-center">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total a Pagar</p>
                         <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{formatMoney(totalToPay)}</h2>
                         <button onClick={() => setShowPrintView(true)} className="mt-4 w-full bg-white text-slate-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                            <Printer size={16} /> IMPRIMIR FICHA
                         </button>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100">
                         <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4 text-center">Frequência</th><th className="px-8 py-4 text-right">Valor</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px]">
                         {attendanceHistory.map(h => (
                           <tr key={h.id} className="hover:bg-slate-50/50">
                              <td className="px-8 py-3 font-bold text-slate-500">{formatDate(h.date)}</td>
                              <td className="px-8 py-3 text-center uppercase">
                                 <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${h.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {h.status === 'present' ? 'P' : 'F'}
                                 </span>
                              </td>
                              <td className="px-8 py-3 text-right font-black text-slate-700">{h.status === 'present' ? formatMoney(h.value) : '--'}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center opacity-60">
                <FileText size={48} className="text-slate-300 mb-6" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Selecione um Colaborador</h3>
             </div>
           )}
        </div>
      </div>

      {showPrintView && (
        <div className="fixed inset-0 z-[1000] bg-white overflow-y-auto p-12 font-serif text-slate-900 print:p-0">
           <div className="max-w-4xl mx-auto border-2 border-slate-900 p-12 relative">
              <div className="border-b-4 border-slate-900 pb-6 mb-10 flex justify-between items-end">
                 <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Fera Service</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Sistemas de Gestão Urbana</p>
                 </div>
                 <div className="text-right uppercase">
                    <h2 className="text-lg font-black">Ficha de Acerto Individual</h2>
                    <p className="text-[10px] font-bold">{formatDate(startDate)} a {formatDate(endDate)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-10 text-[11px] uppercase border-b border-slate-200 pb-10">
                 <div className="space-y-2">
                    <p><span className="font-black">Colaborador:</span> {selectedEmployee?.name}</p>
                    <p><span className="font-black">Cargo:</span> {selectedEmployee?.role}</p>
                    <p><span className="font-black">CPF:</span> {selectedEmployee?.cpf || '--'}</p>
                    <p><span className="font-black">Endereço:</span> {selectedEmployee?.address || '--'}</p>
                 </div>
                 <div className="space-y-2 text-right">
                    <p><span className="font-black">Chave Pix:</span> {selectedEmployee?.pixKey || '--'}</p>
                    <p><span className="font-black">Valor Total:</span> <span className="text-xl font-black">{formatMoney(totalToPay)}</span></p>
                 </div>
              </div>

              <table className="w-full text-[10px] border-collapse mb-16 uppercase border border-slate-200">
                 <thead>
                    <tr className="bg-slate-100"><th className="border p-2 text-left">Data</th><th className="border p-2 text-center">Frequência</th><th className="border p-2 text-right">Valor</th></tr>
                 </thead>
                 <tbody>
                    {attendanceHistory.map(h => (
                       <tr key={h.id}>
                          <td className="border p-2">{formatDate(h.date)}</td>
                          <td className="border p-2 text-center">{h.status === 'present' ? 'PRESENTE' : 'FALTA'}</td>
                          <td className="border p-2 text-right">{h.status === 'present' ? formatMoney(h.value) : '--'}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              <div className="grid grid-cols-2 gap-20 mt-20 text-center text-[10px] uppercase font-black">
                 <div className="border-t-2 border-slate-900 pt-3">Assinatura do Colaborador</div>
                 <div className="border-t-2 border-slate-900 pt-3">Superintendente Responsável</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
