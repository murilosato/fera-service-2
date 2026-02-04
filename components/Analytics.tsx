
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, AttendanceRecord } from '../types';
import { 
  Printer, Fingerprint, CreditCard, CheckCircle2, Search, Calendar, FileText, X, Phone, MapPin, User, Hash, Download, Smartphone, Database, ArrowRight, TableProperties,
  Users, DollarSign, Edit2, Save, Loader2
} from 'lucide-react';
import { dbSave, fetchCompleteCompanyData } from '../lib/supabase';

interface AnalyticsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Analytics: React.FC<AnalyticsProps> = ({ state, setState }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const totalToPay = attendanceHistory
    .reduce((acc, r) => acc + r.value, 0);

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 500);
  };

  const handleSaveValue = async (record: AttendanceRecord) => {
    const newVal = parseFloat(editingValue.replace(',', '.'));
    if (isNaN(newVal)) return;
    
    setIsLoading(true);
    try {
      await dbSave('attendance_records', { ...record, value: newVal });
      await refreshData();
      setEditingRecordId(null);
    } catch (e) {
      alert("Erro ao salvar valor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Exportação CSV
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return alert("Não há dados para exportar neste período.");
    
    const headers = Object.keys(data[0]).join(';');
    const rows = data.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(';')
    ).join('\n');
    
    const csvContent = "\uFEFF" + headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${startDate}_a_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryExits = () => {
    const filtered = state.inventoryExits.filter(ex => isWithinRange(ex.date));
    const data = filtered.map(ex => {
      const item = state.inventory.find(i => i.id === ex.itemId);
      return {
        Data: formatDate(ex.date),
        Item: item?.name || 'N/A',
        Categoria: item?.category || 'N/A',
        Quantidade: ex.quantity,
        Destino: ex.destination,
        Observação: ex.observation
      };
    });
    downloadCSV(data, 'Movimentacoes_Estoque');
  };

  const exportEmployees = () => {
    const data = state.employees.map(e => ({
      Nome: e.name,
      CPF: e.cpf || '---',
      Cargo: e.role,
      Status: e.status === 'active' ? 'ATIVO' : 'INATIVO',
      Telefone: e.phone || '---',
      ValorDiaria: e.defaultValue,
      PIX: e.pixKey || '---'
    }));
    downloadCSV(data, 'Quadro_Funcionarios');
  };

  const exportCashFlow = () => {
    const inc = state.cashIn.filter(c => isWithinRange(c.date)).map(c => ({ Data: formatDate(c.date), Tipo: 'ENTRADA', Categoria: c.category, Referencia: c.reference, Valor: c.value }));
    const out = state.cashOut.filter(c => isWithinRange(c.date)).map(c => ({ Data: formatDate(c.date), Tipo: 'SAIDA', Categoria: c.category, Referencia: c.reference, Valor: c.value }));
    downloadCSV([...inc, ...out], 'Fluxo_de_Caixa');
  };

  const exportProduction = () => {
    const data: any[] = [];
    state.areas.forEach(area => {
      (area.services || []).forEach(s => {
        if (isWithinRange(s.serviceDate)) {
          data.push({
            OS: area.name,
            DataServico: formatDate(s.serviceDate),
            Tipo: s.type,
            Producao: s.areaM2,
            Referencia: `${area.startReference} a ${area.endReference}`,
            StatusOS: area.status === 'finished' ? 'FINALIZADA' : 'EM EXECUÇÃO'
          });
        }
      });
    });
    downloadCSV(data, 'Relatorio_Producao');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Relatórios & Auditoria</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Geração de Fichas e Central de Exportação</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
          <span className="text-slate-300">|</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent outline-none" />
        </div>
      </header>

      {/* Central de Exportação em CSV */}
      <section className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden print:hidden">
         <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 mb-8"><Database size={20} className="text-blue-400"/> Central de Exportação Estratégica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Movimentações Estoque', icon: TableProperties, action: exportInventoryExits, color: 'hover:bg-blue-600' },
                 { label: 'Quadro Funcionários', icon: Users, action: exportEmployees, color: 'hover:bg-emerald-600' },
                 { label: 'Fluxo de Caixa', icon: DollarSign, action: exportCashFlow, color: 'hover:bg-orange-600' },
                 { label: 'Produção Campo', icon: MapPin, action: exportProduction, color: 'hover:bg-indigo-600' }
               ].map(item => (
                 <button key={item.label} onClick={item.action} className={`bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-4 transition-all hover:scale-105 group ${item.color}`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all"><item.icon size={24}/></div>
                    <div className="text-center">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Extrair Relatório</p>
                       <p className="text-[11px] font-black uppercase tracking-tighter">{item.label}</p>
                    </div>
                    <Download size={14} className="mt-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                 </button>
               ))}
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:hidden">
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm lg:col-span-1 h-[calc(100vh-450px)] flex flex-col">
          <div className="p-4 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none" placeholder="BUSCAR NOME..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
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
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Hash size={12}/> CPF: <span className="text-white">{selectedEmployee.cpf || '--'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Smartphone size={12}/> CONTATO: <span className="text-white">{selectedEmployee.phone || '--'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><CreditCard size={12}/> PIX: <span className="text-white truncate max-w-[150px]">{selectedEmployee.pixKey || '--'}</span></div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><MapPin size={12}/> ENDEREÇO: <span className="text-white truncate max-w-[150px]">{selectedEmployee.address || '--'}</span></div>
                         </div>
                      </div>
                      <div className="md:w-64 bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col justify-center text-center">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total a Pagar no Período</p>
                         <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{formatMoney(totalToPay)}</h2>
                         <button onClick={handlePrint} className="mt-4 w-full bg-white text-slate-900 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl active:scale-95">
                            <Printer size={16} /> GERAR PDF / IMPRIMIR
                         </button>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 font-black border-b border-slate-100">
                         <tr><th className="px-8 py-4">Data Registro</th><th className="px-8 py-4 text-center">Frequência</th><th className="px-8 py-4 text-right">Valor Diária (Editar)</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] font-black uppercase text-slate-700">
                         {attendanceHistory.length === 0 ? (
                           <tr><td colSpan={3} className="px-8 py-10 text-center italic text-slate-300">Nenhum registro no período selecionado</td></tr>
                         ) : (
                           attendanceHistory.map(h => {
                             const isEditing = editingRecordId === h.id;
                             return (
                               <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-3 text-slate-500">{formatDate(h.date)}</td>
                                  <td className="px-8 py-3 text-center">
                                     <span className={`px-4 py-1 rounded-lg text-[9px] font-black ${
                                         h.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                                         h.status === 'partial' ? 'bg-amber-50 text-amber-600' : 
                                         'bg-rose-50 text-rose-600'
                                     }`}>
                                        {h.status === 'present' ? 'P (INTEGRAL)' : h.status === 'partial' ? 'H (PARCIAL)' : 'F (FALTA)'}
                                     </span>
                                  </td>
                                  <td className="px-8 py-3 text-right">
                                     {isEditing ? (
                                         <div className="flex items-center justify-end gap-2">
                                             <input 
                                                 type="number" 
                                                 className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-lg text-[10px] font-black outline-none" 
                                                 value={editingValue} 
                                                 onChange={e => setEditingValue(e.target.value)}
                                             />
                                             <button onClick={() => handleSaveValue(h)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg"><Save size={14}/></button>
                                             <button onClick={() => setEditingRecordId(null)} className="p-1.5 text-slate-400 bg-slate-50 rounded-lg"><X size={14}/></button>
                                         </div>
                                     ) : (
                                         <div className="flex items-center justify-end gap-3 group">
                                             <span className="font-bold text-slate-900">{formatMoney(h.value)}</span>
                                             <button 
                                                 onClick={() => { setEditingRecordId(h.id); setEditingValue(String(h.value)); }} 
                                                 className="p-1.5 text-slate-300 group-hover:text-blue-500 transition-colors"
                                             >
                                                 <Edit2 size={12}/>
                                             </button>
                                         </div>
                                     )}
                                  </td>
                               </tr>
                             );
                           })
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center opacity-40">
                <FileText size={48} className="text-slate-300 mb-6" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Auditoria Individual</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Selecione um colaborador na lista lateral para gerar a ficha de acerto.</p>
             </div>
           )}
        </div>
      </div>

      {showPrintView && (
        <div className="fixed inset-0 z-[1000] bg-white overflow-y-auto p-12 text-slate-900 font-sans print:p-0 print:m-0">
           <style>{`@media print { .print-hide { display: none; } body { background: white; } }`}</style>
           <div className="max-w-4xl mx-auto border-2 border-slate-900 p-12 relative print:border-none print:p-8">
              <div className="border-b-4 border-slate-900 pb-8 mb-12 flex justify-between items-end">
                 <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">Fera Service</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Inteligência em Gestão Urbana</p>
                 </div>
                 <div className="text-right uppercase space-y-1">
                    <h2 className="text-xl font-black text-slate-900">Relatório de Acerto Individual</h2>
                    <p className="text-[10px] font-bold text-slate-500">Período: {formatDate(startDate)} a {formatDate(endDate)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-16 mb-12 text-[11px] uppercase border border-slate-100 p-8 rounded-3xl">
                 <div className="space-y-3">
                    <p className="flex justify-between border-b pb-1"><span className="font-black text-slate-400">COLABORADOR:</span> <span className="font-black">{selectedEmployee?.name}</span></p>
                    <p className="flex justify-between border-b pb-1"><span className="font-black text-slate-400">CARGO/FUNÇÃO:</span> <span className="font-black">{selectedEmployee?.role}</span></p>
                    <p className="flex justify-between border-b pb-1"><span className="font-black text-slate-400">DOCUMENTO CPF:</span> <span className="font-black">{selectedEmployee?.cpf || '--'}</span></p>
                    <p className="flex justify-between border-b pb-1"><span className="font-black text-slate-400">ENDEREÇO:</span> <span className="font-black truncate max-w-[180px]">{selectedEmployee?.address || '--'}</span></p>
                 </div>
                 <div className="space-y-3 text-right">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl">
                       <p className="text-[9px] font-black opacity-60 mb-1">VALOR LÍQUIDO A RECEBER</p>
                       <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{formatMoney(totalToPay)}</h2>
                    </div>
                    <p className="text-[10px] font-black border-b border-slate-100 pb-1 mt-4">CHAVE PIX: {selectedEmployee?.pixKey || 'NÃO INFORMADA'}</p>
                 </div>
              </div>

              <div className="mb-16">
                 <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-400">Extrato de Presença e Diárias</h4>
                 <table className="w-full text-[10px] border-collapse uppercase">
                    <thead>
                       <tr className="bg-slate-100"><th className="border-b-2 border-slate-900 p-3 text-left">Data do Turno</th><th className="border-b-2 border-slate-900 p-3 text-center">Status</th><th className="border-b-2 border-slate-900 p-3 text-right">Valor (R$)</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {attendanceHistory.map(h => (
                          <tr key={h.id}>
                             <td className="p-3 font-bold">{formatDate(h.date)}</td>
                             <td className="p-3 text-center font-black">
                                {h.status === 'present' ? 'TRABALHADO' : h.status === 'partial' ? 'PARCIAL' : 'AUSENTE/FALTA'}
                             </td>
                             <td className="p-3 text-right font-black">{formatMoney(h.value)}</td>
                          </tr>
                       ))}
                       <tr className="bg-slate-50">
                          <td colSpan={2} className="p-4 text-right font-black text-xs">SOMA TOTAL DOS SERVIÇOS:</td>
                          <td className="p-4 text-right font-black text-xs">{formatMoney(totalToPay)}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              <div className="mt-24 grid grid-cols-2 gap-24 text-center">
                 <div className="space-y-4">
                    <div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase">{selectedEmployee?.name}</div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura do Colaborador</p>
                 </div>
                 <div className="space-y-4">
                    <div className="border-t-2 border-slate-900 pt-3 text-[10px] font-black uppercase">Fera Service Corporativo</div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assinatura Responsável</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
