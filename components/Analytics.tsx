
import React, { useState, useMemo } from 'react';
import { AppState, Employee } from '../types';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Users, 
  Package, 
  DollarSign, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Filter, 
  Calendar,
  FileText,
  CreditCard,
  MapPinned,
  Fingerprint,
  PhoneCall
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Inteligência Operacional</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Relatórios de BI e Auditoria de Pessoal</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[10px] font-bold uppercase bg-transparent outline-none" />
          <span className="text-slate-300">|</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-[10px] font-bold uppercase bg-transparent outline-none" />
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/20">
           <div>
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Ficha Cadastral e Financeira</h3>
              <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Gere o acerto completo com todos os dados do colaborador</p>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                className="w-full md:w-64 bg-white border border-slate-200 pl-9 pr-4 py-2 rounded text-[11px] font-bold outline-none focus:border-emerald-500"
                placeholder="Pesquisar por nome..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
           {filteredEmployees.map(emp => (
             <button 
               key={emp.id}
               onClick={() => setSelectedEmployeeId(emp.id)}
               className={`flex items-center gap-3 p-3 rounded border text-left transition-all ${selectedEmployeeId === emp.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
             >
                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${selectedEmployeeId === emp.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-none">{emp.name}</p>
                   <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1">{emp.role}</p>
                </div>
                {selectedEmployeeId === emp.id && <CheckCircle2 size={16} className="text-emerald-600" />}
             </button>
           ))}
        </div>

        {selectedEmployeeId && (
          <div className="m-4 bg-slate-900 text-white rounded overflow-hidden shadow-xl animate-in slide-in-from-bottom-2 duration-200">
             <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna 1: Dados Pessoais */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-emerald-400">
                      <Fingerprint size={16} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Identificação</h4>
                   </div>
                   <div className="space-y-2">
                      <p className="text-lg font-black uppercase leading-tight">{selectedEmployee?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedEmployee?.role}</p>
                      <div className="pt-2 border-t border-white/10 space-y-1">
                         <p className="text-[9px] font-bold uppercase flex justify-between"><span>CPF:</span> <span className="text-white">{selectedEmployee?.cpf || '--'}</span></p>
                         <p className="text-[9px] font-bold uppercase flex justify-between"><span>TEL:</span> <span className="text-white">{selectedEmployee?.phone || '--'}</span></p>
                      </div>
                   </div>
                </div>

                {/* Coluna 2: Localização e Pagamento */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-blue-400">
                      <CreditCard size={16} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Pagamento & Local</h4>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-slate-400">Endereço:</p>
                      <p className="text-[10px] font-black uppercase leading-relaxed">{selectedEmployee?.address || 'Não cadastrado'}</p>
                      <div className="pt-2 border-t border-white/10 space-y-1">
                         <p className="text-[9px] font-bold uppercase flex justify-between"><span>TIPO:</span> <span className="text-emerald-400">{selectedEmployee?.paymentModality?.toUpperCase()}</span></p>
                         <p className="text-[9px] font-bold uppercase flex justify-between"><span>CHAVE:</span> <span className="text-white truncate max-w-[150px]">{selectedEmployee?.pixKey || '--'}</span></p>
                      </div>
                   </div>
                </div>

                {/* Coluna 3: Acerto do Período */}
                <div className="bg-white/5 p-6 rounded border border-white/10 flex flex-col justify-center items-center text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Total no Período</p>
                   <p className="text-3xl font-black text-emerald-400 mb-4">{formatMoney(totalToPay)}</p>
                   <button 
                    onClick={() => setShowPrintView(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                      <Printer size={16} /> IMPRIMIR FICHA COMPLETA
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {showPrintView && (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto p-4 md:p-10 font-serif">
           <div className="max-w-4xl mx-auto bg-white border-2 border-slate-900 p-12 shadow-2xl text-slate-900">
              <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Fera Service</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Relatório Operacional de Equipe</p>
                 </div>
                 <div className="text-right">
                    <h2 className="text-lg font-black uppercase leading-none">Acerto de Diárias</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Período: {formatDate(startDate)} a {formatDate(endDate)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-10 text-[11px] uppercase border-b border-slate-200 pb-10">
                 <div className="space-y-2">
                    <p className="font-black border-b border-slate-900 pb-1">Dados do Colaborador</p>
                    <p><span className="font-black">Nome:</span> {selectedEmployee?.name}</p>
                    <p><span className="font-black">Cargo:</span> {selectedEmployee?.role}</p>
                    <p><span className="font-black">CPF:</span> {selectedEmployee?.cpf || '--'}</p>
                    <p><span className="font-black">Endereço:</span> {selectedEmployee?.address || '--'}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="font-black border-b border-slate-900 pb-1">Dados Bancários / Pix</p>
                    <p><span className="font-black">Modalidade:</span> {selectedEmployee?.paymentModality?.toUpperCase()}</p>
                    <p><span className="font-black">Identificador:</span> {selectedEmployee?.pixKey || '--'}</p>
                    <div className="pt-4">
                       <p className="text-sm font-black bg-slate-100 p-2 border border-slate-900 flex justify-between">
                          TOTAL BRUTO: <span className="text-emerald-700">{formatMoney(totalToPay)}</span>
                       </p>
                    </div>
                 </div>
              </div>

              <table className="w-full text-[10px] border-collapse border border-slate-300 mb-20 uppercase">
                 <thead>
                    <tr className="bg-slate-100">
                       <th className="border border-slate-300 p-2 text-left">Data do Serviço</th>
                       <th className="border border-slate-300 p-2 text-center">Status Presença</th>
                       <th className="border border-slate-300 p-2 text-right">Valor da Diária</th>
                    </tr>
                 </thead>
                 <tbody>
                    {attendanceHistory.map(h => (
                       <tr key={h.id}>
                          <td className="border border-slate-300 p-2 font-bold">{formatDate(h.date)}</td>
                          <td className="border border-slate-300 p-2 text-center">{h.status === 'present' ? 'TRABALHADO' : 'AUSENTE'}</td>
                          <td className="border border-slate-300 p-2 text-right">{h.status === 'present' ? formatMoney(h.value) : '--'}</td>
                       </tr>
                    ))}
                 </tbody>
                 <tfoot>
                    <tr className="bg-slate-50 font-black">
                       <td colSpan={2} className="border border-slate-300 p-3 text-right">TOTAL ACUMULADO</td>
                       <td className="border border-slate-300 p-3 text-right text-lg">{formatMoney(totalToPay)}</td>
                    </tr>
                 </tfoot>
              </table>

              <div className="grid grid-cols-2 gap-16 mt-32 text-center text-[10px] uppercase font-black">
                 <div className="border-t-2 border-slate-900 pt-3">
                    {selectedEmployee?.name}<br/>
                    <span className="font-bold opacity-40">Assinatura do Colaborador</span>
                 </div>
                 <div className="border-t-2 border-slate-900 pt-3">
                    Fera Service Gestão<br/>
                    <span className="font-bold opacity-40">Assinatura Supervisor Responsável</span>
                 </div>
              </div>

              <div className="fixed bottom-10 right-10 flex gap-4 print:hidden font-sans">
                 <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest shadow-xl">IMPRIMIR DOCUMENTO</button>
                 <button onClick={() => setShowPrintView(false)} className="px-6 py-3 bg-white border border-slate-300 text-slate-600 rounded font-black text-xs uppercase tracking-widest">FECHAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
