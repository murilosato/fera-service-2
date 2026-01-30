
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { 
  Users, 
  UserPlus, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  X, 
  CalendarCheck, 
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Edit2,
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileSpreadsheet,
  Phone,
  MapPin,
  Fingerprint,
  Wallet,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface EmployeesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Employees: React.FC<EmployeesProps> = ({ state, setState }) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const initialFormState = {
    name: '',
    role: '',
    rate: '80',
    cpf: '',
    birthDate: '',
    address: '',
    phone: '',
    paymentType: 'pix' as 'pix' | 'bank',
    pixKey: '',
    bankAccount: ''
  };

  const [employeeForm, setEmployeeForm] = useState(initialFormState);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentCalendarDate]);

  const currentMonthStr = currentCalendarDate.toISOString().substring(0, 7);
  
  const monthlyAttendanceSummary = useMemo(() => {
    const records = (state.attendanceRecords || []).filter(r => 
      r.date.startsWith(currentMonthStr) && r.status === 'present'
    );
    return {
      totalValue: records.reduce((acc, r) => acc + r.value, 0),
      totalAttendances: records.length,
      // Fix: paymentStatus uses 'pago' and 'pendente'
      totalPaid: records.filter(r => r.paymentStatus === 'pago').reduce((acc, r) => acc + r.value, 0),
      totalPending: records.filter(r => r.paymentStatus !== 'pago').reduce((acc, r) => acc + r.value, 0)
    };
  }, [state.attendanceRecords, currentMonthStr]);

  const getEmployeeStats = (employeeId: string, monthStr: string) => {
    const records = (state.attendanceRecords || []).filter(r => 
      r.employeeId === employeeId && r.date.startsWith(monthStr)
    );
    const presentDays = records.filter(r => r.status === 'present').length;
    const totalValue = records.reduce((acc, r) => acc + (r.status === 'present' ? r.value : 0), 0);
    // Fix: paymentStatus uses 'pago' and 'pendente'
    const totalPending = records.filter(r => r.status === 'present' && r.paymentStatus !== 'pago').reduce((acc, r) => acc + r.value, 0);
    return { presentDays, totalValue, totalPending, totalRecords: records.length };
  };

  const handleToggleAttendance = (empId: string, date: string) => {
    const records = state.attendanceRecords || [];
    const existingIdx = records.findIndex(r => r.employeeId === empId && r.date === date);
    const employee = state.employees.find(e => e.id === empId);

    if (existingIdx > -1) {
      const record = records[existingIdx];
      const nextStatus = record.status === 'present' ? 'absent' : 'present';
      
      setState(prev => {
        const updated = [...(prev.attendanceRecords || [])];
        updated[existingIdx] = { 
          ...record, 
          status: nextStatus, 
          value: nextStatus === 'present' ? (employee?.defaultDailyRate || 80) : 0,
          // Fix: paymentStatus uses 'pago' and 'pendente'
          paymentStatus: nextStatus === 'present' ? 'pendente' : undefined
        };
        return { ...prev, attendanceRecords: updated };
      });
    } else {
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: state.currentUser?.companyId || 'default-company',
        employeeId: empId,
        date: date,
        status: 'present',
        value: employee?.defaultDailyRate || 80,
        // Fix: paymentStatus uses 'pago' and 'pendente'
        paymentStatus: 'pendente'
      };
      setState(prev => ({ ...prev, attendanceRecords: [...(prev.attendanceRecords || []), newRecord] }));
    }
  };

  const togglePaymentStatus = (recordId: string) => {
    setState(prev => ({
      ...prev,
      attendanceRecords: (prev.attendanceRecords || []).map(r => 
        // Fix: paymentStatus uses 'pago' and 'pendente'
        r.id === recordId ? { ...r, paymentStatus: r.paymentStatus === 'pago' ? 'pendente' : 'pago' } : r
      )
    }));
  };

  const updateDailyRateValue = (empId: string, date: string, value: number) => {
    setState(prev => ({
      ...prev,
      attendanceRecords: (prev.attendanceRecords || []).map(r => 
        (r.employeeId === empId && r.date === date) ? { ...r, value } : r
      )
    }));
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name || !employeeForm.role) return;

    if (editingEmployeeId) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => emp.id === editingEmployeeId ? {
          ...emp,
          name: employeeForm.name,
          role: employeeForm.role,
          defaultDailyRate: parseFloat(employeeForm.rate) || 80,
          cpf: employeeForm.cpf,
          birthDate: employeeForm.birthDate,
          address: employeeForm.address,
          phone: employeeForm.phone,
          paymentType: employeeForm.paymentType,
          pixKey: employeeForm.pixKey,
          bankAccount: employeeForm.bankAccount
        } : emp)
      }));
    } else {
      const emp: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: state.currentUser?.companyId || 'default-company',
        name: employeeForm.name,
        role: employeeForm.role,
        status: 'active',
        defaultDailyRate: parseFloat(employeeForm.rate) || 80,
        cpf: employeeForm.cpf,
        birthDate: employeeForm.birthDate,
        address: employeeForm.address,
        phone: employeeForm.phone,
        paymentType: employeeForm.paymentType,
        pixKey: employeeForm.pixKey,
        bankAccount: employeeForm.bankAccount
      };
      setState(prev => ({ ...prev, employees: [...prev.employees, emp] }));
    }

    setShowAddForm(false);
    setEditingEmployeeId(null);
    setEmployeeForm(initialFormState);
  };

  const openEditModal = (emp: Employee) => {
    setEmployeeForm({
      name: emp.name,
      role: emp.role,
      rate: emp.defaultDailyRate?.toString() || '80',
      cpf: emp.cpf || '',
      birthDate: emp.birthDate || '',
      address: emp.address || '',
      phone: emp.phone || '',
      paymentType: emp.paymentType || 'pix',
      pixKey: emp.pixKey || '',
      bankAccount: emp.bankAccount || ''
    });
    setEditingEmployeeId(emp.id);
    setShowAddForm(true);
  };

  const exportEmployeeReport = (employeeId: string) => {
    const emp = state.employees.find(e => e.id === employeeId);
    if (!emp) return;

    const history = (state.attendanceRecords || []).filter(r => 
      r.employeeId === employeeId && r.date.startsWith(currentMonthStr)
    ).sort((a, b) => a.date.localeCompare(b.date));

    const monthLabel = currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    let csvContent = `RELATORIO DE PRESENCA - ${emp.name.toUpperCase()}\n`;
    csvContent += `CARGO: ${emp.role.toUpperCase()}\n`;
    csvContent += `MES DE REFERENCIA: ${monthLabel.toUpperCase()}\n\n`;
    csvContent += `DATA;STATUS;VALOR DA DIARIA;SITUACAO PAGAMENTO\n`;

    let totalValue = 0;
    let totalPresent = 0;

    history.forEach(rec => {
      const formattedDate = rec.date.split('-').reverse().join('/');
      const statusLabel = rec.status === 'present' ? 'PRESENTE' : 'AUSENTE';
      const valueLabel = rec.status === 'present' ? formatMoney(rec.value) : '0,00';
      // Fix: paymentStatus uses 'pago' and 'pendente'
      const paymentLabel = rec.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE';
      
      if (rec.status === 'present') {
        totalValue += rec.value;
        totalPresent++;
      }
      
      csvContent += `${formattedDate};${statusLabel};${valueLabel};${paymentLabel}\n`;
    });

    csvContent += `\nRESUMO FINAL\n`;
    csvContent += `DIAS TRABALHADOS;${totalPresent}\n`;
    csvContent += `TOTAL BRUTO;${formatMoney(totalValue)}\n`;

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presenca_${emp.name.replace(/\s+/g, '_')}_${currentMonthStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEmployees = (state.employees || []).filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">Gestão de Equipe</h2>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase mt-1">Calendário de presenças e diárias</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <CalendarIcon size={14} /> Calendário
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Users size={14} /> Equipe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-1">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
             <Clock size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">A Pagar (Pendente)</p>
            <p className="text-sm md:text-lg font-black text-rose-600">
              R$ {formatMoney(monthlyAttendanceSummary.totalPending)}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
             <CheckCircle2 size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total Pago</p>
            <p className="text-sm md:text-lg font-black text-emerald-600">
              R$ {formatMoney(monthlyAttendanceSummary.totalPaid)}
            </p>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
            <button 
              onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))}
              className="p-2 hover:bg-white rounded-xl text-slate-400"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))}
              className="p-2 hover:bg-white rounded-xl text-slate-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="p-4 grid grid-cols-7 gap-1 md:gap-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center py-2 text-[9px] font-black text-slate-300 uppercase">{d}</div>
            ))}
            {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map(date => {
              const dStr = date.toISOString().split('T')[0];
              const records = (state.attendanceRecords || []).filter(r => r.date === dStr);
              const isToday = new Date().toISOString().split('T')[0] === dStr;
              // Fix: paymentStatus uses 'pago' and 'pendente'
              const hasPending = records.some(r => r.status === 'present' && r.paymentStatus !== 'pago');

              return (
                <button 
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`aspect-square rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center relative transition-all active:scale-90 hover:border-blue-200 group ${isToday ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 bg-white'}`}
                >
                  <span className={`text-[10px] md:text-sm font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{date.getDate()}</span>
                  {records.length > 0 && (
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full ${hasPending ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Pesquisar funcionário..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => { setEditingEmployeeId(null); setEmployeeForm(initialFormState); setShowAddForm(true); }} className="bg-blue-600 text-white p-3 rounded-2xl shadow-md"><UserPlus size={20} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEmployees.map(emp => {
                const stats = getEmployeeStats(emp.id, currentMonthStr);
                return (
                  <div key={emp.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex flex-col group shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg ${emp.status === 'active' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                         {emp.name.charAt(0)}
                       </div>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => openEditModal(emp)}
                           className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                         >
                           <Edit2 size={18} />
                         </button>
                         <button onClick={() => {
                            setState(prev => ({
                              ...prev,
                              employees: prev.employees.map(e => e.id === emp.id ? {...e, status: e.status === 'active' ? 'inactive' : 'active'} : e)
                            }));
                         }}>
                           {emp.status === 'active' ? <ToggleRight className="text-emerald-500" size={28} /> : <ToggleLeft className="text-slate-200" size={28} />}
                         </button>
                       </div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase truncate">{emp.name}</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-4">{emp.role}</p>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                       <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Dias</p>
                          <p className="text-xs font-black text-slate-800">{stats.presentDays}d</p>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Pendente</p>
                          <p className={`text-xs font-black ${stats.totalPending > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>R${formatMoney(stats.totalPending)}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="mt-4 w-full py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      <ClipboardList size={12} /> Ver Ficha
                    </button>
                  </div>
                )
              })}
           </div>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><CalendarCheck size={20} /></div>
                   <h3 className="text-sm font-black uppercase">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {state.employees.filter(e => e.status === 'active').map(emp => {
                  const record = (state.attendanceRecords || []).find(r => r.employeeId === emp.id && r.date === selectedDate);
                  return (
                    <div key={emp.id} className={`flex items-center justify-between p-3 rounded-2xl border ${record?.status === 'present' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/30 border-slate-100'}`}>
                       <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleAttendance(emp.id, selectedDate)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${record?.status === 'present' ? 'bg-emerald-600 text-white' : record?.status === 'absent' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'}`}
                          >
                            {record?.status === 'present' ? <CheckCircle size={18} /> : record?.status === 'absent' ? <XCircle size={18} /> : <AlertCircle size={18} />}
                          </button>
                          <div>
                            <p className="text-[11px] font-black text-slate-800 leading-none">{emp.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{record?.status || 'Não Registrado'}</p>
                          </div>
                       </div>
                       {record && record.status === 'present' && (
                         <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-16 bg-white border border-slate-100 rounded-lg py-1 px-2 text-[10px] font-black text-right"
                              value={record.value}
                              onChange={e => updateDailyRateValue(emp.id, selectedDate, parseFloat(e.target.value) || 0)}
                            />
                         </div>
                       )}
                    </div>
                  )
                })}
             </div>
             <div className="p-6 bg-slate-50 border-t">
                <button onClick={() => setSelectedDate(null)} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase text-[10px]">Fechar</button>
             </div>
          </div>
        </div>
      )}

      {selectedEmployeeId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             {(() => {
               const emp = state.employees.find(e => e.id === selectedEmployeeId);
               if(!emp) return null;
               const history = (state.attendanceRecords || []).filter(r => r.employeeId === emp.id && r.date.startsWith(currentMonthStr))
                 .sort((a, b) => a.date.localeCompare(b.date));
               
               const personalSummary = history.reduce((acc, r) => {
                 if (r.status === 'present') {
                   // Fix: paymentStatus uses 'pago' and 'pendente'
                   if (r.paymentStatus === 'pago') acc.paid += r.value;
                   else acc.pending += r.value;
                 }
                 return acc;
               }, { paid: 0, pending: 0 });

               return (
                 <>
                   <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-black uppercase leading-none">{emp.name}</h3>
                        <p className="text-[10px] font-black uppercase text-blue-200 mt-2 tracking-widest">{emp.role}</p>
                      </div>
                      <button onClick={() => setSelectedEmployeeId(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={18} /></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                      
                      {/* Resumo Financeiro na Ficha */}
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                            <p className="text-[8px] font-black text-emerald-600 uppercase">Já Pago</p>
                            <p className="text-sm font-black text-emerald-700">R$ {formatMoney(personalSummary.paid)}</p>
                         </div>
                         <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100">
                            <p className="text-[8px] font-black text-rose-600 uppercase">A Pagar</p>
                            <p className="text-sm font-black text-rose-700">R$ {formatMoney(personalSummary.pending)}</p>
                         </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Informações Pessoais</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">CPF</p>
                               <p className="text-xs font-black text-slate-700">{emp.cpf || 'Não informado'}</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Nascimento</p>
                               <p className="text-xs font-black text-slate-700">{emp.birthDate ? new Date(emp.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}</p>
                            </div>
                            <div className="col-span-2">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Endereço</p>
                               <p className="text-xs font-black text-slate-700">{emp.address || 'Não informado'}</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Telefone</p>
                               <p className="text-xs font-black text-slate-700">{emp.phone || 'Não informado'}</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Pagamento</p>
                               <p className="text-xs font-black text-blue-600 uppercase">{emp.paymentType === 'pix' ? 'Pix' : 'Conta Corrente'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Histórico & Pagamentos</h4>
                        {history.length > 0 ? history.map(rec => (
                          <div key={rec.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all">
                             <div>
                               <p className="text-xs font-black text-slate-700">{new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                               <p className={`text-[10px] font-black uppercase ${rec.status === 'present' ? 'text-slate-400' : 'text-rose-400'}`}>
                                 {rec.status === 'present' ? `R$ ${formatMoney(rec.value)}` : 'AUSENTE'}
                               </p>
                             </div>
                             
                             {rec.status === 'present' && (
                               <button 
                                 onClick={() => togglePaymentStatus(rec.id)}
                                 // Fix: paymentStatus uses 'pago' and 'pendente'
                                 className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${rec.paymentStatus === 'pago' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
                               >
                                 {rec.paymentStatus === 'pago' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                 {rec.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                               </button>
                             )}
                          </div>
                        )) : (
                          <div className="py-8 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                            <p className="text-slate-300 font-black uppercase text-[10px]">Nenhum registro este mês</p>
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="p-6 bg-white border-t flex flex-col gap-3">
                      <button 
                        onClick={() => exportEmployeeReport(emp.id)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all"
                      >
                        <FileSpreadsheet size={16} /> Baixar Relatório (CSV)
                      </button>
                      <button onClick={() => setSelectedEmployeeId(null)} className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[9px] hover:bg-slate-50 transition-all">Sair</button>
                   </div>
                 </>
               )
             })()}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {editingEmployeeId ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h3>
                <button onClick={() => { setShowAddForm(false); setEditingEmployeeId(null); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Dados Profissionais</h4>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Digite o nome..." value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                    <input className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Ex: Operador" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor da Diária (R$)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="number" className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" value={employeeForm.rate} onChange={e => setEmployeeForm({...employeeForm, rate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14} /> Dados Pessoais</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                      <input className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="000.000..." value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nascimento</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" value={employeeForm.birthDate} onChange={e => setEmployeeForm({...employeeForm, birthDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="(00) 00000..." value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Rua, Número, Bairro..." value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Wallet size={14} /> Informações de Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato de Recebimento</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button 
                        type="button" 
                        onClick={() => setEmployeeForm({...employeeForm, paymentType: 'pix'})}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentType === 'pix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                      >Chave Pix</button>
                      <button 
                        type="button"
                        onClick={() => setEmployeeForm({...employeeForm, paymentType: 'bank'})}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentType === 'bank' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                      >Conta Bancária</button>
                    </div>
                  </div>
                  
                  {employeeForm.paymentType === 'pix' ? (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave Pix</label>
                      <input className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="E-mail, CPF, Celular..." value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dados Bancários</label>
                      <input className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Banco, Agência, Conta..." value={employeeForm.bankAccount} onChange={e => setEmployeeForm({...employeeForm, bankAccount: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => { setShowAddForm(false); setEditingEmployeeId(null); }} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button onClick={handleSaveEmployee} className="flex-[2] bg-blue-600 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all">
                  {editingEmployeeId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const HistoryIcon = ({size, className}: {size: number, className: string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Employees;
