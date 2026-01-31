
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { 
  Printer, Fingerprint, CreditCard, CheckCircle2, Search, Calendar, FileText
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
        {/* Coluna de Seleção */}
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm lg:col-span-1 h-[calc(100vh-250px)] flex flex-col">
          <div className="p-4 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-blue-500"
                  placeholder="Buscar nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {filteredEmployees.map(emp => (
               <button 
                 key={emp.id}
                 onClick={() => setSelectedEmployeeId(emp.id)}
                 className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selectedEmployeeId === emp.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
               >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${selectedEmployeeId === emp.id ? 'bg-blue-600' : 'bg-slate-100'}`}>
                     {emp.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                     <p className="text-[10px] font-black uppercase truncate">{emp.name}</p>
                     <p className={`text-[8px] font-bold uppercase tracking-tight ${selectedEmployeeId === emp.id ? 'text-slate-400' : 'text-slate-400'}`}>{emp.role}</p>
                  </div>
               </button>
             ))}
          </div>
        </div>

        {/* Detalhes da Auditoria */}
        <div className="lg:col-span-3 space-y-6">
           {selectedEmployee ? (
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                <div className="p-8 bg-slate-900 text-white grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-400"><Fingerprint size={16} /><h4 className="text-[10px] font-black uppercase tracking-widest">Identificação</h4></div>
                      <div className="space-y-1">
                        <p className="text-xl font-black uppercase leading-tight">{selectedEmployee.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedEmployee.role}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400"><CreditCard size={16} /><h4 className="text-[10px] font-black uppercase tracking-widest">Local & Pagamento</h4></div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase text-slate-500">Endereço:</p>
                        <p className="text-[10px] font-black uppercase truncate">{selectedEmployee.address || 'Não informado'}</p>
                      </div>
                   </div>
                   <div className="bg-white/10 rounded-3xl p-6 border border-white/5 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total no Período</p>
                      <p className="text-3xl font-black text-emerald-400">{formatMoney(totalToPay)}</p>
                      <button onClick={() => setShowPrintView(true)} className="mt-4 w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg">
                        <Printer size={14} /> Gerar PDF
                      </button>
                   </div>
                </div>

                <div className="p-0">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black tracking-widest border-b border-slate-100">
                         <tr><th className="px-8 py-5">Data do Registro</th><th className="px-8 py-5 text-center">Status Presença</th><th className="px-8 py-5 text-right">Valor da Diária</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {attendanceHistory.length === 0 ? (
                           <tr><td colSpan={3} className="px-8 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">Nenhuma frequência encontrada no período</td></tr>
                         ) : (
                           attendanceHistory.map(h => (
                             <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{formatDate(h.date)}</td>
                                <td className="px-8 py-4 text-center uppercase">
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${h.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {h.status === 'present' ? 'Trabalhado' : 'Ausente'}
                                   </span>
                                </td>
                                <td className="px-8 py-4 text-right text-[11px] font-black text-slate-700">{h.status === 'present' ? formatMoney(h.value) : '--'}</td>
                             </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center opacity-60">
                <FileText size={48} className="text-slate-300 mb-6" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Selecione um Colaborador</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Para visualizar a ficha de acerto e gerar relatórios</p>
             </div>
           )}
        </div>
      </div>

      {showPrintView && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto p-10 font-serif text-slate-900">
           <div className="max-w-4xl mx-auto border-2 border-slate-900 p-12 relative">
              <button onClick={() => setShowPrintView(false)} className="absolute top-4 right-4 p-2 bg-slate-900 text-white rounded-full print:hidden"><X size={20}/></button>
              <div className="border-b-4 border-slate-900 pb-6 mb-10 flex justify-between items-end">
                 <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Fera Service</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Sistemas de Gestão Urbana</p>
                 </div>
                 <div className="text-right uppercase">
                    <h2 className="text-lg font-black">Acerto de Diárias</h2>
                    <p className="text-[10px] font-bold">{formatDate(startDate)} a {formatDate(endDate)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-10 text-[11px] uppercase border-b border-slate-200 pb-10">
                 <div className="space-y-2">
                    <p className="font-black border-b border-slate-900 pb-1">Dados Cadastrais</p>
                    <p><span className="font-black">Nome:</span> {selectedEmployee?.name}</p>
                    <p><span className="font-black">Cargo:</span> {selectedEmployee?.role}</p>
                    <p><span className="font-black">CPF:</span> {selectedEmployee?.cpf || '--'}</p>
                 </div>
                 <div className="space-y-2 text-right">
                    <p className="font-black border-b border-slate-900 pb-1 text-right">Informações Financeiras</p>
                    <p><span className="font-black">Pix:</span> {selectedEmployee?.pixKey || '--'}</p>
                    <p><span className="font-black">Total:</span> <span className="text-lg font-black">{formatMoney(totalToPay)}</span></p>
                 </div>
              </div>

              <table className="w-full text-[10px] border-collapse mb-16 uppercase">
                 <thead>
                    <tr className="bg-slate-100"><th className="border border-slate-300 p-2 text-left">Data</th><th className="border border-slate-300 p-2 text-center">Presença</th><th className="border border-slate-300 p-2 text-right">Valor</th></tr>
                 </thead>
                 <tbody>
                    {attendanceHistory.map(h => (
                       <tr key={h.id}>
                          <td className="border border-slate-300 p-2">{formatDate(h.date)}</td>
                          <td className="border border-slate-300 p-2 text-center">{h.status === 'present' ? 'P' : 'F'}</td>
                          <td className="border border-slate-300 p-2 text-right">{h.status === 'present' ? formatMoney(h.value) : '--'}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              <div className="grid grid-cols-2 gap-20 mt-20 text-center text-[10px] uppercase font-black">
                 <div className="border-t-2 border-slate-900 pt-3">Assinatura do Colaborador</div>
                 <div className="border-t-2 border-slate-900 pt-3">Supervisor Responsável</div>
              </div>

              <div className="fixed bottom-10 right-10 print:hidden flex gap-4">
                 <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl">Imprimir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const X = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
);

export default Analytics;
