
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, AttendanceRecord } from '../types';
import { 
  Printer, Search, Calendar, FileText, X, Phone, User, Hash, Smartphone, Database, TableProperties,
  Users, DollarSign, Edit2, Save, Loader2, Landmark, Info, Globe, MapPin, CreditCard
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
    const originalTitle = document.title;
    document.title = ""; 
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      if (totalToPay > 0) {
        setFinanceTitle(`ACERTO: ${selectedEmployee?.name} - ${formatDate(startDate)} a ${formatDate(endDate)}`);
        setFinanceCategory('Salários');
        setShowFinanceModal(true);
      }
    }, 500);
  };

  const handleSaveValue = async (record: AttendanceRecord) => {
    const newVal = parseFloat(editingValue.replace(',', '.'));
    const newDiscount = parseFloat(editingDiscount.replace(',', '.'));
    if (isNaN(newVal)) return notify("Valor base inválido", "error");
    
    setIsLoading(true);
    try {
      await dbSave('attendance_records', { 
        ...record, 
        value: newVal,
        discountValue: isNaN(newDiscount) ? 0 : newDiscount,
        discountObservation: editingObservation
      });
      await refreshData();
      setEditingRecordId(null);
      notify("Alterações salvas!");
    } catch (e) {
      notify("Erro ao salvar alterações", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePaymentStatus = async (record: AttendanceRecord) => {
    setIsLoading(true);
    try {
      const newStatus = record.paymentStatus === 'pago' ? 'pendente' : 'pago';
      await dbSave('attendance_records', { ...record, paymentStatus: newStatus });
      await refreshData();
      notify(`Status alterado para ${newStatus.toUpperCase()}`);
    } catch (e) {
      notify("Erro ao alterar status de pagamento", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFinanceExit = async () => {
    if (!financeTitle || !financeCategory) return notify("Preencha o título e a categoria", "error");
    
    setIsLoading(true);
    try {
      await dbSave('cash_flow', {
        companyId: state.currentUser?.companyId,
        type: 'out',
        value: totalToPay,
        date: new Date().toISOString().split('T')[0],
        reference: financeTitle.toUpperCase(),
        category: financeCategory
      });
      
      for (const record of attendanceHistory) {
        if (record.paymentStatus !== 'pago') {
          await dbSave('attendance_records', { ...record, paymentStatus: 'pago' });
        }
      }

      await refreshData();
      setShowFinanceModal(false);
      setShowPrintView(false);
      notify("Saída financeira registrada e frequências quitadas!");
    } catch (e) {
      notify("Erro ao gerar saída financeira", "error");
    } finally {
      setIsLoading(false);
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
              <Database size={16} className="text-blue-400"/> Central de Dados e Exportação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
               <button onClick={() => notify("Função em desenvolvimento")} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-blue-600 group">
                  <TableProperties size={18}/><span className="text-[10px] font-black uppercase">Estoque</span>
               </button>
               <button onClick={() => notify("Função em desenvolvimento")} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-emerald-600 group">
                  <Users size={18}/><span className="text-[10px] font-black uppercase">Equipe</span>
               </button>
               <button onClick={() => notify("Função em desenvolvimento")} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-orange-600 group">
                  <DollarSign size={18}/><span className="text-[10px] font-black uppercase">Fluxo Caixa</span>
               </button>
               <button onClick={() => notify("Função em desenvolvimento")} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-indigo-600 group">
                  <MapPin size={18}/><span className="text-[10px] font-black uppercase">Produção</span>
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
               <button 
                 key={emp.id}
                 onClick={() => setSelectedEmployeeId(emp.id)}
                 className={`w-full flex items-center p-7 rounded-[28px] text-left transition-all border-l-[6px] ${
                   selectedEmployeeId === emp.id 
                     ? 'bg-slate-900 text-white shadow-2xl border-emerald-500 translate-x-1 scale-[1.02]' 
                     : 'hover:bg-slate-50 text-slate-600 border-transparent'
                 }`}
               >
                  <div className="min-w-0">
                     <p className="text-sm font-black uppercase truncate tracking-tight">{emp.name}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ${selectedEmployeeId === emp.id ? 'text-emerald-400' : 'text-slate-400'}`}>{emp.role}</p>
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
                         <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <div className="text-[10px] text-slate-400 font-bold uppercase"><Hash size={12}/> CPF: <span className="text-white ml-2">{selectedEmployee.cpf || '--'}</span></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase"><Smartphone size={12}/> CONTATO: <span className="text-white ml-2">{selectedEmployee.phone || '--'}</span></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase col-span-2"><CreditCard size={12}/> PIX: <span className="text-white ml-2 truncate">{selectedEmployee.pixKey || '--'}</span></div>
                         </div>
                      </div>
                      <div className="md:w-64 bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col justify-center text-center">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Líquido</p>
                         <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{formatMoney(totalToPay)}</h2>
                         <button onClick={handlePrint} className="mt-4 w-full bg-white text-slate-900 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl active:scale-95">
                            <Printer size={16} /> GERAR PDF / IMPRIMIR
                         </button>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100 sticky top-0 z-10">
                         <tr>
                           <th className="px-8 py-4">Data</th>
                           <th className="px-8 py-4 text-center">Freq.</th>
                           <th className="px-8 py-4 text-right">Valor Diária</th>
                           <th className="px-8 py-4 text-right">Desconto</th>
                           <th className="px-8 py-4 text-center">Status</th>
                           <th className="px-8 py-4 text-right">Ação</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] font-black uppercase text-slate-700">
                         {attendanceHistory.map(h => {
                             const isEditing = editingRecordId === h.id;
                             const isPaid = h.paymentStatus === 'pago';
                             return (
                               <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-3 text-slate-500">{formatDate(h.date)}</td>
                                  <td className="px-8 py-3 text-center">
                                     <span className={`px-4 py-1 rounded-lg text-[9px] font-black ${
                                         h.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                                         h.status === 'partial' ? 'bg-amber-50 text-amber-600' : 
                                         'bg-rose-50 text-rose-600'
                                     }`}>
                                        {h.status === 'present' ? 'P' : h.status === 'partial' ? 'H' : 'F'}
                                     </span>
                                  </td>
                                  <td className="px-8 py-3 text-right">
                                     {isEditing ? (
                                       <input className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-black text-right" value={editingValue} onChange={e => setEditingValue(e.target.value)} />
                                     ) : (
                                       <span className="font-bold">{formatMoney(h.value)}</span>
                                     )}
                                  </td>
                                  <td className="px-8 py-3 text-right">
                                     {isEditing ? (
                                       <div className="flex flex-col gap-1 items-end">
                                         <input className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-[10px] font-black text-right" placeholder="DESC." value={editingDiscount} onChange={e => setEditingDiscount(e.target.value)} />
                                         <input className="w-40 bg-white border border-slate-200 p-2 rounded-lg text-[8px] font-black" placeholder="MOTIVO" value={editingObservation} onChange={e => setEditingObservation(e.target.value)} />
                                       </div>
                                     ) : (
                                       <div className="flex flex-col items-end">
                                          <span className={`${(h.discountValue || 0) > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                            - {formatMoney(h.discountValue || 0)}
                                          </span>
                                       </div>
                                     )}
                                  </td>
                                  <td className="px-8 py-3 text-center">
                                     <button onClick={() => togglePaymentStatus(h)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition-all ${isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                                        {isPaid ? 'PAGO' : 'PENDENTE'}
                                     </button>
                                  </td>
                                  <td className="px-8 py-3 text-right">
                                     {isEditing ? (
                                         <div className="flex items-center justify-end gap-2">
                                             <button onClick={() => handleSaveValue(h)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg"><Save size={14}/></button>
                                             <button onClick={() => setEditingRecordId(null)} className="p-1.5 text-slate-400 bg-slate-50 rounded-lg"><X size={14}/></button>
                                         </div>
                                     ) : (
                                         <button onClick={() => { setEditingRecordId(h.id); setEditingValue(String(h.value)); setEditingDiscount(String(h.discountValue || 0)); setEditingObservation(h.discountObservation || ''); }} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors">
                                             <Edit2 size={12}/>
                                         </button>
                                     )}
                                  </td>
                               </tr>
                             );
                           })
                         }
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center opacity-40">
                <FileText size={48} className="text-slate-300 mb-6" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Relatório Individual</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Selecione um colaborador para gerar o acerto.</p>
             </div>
           )}
        </div>
      </div>

      {showFinanceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-10 space-y-6 shadow-2xl border-4 border-slate-900 animate-in zoom-in-95 border border-slate-100">
             <div className="text-center space-y-3">
                <Landmark size={32} className="mx-auto text-emerald-600" />
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest text-center">REGISTRAR SAÍDA FINANCEIRA</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase text-center">Valor Líquido</p>
                   <p className="text-2xl font-black text-rose-600 tracking-tighter text-center">{formatMoney(totalToPay)}</p>
                </div>
             </div>
             <div className="space-y-4">
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-slate-900" placeholder="TÍTULO / REFERÊNCIA" value={financeTitle} onChange={e => setFinanceTitle(e.target.value)} />
                <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={financeCategory} onChange={e => setFinanceCategory(e.target.value)}>
                   <option value="">CATEGORIA...</option>
                   {state.financeCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-3">
                <button onClick={handleCreateFinanceExit} disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                   {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} CONFIRMAR E QUITAR
                </button>
                <button onClick={() => { setShowFinanceModal(false); setShowPrintView(false); }} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">FECHAR</button>
             </div>
          </div>
        </div>
      )}

      {showPrintView && (
        <div className="fixed inset-0 z-[1000] bg-white text-slate-900 font-sans print-view-container overflow-y-auto">
           <style>{`
             @media screen {
                .print-view-container { 
                  padding: 40px 0; 
                  background-color: #f1f5f9;
                }
                .sheet {
                   background: white;
                   box-shadow: 0 0 40px rgba(0,0,0,0.1);
                   margin: 0 auto;
                   padding: 1.5cm;
                   width: 210mm;
                   min-height: 297mm;
                }
             }
             @media print { 
               body > #root { visibility: hidden; height: 0; overflow: hidden; }
               .print-view-container, .print-view-container * { visibility: visible !important; }
               .print-view-container { 
                 position: absolute !important; 
                 left: 0 !important; 
                 top: 0 !important; 
                 width: 100% !important; 
                 height: auto !important;
                 overflow: visible !important;
                 z-index: 9999 !important;
                 background: white !important;
               }
               @page { 
                 margin: 1cm; 
                 size: A4; 
                 counter-increment: page;
               }
               .sheet { 
                 width: 100% !important; 
                 margin: 0 !important; 
                 padding: 0 !important; 
                 box-shadow: none !important; 
                 height: auto !important;
                 overflow: visible !important;
                 border: none !important;
               }
               .page-number:after { content: counter(page); }
             }
             .print-table { width: 100%; border-collapse: collapse; border: none; }
             .print-header { display: table-header-group; }
             .print-footer { display: table-footer-group; }
             .print-body { display: table-row-group; }
             body { counter-reset: page; }
             .page-break-avoid { page-break-inside: avoid; }
           `}</style>
           
           <div className="sheet">
              <table className="print-table">
                <thead className="print-header">
                  <tr>
                    <td>
                      <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-start">
                         <div className="space-y-1">
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-slate-900">
                               {state.company?.name || "UNIDADE DE OPERAÇÃO"}
                            </h1>
                            <div className="mt-4 text-[9px] font-bold text-slate-500 uppercase space-y-1">
                               {state.company?.cnpj && <p>CNPJ: {state.company.cnpj}</p>}
                               {state.company?.address && <p className="max-w-[300px] leading-tight">{state.company.address}</p>}
                               <div className="flex items-center gap-3">
                                  {state.company?.phone && <span>{state.company.phone}</span>}
                                  {state.company?.website && <span>{state.company.website}</span>}
                               </div>
                            </div>
                         </div>
                         <div className="text-right uppercase">
                            <div className="bg-slate-900 text-white px-4 py-2 mb-2 inline-block">
                               <h2 className="text-sm font-black tracking-widest">Ficha de Acerto Individual</h2>
                            </div>
                            <p className="text-[10px] font-bold text-slate-600">Referência do Período</p>
                            <p className="text-sm font-black text-slate-900">{formatDate(startDate)} a {formatDate(endDate)}</p>
                         </div>
                      </div>
                    </td>
                  </tr>
                </thead>

                <tbody className="print-body">
                  <tr>
                    <td>
                      <div className="grid grid-cols-12 gap-6 mb-8">
                         <div className="col-span-7 bg-slate-50 p-6 rounded-3xl border border-slate-200" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="mb-4">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Colaborador beneficiário</p>
                               <p className="text-base font-black uppercase text-slate-900">{selectedEmployee?.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cargo / Função</p>
                                   <p className="text-[10px] font-bold uppercase text-slate-700">{selectedEmployee?.role}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento CPF</p>
                                   <p className="text-[10px] font-bold text-slate-700">{selectedEmployee?.cpf || 'Não informado'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Chave PIX</p>
                                   <p className="text-[10px] font-bold text-blue-600 uppercase">{selectedEmployee?.pixKey || 'Não informada'}</p>
                                </div>
                            </div>
                         </div>

                         <div className="col-span-5 bg-white border-2 border-slate-900 p-6 rounded-3xl flex flex-col justify-center space-y-4" style={{ border: '2px solid #0f172a' }}>
                            <div className="space-y-2 border-b-2 border-slate-100 pb-4">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                  <span className="text-slate-500">VALOR BRUTO (BASE)</span>
                                  <span className="text-slate-900">{formatMoney(totalBaseValue)}</span>
                               </div>
                               <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                  <span className="text-rose-500">TOTAL DESCONTOS (-)</span>
                                  <span className="text-rose-600">{formatMoney(totalDiscounts)}</span>
                               </div>
                            </div>
                            <div className="text-center pt-2">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">VALOR LÍQUIDO A RECEBER</p>
                               <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatMoney(totalToPay)}</h2>
                            </div>
                         </div>
                      </div>

                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-900 flex items-center gap-2">
                         EXTRATO DETALHADO DE SERVIÇOS E FREQUÊNCIA
                      </h4>
                      <table className="w-full text-[10px] border-collapse uppercase table-fixed border border-slate-200">
                         <thead>
                            <tr style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
                              <th className="p-3 text-left border-r border-b border-slate-200 w-24">Data</th>
                              <th className="p-3 text-center border-r border-b border-slate-200 w-20">Status</th>
                              <th className="p-3 text-right border-r border-b border-slate-200 w-28">V. Diária</th>
                              <th className="p-3 text-right border-r border-b border-slate-200 w-28">Desc.</th>
                              <th className="p-3 text-left border-r border-b border-slate-200">Obs.</th>
                              <th className="p-3 text-right border-b border-slate-200">Líquido</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200">
                            {attendanceHistory.map(h => (
                               <tr key={h.id}>
                                  <td className="p-3 font-bold border-r border-slate-200 text-slate-600">{formatDate(h.date)}</td>
                                  <td className="p-3 text-center font-black border-r border-slate-200 text-slate-900">
                                     {h.status === 'present' ? 'INTEGRAL' : h.status === 'partial' ? 'MEIA' : 'FALTA'}
                                  </td>
                                  <td className="p-3 text-right border-r border-slate-200 text-slate-600">{formatMoney(h.value)}</td>
                                  <td className="p-3 text-right text-rose-500 border-r border-slate-200">{h.discountValue ? formatMoney(h.discountValue) : '-'}</td>
                                  <td className="p-3 text-[8px] italic border-r border-slate-200 leading-tight text-slate-500">{h.discountObservation || '-'}</td>
                                  <td className="p-3 text-right font-black text-slate-900">{formatMoney(h.value - (h.discountValue || 0))}</td>
                               </tr>
                            ))}
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                               <td colSpan={5} className="p-4 text-right font-black text-xs uppercase border-r border-slate-200">Soma Total Líquida:</td>
                               <td className="p-4 text-right font-black text-xs">{formatMoney(totalToPay)}</td>
                            </tr>
                         </tbody>
                      </table>

                      <div className="mt-8 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3 page-break-avoid" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                         <div className="mt-1 flex gap-3">
                            <Info size={16} className="text-slate-400 shrink-0" />
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                                Este documento serve como extrato informativo para conferência de diárias e lançamentos do período especificado. 
                                O pagamento é efetivado via PIX conforme dados informados acima.
                            </p>
                         </div>
                      </div>

                      <div className="mt-16 pt-12 grid grid-cols-2 gap-24 text-center page-break-avoid">
                         <div className="space-y-2">
                            <div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase text-slate-900" style={{ borderTop: '2px solid #0f172a' }}>{selectedEmployee?.name}</div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura do Colaborador</p>
                         </div>
                         <div className="space-y-2">
                            <div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase text-slate-900" style={{ borderTop: '2px solid #0f172a' }}>Administração Operacional</div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura Responsável</p>
                         </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
