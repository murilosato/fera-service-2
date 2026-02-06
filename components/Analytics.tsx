
import React, { useState, useMemo } from 'react';
import { AppState, AttendanceRecord } from '../types';
import { 
  Printer, Search, Calendar, FileText, User, Hash, Smartphone, Database, TableProperties,
  Users, DollarSign, Edit2, Save, Loader2, Clock, CheckCircle2, MapPin, X, ArrowRight
} from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';

interface AnalyticsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ state, setState, notify }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingValue, setEditingValue] = useState('');
  const [editingDiscount, setEditingDiscount] = useState('');
  const [editingObservation, setEditingObservation] = useState('');

  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeTitle, setFinanceTitle] = useState('');
  const [financeCategory, setFinanceCategory] = useState('');

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

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventory = () => {
    const headers = ["ID", "ITEM", "CATEGORIA", "QTD ATUAL", "VALOR UN", "TOTAL EM ESTOQUE"];
    const rows = state.inventory.map(i => [i.id, i.name, i.category, i.currentQty, i.unitValue, (i.currentQty * (i.unitValue || 0))]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    downloadCSV("Relatorio_Estoque", csvContent);
    notify("Planilha de estoque gerada!");
  };

  const exportEmployees = () => {
    const headers = ["ID", "NOME", "CARGO", "STATUS", "DIARIA PADRAO", "CPF", "MODALIDADE", "CARGA HORARIA"];
    const rows = state.employees.map(e => [e.id, e.name, e.role, e.status, e.defaultValue, e.cpf || "", e.paymentModality, e.workload || ""]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    downloadCSV("Relatorio_Equipe", csvContent);
    notify("Planilha de equipe gerada!");
  };

  const exportFinance = () => {
    const headers = ["DATA", "TIPO", "REFERENCIA", "CATEGORIA", "VALOR"];
    const rowsIn = state.cashIn.map(i => [i.date, "ENTRADA", i.reference, i.category, i.value]);
    const rowsOut = state.cashOut.map(o => [o.date, "SAIDA", o.reference, o.category, o.value]);
    const allRows = [...rowsIn, ...rowsOut].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const csvContent = [headers, ...allRows].map(e => e.join(";")).join("\n");
    downloadCSV("Relatorio_Financeiro", csvContent);
    notify("Fluxo de caixa exportado!");
  };

  const exportProduction = () => {
    const headers = ["DATA", "O.S.", "TIPO SERVICO", "QUANTIDADE", "VALOR UN", "VALOR TOTAL"];
    const rows: any[] = [];
    state.areas.forEach(area => {
      (area.services || []).forEach(s => {
        rows.push([s.serviceDate, area.name, s.type, s.areaM2, s.unitValue, s.totalValue]);
      });
    });
    const csvContent = [headers, ...rows].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(e => e.join(";")).join("\n");
    downloadCSV("Relatorio_Producao", csvContent);
    notify("Dados de produção exportados!");
  };

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const filteredEmployees = state.employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedEmployee = state.employees.find(e => e.id === selectedEmployeeId);
  
  const attendanceHistory = useMemo(() => {
    return state.attendanceRecords
      .filter(r => r.employeeId === selectedEmployeeId && isWithinRange(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.attendanceRecords, selectedEmployeeId, startDate, endDate]);

  const totalBaseValue = attendanceHistory.reduce((acc, r) => acc + r.value, 0);
  const totalDiscounts = attendanceHistory.reduce((acc, r) => acc + (r.discountValue || 0), 0);
  const totalToPay = totalBaseValue - totalDiscounts;

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      if (selectedEmployee?.paymentModality !== 'CLT' && totalToPay > 0) {
        setFinanceTitle(`ACERTO: ${selectedEmployee?.name} - ${formatDate(startDate)} a ${formatDate(endDate)}`);
        setFinanceCategory('Salários');
        setShowFinanceModal(true);
      }
    }, 1000);
  };

  const handleSaveValue = async (record: AttendanceRecord) => {
    const newVal = parseFloat(editingValue.replace(',', '.'));
    const newDiscount = parseFloat(editingDiscount.replace(',', '.'));
    
    setIsLoading(true);
    try {
      await dbSave('attendance_records', { 
        ...record, 
        value: isNaN(newVal) ? record.value : newVal,
        discountValue: isNaN(newDiscount) ? 0 : newDiscount,
        discountObservation: editingObservation
      });
      await refreshData();
      setEditingRecordId(null);
      notify("Alterações salvas!");
    } catch (e) { notify("Erro ao salvar", "error"); } finally { setIsLoading(false); }
  };

  const togglePaymentStatus = async (record: AttendanceRecord) => {
    setIsLoading(true);
    try {
      const newStatus = record.paymentStatus === 'pago' ? 'pendente' : 'pago';
      await dbSave('attendance_records', { ...record, paymentStatus: newStatus });
      await refreshData();
      notify(`Status alterado para ${newStatus.toUpperCase()}`);
    } catch (e) { notify("Erro ao alterar status", "error"); } finally { setIsLoading(false); }
  };

  const getStatusLabel = (status: AttendanceRecord['status']) => {
    switch(status) {
      case 'present': return 'PRESENÇA INTEGRAL';
      case 'partial': return 'HORÁRIO PARCIAL';
      case 'absent': return 'FALTA INJUSTIFICADA';
      case 'atestado': return 'ATESTADO MÉDICO';
      case 'justified': return 'FALTA JUSTIFICADA';
      case 'vacation': return 'FÉRIAS / FOLGA';
      default: return 'SEM REGISTRO';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Relatórios de Acerto</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Geração de Fichas Financeiras Individuais</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
          <span className="text-slate-300">|</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
        </div>
      </header>

      <section className="bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden print:hidden border border-white/5">
         <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-5 opacity-70">
              <Database size={16} className="text-blue-400"/> Central de Dados e Exportação (CSV)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
               <button onClick={exportInventory} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-blue-600 group">
                  <TableProperties size={18}/>
                  <div className="text-left"><span className="text-[10px] font-black uppercase block">Estoque</span><span className="text-[8px] font-bold opacity-40 uppercase">Exportar Materiais</span></div>
               </button>
               <button onClick={exportEmployees} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-emerald-600 group">
                  <Users size={18}/><div className="text-left"><span className="text-[10px] font-black uppercase block">Equipe</span><span className="text-[8px] font-bold opacity-40 uppercase">Lista Colaboradores</span></div>
               </button>
               <button onClick={exportFinance} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-orange-600 group">
                  <DollarSign size={18}/><div className="text-left"><span className="text-[10px] font-black uppercase block">Fluxo Caixa</span><span className="text-[8px] font-bold opacity-40 uppercase">Entradas e Saídas</span></div>
               </button>
               <button onClick={exportProduction} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-indigo-600 group">
                  <MapPin size={18}/><div className="text-left"><span className="text-[10px] font-black uppercase block">Produção</span><span className="text-[8px] font-bold opacity-40 uppercase">Metragens Campo</span></div>
               </button>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:hidden">
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm lg:col-span-1 h-[calc(100vh-320px)] flex flex-col transition-all">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
             <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input className="w-full bg-white border-2 border-slate-100 pl-14 pr-4 py-5 rounded-[24px] text-[12px] font-black uppercase outline-none focus:border-slate-900 focus:bg-white transition-all shadow-sm" placeholder="BUSCAR NOME..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
             {filteredEmployees.map(emp => (
               <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)} className={`w-full flex items-center p-7 rounded-[28px] text-left transition-all border-l-[6px] ${selectedEmployeeId === emp.id ? 'bg-slate-900 text-white shadow-2xl border-emerald-500 translate-x-1 scale-[1.02]' : 'hover:bg-slate-50 text-slate-600 border-transparent'}`}>
                  <div className="min-w-0">
                     <p className="text-sm font-black uppercase truncate tracking-tight flex items-center gap-2">{emp.paymentModality === 'CLT' && <Clock size={12} className="text-blue-500" />}{emp.name}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ${selectedEmployeeId === emp.id ? 'text-emerald-400' : 'text-slate-400'}`}>{emp.role} • {emp.paymentModality}</p>
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
                            <div><h4 className="text-xl font-black uppercase leading-tight tracking-tight">{selectedEmployee.name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEmployee.role} • {selectedEmployee.paymentModality}</p></div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="text-[10px] text-slate-400 font-bold uppercase"><Hash size={12}/> CPF: <span className="text-white ml-2">{selectedEmployee.cpf || '--'}</span></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase"><Smartphone size={12}/> CONTATO: <span className="text-white ml-2">{selectedEmployee.phone || '--'}</span></div>
                            {selectedEmployee.paymentModality === 'CLT' && (<div className="text-[10px] text-blue-400 font-black uppercase col-span-2 flex items-center gap-2"><Clock size={12}/> JORNADA: {selectedEmployee.workload} ({selectedEmployee.startTime} às {selectedEmployee.endTime})</div>)}
                         </div>
                      </div>
                      <div className="md:w-64 bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col justify-center text-center">
                         {selectedEmployee.paymentModality !== 'CLT' && (<><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Líquido</p><h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{formatMoney(totalToPay)}</h2></>)}
                         <button onClick={handlePrint} className="mt-4 w-full bg-white text-slate-900 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl active:scale-95"><Printer size={16} /> GERAR PDF / IMPRIMIR</button>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100 sticky top-0 z-10">
                         <tr>
                           <th className="px-8 py-4">Data</th>
                           <th className="px-8 py-4 text-center">Registro</th>
                           {selectedEmployee.paymentModality === 'CLT' ? (
                             <th className="px-8 py-4 text-center">Horários (Ent-Sai)</th>
                           ) : (
                             <><th className="px-8 py-4 text-right">Base</th><th className="px-8 py-4 text-right">Desc.</th></>
                           )}
                           <th className="px-8 py-4 text-left">Observação</th>
                           {selectedEmployee.paymentModality !== 'CLT' && (<th className="px-8 py-4 text-center">Pagamento</th>)}
                           <th className="px-8 py-4 text-right">Ação</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] font-black uppercase text-slate-700">
                         {attendanceHistory.map(h => {
                             const isEditing = editingRecordId === h.id;
                             return (
                               <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-3 text-slate-500">{formatDate(h.date)}</td>
                                  <td className="px-8 py-3 text-center">
                                     <span className={`px-3 py-1 rounded-lg text-[8px] font-black ${
                                         h.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                                         h.status === 'absent' ? 'bg-rose-50 text-rose-600' :
                                         h.status === 'atestado' ? 'bg-purple-50 text-purple-600' :
                                         'bg-sky-50 text-sky-600'
                                     }`}>
                                        {getStatusLabel(h.status).replace('PRESENÇA INTEGRAL', 'INTEGRAL').replace('HORÁRIO PARCIAL', 'PARCIAL')}
                                     </span>
                                  </td>
                                  {selectedEmployee.paymentModality === 'CLT' ? (
                                    <td className="px-8 py-3 text-center font-bold text-slate-400">{h.clockIn ? `${h.clockIn} - ${h.clockOut || '??'}` : '--'}</td>
                                  ) : (
                                    <><td className="px-8 py-3 text-right">{isEditing ? (<input className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-black text-right" value={editingValue} onChange={e => setEditingValue(e.target.value)} />) : (<span className="font-bold">{formatMoney(h.value)}</span>)}</td><td className="px-8 py-3 text-right text-rose-500">{isEditing ? (<input className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-black text-right" value={editingDiscount} onChange={e => setEditingDiscount(e.target.value)} />) : (`- ${formatMoney(h.discountValue || 0)}`)}</td></>
                                  )}
                                  <td className="px-8 py-3 text-left">{isEditing ? (<input className="w-full min-w-[150px] bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-black uppercase" placeholder="OBSERVAÇÃO..." value={editingObservation} onChange={e => setEditingObservation(e.target.value)} />) : (<span className="text-[9px] text-slate-400 italic lowercase">{h.discountObservation || '--'}</span>)}</td>
                                  {selectedEmployee.paymentModality !== 'CLT' && (<td className="px-8 py-3 text-center"><button onClick={() => togglePaymentStatus(h)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition-all ${h.paymentStatus === 'pago' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-600'}`}>{h.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE'}</button></td>)}
                                  <td className="px-8 py-3 text-right">{isEditing ? (<button onClick={() => handleSaveValue(h)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg"><Save size={14}/></button>) : (<button onClick={() => { setEditingRecordId(h.id); setEditingValue(String(h.value)); setEditingDiscount(String(h.discountValue || 0)); setEditingObservation(h.discountObservation || ''); }} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={12}/></button>)}</td>
                               </tr>
                             );
                           })
                         }
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center opacity-40"><FileText size={48} className="text-slate-300 mb-6" /><h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Relatório Individual</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Selecione um colaborador para gerar o acerto.</p></div>
           )}
        </div>
      </div>

      {showPrintView && selectedEmployee && (
        <div className="fixed inset-0 z-[1000] bg-white text-slate-900 font-sans print-view-container overflow-y-auto">
           <style>{`
             @media print { 
               body > *:not(.print-view-container) { display: none !important; }
               .print-view-container, .print-view-container * { visibility: visible !important; display: block !important; }
               .print-view-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: white !important; overflow: visible !important; }
               .sheet { margin: 0 !important; padding: 1.5cm !important; width: 210mm !important; box-shadow: none !important; display: block !important; }
               .no-print { display: none !important; }
               @page { margin: 1cm; size: A4 portrait; }
               ::-webkit-scrollbar { display: none !important; }
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
             }
             .sheet { background: white; margin: 2rem auto; padding: 1.5cm; width: 210mm; min-height: 297mm; box-shadow: 0 0 50px rgba(0,0,0,0.1); position: relative; }
           `}</style>
           
           <div className="sheet">
              <button onClick={() => setShowPrintView(false)} className="no-print absolute top-8 right-8 bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all z-[1100] flex items-center gap-2"><X size={18}/> FECHAR VISUALIZAÇÃO</button>
              <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-start"><div className="space-y-1"><h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">{state.company?.name || "FERA SERVICE"}</h1><div className="mt-4 text-[9px] font-bold text-slate-500 uppercase">{state.company?.cnpj && <p>CNPJ: {state.company.cnpj}</p>}<p className="max-w-[300px]">{state.company?.address}</p></div></div><div className="text-right uppercase"><div className="bg-slate-900 text-white px-4 py-2 mb-2 inline-block"><h2 className="text-sm font-black tracking-widest">Ficha de Acerto de Jornada</h2></div><p className="text-[10px] font-bold text-slate-600">Período de Referência</p><p className="text-sm font-black text-slate-900">{formatDate(startDate)} a {formatDate(endDate)}</p></div></div>
              <div className="grid grid-cols-12 gap-6 mb-8"><div className={`${selectedEmployee.paymentModality === 'CLT' ? 'col-span-12' : 'col-span-7'} bg-slate-50 p-6 rounded-3xl border border-slate-200`}><div className="mb-4"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Colaborador</p><p className="text-base font-black uppercase text-slate-900">{selectedEmployee.name}</p><p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Modalidade: {selectedEmployee.paymentModality}</p></div><div className="grid grid-cols-2 gap-y-3 gap-x-6"><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cargo</p><p className="text-[10px] font-bold text-slate-700">{selectedEmployee.role}</p></div><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento CPF</p><p className="text-[10px] font-bold text-slate-700">{selectedEmployee.cpf || '--'}</p></div>{selectedEmployee.paymentModality === 'CLT' && (<div className="col-span-2"><p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Carga Horária Contratada</p><p className="text-[10px] font-bold text-blue-700">{selectedEmployee.workload} ({selectedEmployee.startTime}h às {selectedEmployee.endTime}h)</p></div>)}</div></div>{selectedEmployee.paymentModality !== 'CLT' && (<div className="col-span-5 bg-white border-2 border-slate-900 p-6 rounded-3xl flex flex-col justify-center space-y-4"><div className="space-y-2 border-b-2 border-slate-100 pb-4"><div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>PROVENTOS BASE</span><span className="text-slate-900">{formatMoney(totalBaseValue)}</span></div><div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-500"><span>DESCONTOS (-)</span><span className="text-rose-600">{formatMoney(totalDiscounts)}</span></div></div><div className="text-center pt-2"><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">VALOR LÍQUIDO</p><h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatMoney(totalToPay)}</h2></div></div>)}</div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-900">Extrato de Registros Detalhados</h4>
              {selectedEmployee.paymentModality === 'CLT' ? (
                <table className="w-full text-[10px] border-collapse uppercase border border-slate-200"><thead><tr className="bg-slate-900 text-white"><th className="p-3 text-left border-r border-slate-800">Data</th><th className="p-3 text-center border-r border-slate-800">Freq.</th><th className="p-3 text-center border-r border-slate-800">Entrada</th><th className="p-3 text-center border-r border-slate-800">Intrajornada</th><th className="p-3 text-center border-r border-slate-800">Saída</th><th className="p-3 text-left">Observações / Justificativas</th></tr></thead><tbody className="divide-y divide-slate-200">{attendanceHistory.map(h => (<tr key={h.id}><td className="p-3 font-bold border-r text-slate-600">{formatDate(h.date)}</td><td className="p-3 text-center border-r">{h.status === 'present' ? 'INT' : h.status === 'atestado' ? 'AT' : 'OUT'}</td><td className="p-3 text-center border-r font-black">{h.clockIn || '--'}</td><td className="p-3 text-center border-r font-black">{h.breakStart ? `${h.breakStart} - ${h.breakEnd}` : '--'}</td><td className="p-3 text-center border-r font-black">{h.clockOut || '--'}</td><td className="p-3 text-left text-slate-400 italic lowercase">{h.status !== 'present' ? `${getStatusLabel(h.status)}: ` : ''}{h.discountObservation || '--'}</td></tr>))}</tbody></table>
              ) : (
                <table className="w-full text-[10px] border-collapse uppercase border border-slate-200"><thead><tr className="bg-slate-900 text-white"><th className="p-3 text-left border-r border-slate-800">Data</th><th className="p-3 text-center border-r border-slate-800">Freq.</th><th className="p-3 text-right border-r border-slate-800">Valor Base</th><th className="p-3 text-right border-r border-slate-800">Desconto</th><th className="p-3 text-left border-r border-slate-800">Observações</th><th className="p-3 text-right">Líquido</th></tr></thead><tbody className="divide-y divide-slate-200">{attendanceHistory.map(h => (<tr key={h.id}><td className="p-3 font-bold border-r text-slate-600">{formatDate(h.date)}</td><td className="p-3 text-center border-r">{h.status === 'present' ? 'INT' : h.status === 'partial' ? 'PRC' : 'FLT'}</td><td className="p-3 text-right border-r font-bold">{formatMoney(h.value)}</td><td className="p-3 text-right border-r text-rose-600 font-bold">{h.discountValue ? formatMoney(h.discountValue) : '--'}</td><td className="p-3 text-left border-r text-slate-400 italic lowercase">{h.discountObservation || '--'}</td><td className="p-3 text-right font-black text-slate-900">{formatMoney(h.value - (h.discountValue || 0))}</td></tr>))}{selectedEmployee.paymentModality !== 'CLT' && (<tr className="bg-slate-50 font-black"><td colSpan={5} className="p-4 text-right uppercase border-r">Total Líquido a Pagar:</td><td className="p-4 text-right text-xs bg-white">{formatMoney(totalToPay)}</td></tr>)}</tbody></table>
              )}
              <div className="mt-20 pt-12 grid grid-cols-2 gap-24 text-center"><div className="space-y-2"><div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase text-slate-900">{selectedEmployee.name}</div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura do Colaborador</p></div><div className="space-y-2"><div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase text-slate-900">Administração Operacional</div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura Responsável</p></div></div>
           </div>
        </div>
      )}

      {showFinanceModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4"><div className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl animate-in zoom-in-95"><div className="text-center space-y-2"><div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div><h3 className="text-sm font-black uppercase text-slate-900">Gerar Saída Financeira?</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deseja registrar este acerto como uma saída no caixa?</p></div><div className="space-y-4"><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase ml-1 block">Título do Lançamento</label><input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={financeTitle} onChange={e => setFinanceTitle(e.target.value)} /></div><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase ml-1 block">Categoria Financeira</label><select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={financeCategory} onChange={e => setFinanceCategory(e.target.value)}>{state.financeCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></div><div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center"><p className="text-xl font-black text-emerald-600">{formatMoney(totalToPay)}</p><p className="text-[8px] font-black text-emerald-400 uppercase mt-1">Valor Total do Período</p></div><button onClick={handleCreateFinanceExit} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-600 transition-all">{isLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CONFIRMAR E QUITAR'}</button><button onClick={() => setShowFinanceModal(false)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">APENAS FECHAR</button></div></div></div>
      )}
    </div>
  );
};

export default Analytics;
