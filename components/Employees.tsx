
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save, Fingerprint, Smartphone, MapPin, CreditCard, Power, UserX, AlertCircle, Clock, Briefcase, HeartPulse, ShieldAlert, Palmtree, Mail, DollarSign, Calendar, Users2, CheckCircle2, Wallet, BarChart3 } from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface EmployeesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Employees: React.FC<EmployeesProps> = ({ state, setState, notify }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showInactive, setShowInactive] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState<{ emp: Employee, date: string, record?: AttendanceRecord } | null>(null);

  const initialFormState = { 
    name: '', 
    role: '', 
    defaultValue: '0', 
    cpf: '', 
    phone: '', 
    pixKey: '', 
    address: '',
    paymentModality: 'DIARIA' as 'DIARIA' | 'CLT',
    workload: '44H SEMANAIS',
    startTime: '08:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    endTime: '17:00'
  };
  
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const [pointForm, setPointForm] = useState({
    clockIn: '',
    breakStart: '',
    breakEnd: '',
    clockOut: '',
    status: 'present' as AttendanceRecord['status'],
    observation: ''
  });

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const getVirtualStatus = (record: AttendanceRecord): AttendanceRecord['status'] => {
    if (record.status !== 'absent') return record.status;
    const obs = record.discountObservation || '';
    if (obs.startsWith('[AT]')) return 'atestado';
    if (obs.startsWith('[FJ]')) return 'justified';
    if (obs.startsWith('[FE]')) return 'vacation';
    return 'absent';
  };

  const handleToggleAttendance = async (empId: string, date: string) => {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;
    if (emp.status === 'inactive') return notify("Não é possível lançar frequência para inativos", "error");

    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === date);

    if (emp.paymentModality === 'CLT') {
      const virtualStatus = existing ? getVirtualStatus(existing) : 'present';
      const cleanObs = (existing?.discountObservation || '').replace(/^\[(AT|FJ|FE)\]\s*/, '');

      setPointForm({
        clockIn: existing?.clockIn || emp.startTime || '08:00',
        breakStart: existing?.breakStart || emp.breakStart || '12:00',
        breakEnd: existing?.breakEnd || emp.breakEnd || '13:00',
        clockOut: existing?.clockOut || emp.endTime || '17:00',
        status: virtualStatus,
        observation: cleanObs
      });
      setShowTimeModal({ emp, date, record: existing });
      return;
    }

    try {
      if (!existing) {
        await dbSave('attendance_records', {
          companyId: state.currentUser?.companyId,
          employeeId: empId,
          date,
          status: 'present',
          value: Number(emp.defaultValue) || 0,
          paymentStatus: 'pendente'
        });
      } else if (existing.status === 'present') {
        await dbSave('attendance_records', { ...existing, status: 'partial', value: (Number(emp.defaultValue) || 0) / 2 });
      } else if (existing.status === 'partial') {
        await dbSave('attendance_records', { ...existing, status: 'absent', value: 0 });
      } else {
        await dbDelete('attendance_records', existing.id);
      }
      await refreshData();
    } catch (e) { 
      notify("Erro ao sincronizar presença", "error"); 
    }
  };

  const handleSavePoint = async () => {
    if (!showTimeModal) return;
    const { emp, date, record } = showTimeModal;

    setIsLoading(true);
    try {
      let dbStatus: AttendanceRecord['status'] = 'absent';
      let prefix = '';

      if (pointForm.status === 'present' || pointForm.status === 'partial') {
        dbStatus = pointForm.status;
      } else if (pointForm.status === 'atestado') {
        dbStatus = 'absent';
        prefix = '[AT] ';
      } else if (pointForm.status === 'justified') {
        dbStatus = 'absent';
        prefix = '[FJ] ';
      } else if (pointForm.status === 'vacation') {
        dbStatus = 'absent';
        prefix = '[FE] ';
      }

      const finalObservation = prefix + (pointForm.observation || '');
      const isWorking = dbStatus === 'present' || dbStatus === 'partial';
      
      let finalValue = 0;
      if (emp.paymentModality === 'CLT') {
        if (['present', 'partial', 'atestado', 'justified', 'vacation'].includes(pointForm.status)) {
          finalValue = Number(emp.defaultValue) || 0;
        }
      }

      await dbSave('attendance_records', {
        id: record?.id || undefined,
        companyId: state.currentUser?.companyId,
        employeeId: emp.id,
        date,
        status: dbStatus,
        value: finalValue,
        paymentStatus: record?.paymentStatus || 'pendente',
        clockIn: isWorking ? (pointForm.clockIn || null) : null,
        breakStart: isWorking ? (pointForm.breakStart || null) : null,
        breakEnd: isWorking ? (pointForm.breakEnd || null) : null,
        clockOut: isWorking ? (pointForm.clockOut || null) : null,
        discountObservation: finalObservation || null
      });
      
      await refreshData();
      setShowTimeModal(null);
      notify("Registro salvo com sucesso");
    } catch (e) { 
      notify("Erro ao salvar registro de ponto", "error"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    setIsLoading(true);
    try {
      const newStatus = emp.status === 'active' ? 'inactive' : 'active';
      await dbSave('employees', { id: emp.id, status: newStatus });
      await refreshData();
      notify(`Colaborador ${newStatus === 'active' ? 'Reativado' : 'Inativado'}`);
    } catch (e) { notify("Falha ao atualizar status", "error"); } finally { setIsLoading(false); }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name) return notify("Nome completo é obrigatório", "error");
    if (!employeeForm.role) return notify("Selecione um Cargo / Função", "error");
    
    setIsLoading(true);
    try {
      const finalValue = parseFloat(employeeForm.defaultValue.replace(',', '.')) || 0;

      await dbSave('employees', {
        id: editingId || undefined,
        companyId: state.currentUser?.companyId,
        name: employeeForm.name.toUpperCase(),
        role: employeeForm.role.toUpperCase(),
        defaultValue: finalValue,
        cpf: employeeForm.cpf || null,
        phone: employeeForm.phone || null,
        pixKey: employeeForm.pixKey || null,
        address: employeeForm.address.toUpperCase() || null,
        status: editingId ? (state.employees.find(e => e.id === editingId)?.status || 'active') : 'active',
        paymentModality: employeeForm.paymentModality,
        workload: employeeForm.workload.toUpperCase() || null,
        startTime: employeeForm.startTime || null,
        breakStart: employeeForm.breakStart || null,
        breakEnd: employeeForm.breakEnd || null,
        endTime: employeeForm.endTime || null
      });
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      setEmployeeForm(initialFormState);
      notify(editingId ? "Cadastro atualizado" : "Novo colaborador integrado");
    } catch (e: any) { 
      notify("Falha na sincronização.", "error"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEmployeeForm({
      name: emp.name,
      role: emp.role,
      defaultValue: String(emp.defaultValue || 0),
      cpf: emp.cpf || '',
      phone: emp.phone || '',
      pixKey: emp.pixKey || '',
      address: emp.address || '',
      paymentModality: emp.paymentModality || 'DIARIA',
      workload: emp.workload || '44H SEMANAIS',
      startTime: emp.startTime || '08:00',
      breakStart: emp.breakStart || '12:00',
      breakEnd: emp.breakEnd || '13:00',
      endTime: emp.endTime || '17:00'
    });
    setShowForm(true);
  };

  const daysInMonth = useMemo(() => new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate(), [currentCalendarDate]);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const filteredEmployees = state.employees.filter(e => showInactive || e.status === 'active');

  // Cálculos de Resumo Financeiro do Mês Visualizado - ATUALIZADO PARA INCLUIR BONUS
  const monthSummary = useMemo(() => {
    const yearMonth = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}`;
    const visibleEmpIds = new Set(filteredEmployees.map(e => e.id));
    
    let paid = 0;
    let pending = 0;

    state.attendanceRecords.forEach(record => {
      if (record.date.startsWith(yearMonth) && visibleEmpIds.has(record.employeeId)) {
        // Cálculo: (Valor do Dia + Bônus) - Descontos
        const netValue = (record.value + (record.bonusValue || 0)) - (record.discountValue || 0);
        if (record.paymentStatus === 'pago') {
          paid += netValue;
        } else {
          pending += netValue;
        }
      }
    });

    return { paid, pending, total: paid + pending };
  }, [state.attendanceRecords, filteredEmployees, currentCalendarDate]);

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getAttendanceLabel = (record: AttendanceRecord | undefined, emp: Employee) => {
    if (!record) return '-';
    const virtualStatus = getVirtualStatus(record);
    if (emp.paymentModality === 'CLT') {
      switch(virtualStatus) {
        case 'present': return record.clockIn || 'P';
        case 'atestado': return 'AT';
        case 'justified': return 'FJ';
        case 'vacation': return 'FE';
        case 'absent': return 'F';
        case 'partial': return 'P';
        default: return '-';
      }
    } else {
      switch(virtualStatus) {
        case 'present': return 'P';
        case 'partial': return 'H';
        case 'absent': return 'F';
        case 'atestado': return 'AT';
        case 'justified': return 'FJ';
        case 'vacation': return 'FE';
        default: return '-';
      }
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Equipe & Frequência</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Pessoal e Presença</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowInactive(!showInactive)} className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase transition-all shadow-sm">
             {showInactive ? 'Filtrar Ativos' : 'Exibir Todos'}
          </button>
          <button onClick={() => { setEditingId(null); setEmployeeForm(initialFormState); setShowForm(true); }} className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
             <UserPlus size={16}/> Novo Cadastro
          </button>
        </div>
      </header>

      {/* Cards de Resumo Financeiro de Equipe - ADICIONADO CUSTO TOTAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:border-emerald-200">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><CheckCircle2 size={28} /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Já Pago (Mês)</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">{formatMoney(monthSummary.paid)}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:border-amber-200">
           <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner"><Wallet size={28} /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Pendente Acumulado</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{formatMoney(monthSummary.pending)}</h3>
           </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] border border-white/5 shadow-2xl flex items-center gap-5 transition-all hover:bg-slate-800">
           <div className="w-14 h-14 bg-white/10 text-blue-400 rounded-2xl flex items-center justify-center shadow-inner"><BarChart3 size={28} /></div>
           <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Custo Total de Operação</p>
              <h3 className="text-2xl font-black text-white tracking-tighter">{formatMoney(monthSummary.total)}</h3>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 md:p-6 border-b bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ChevronLeft size={18} /></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ChevronRight size={18} /></button>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400 font-black text-[8px] uppercase tracking-widest">
             Legenda: <span className="text-emerald-500">P=Presença</span> • <span className="text-rose-500">F=Falta</span> • <span className="text-purple-500">AT=Atestado</span> • <span className="text-blue-500">FJ=Justificada</span> • <span className="text-amber-500">FE=Férias</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 p-4 text-left border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] min-w-[220px]">Colaborador</th>
                {calendarDays.map(day => {
                   const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                   const isToday = dateStr === new Date().toISOString().split('T')[0];
                   return (
                     <th key={day} className="p-2 text-center border-r min-w-[34px]">
                       <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-md' : ''}`}>
                        {day}
                       </span>
                     </th>
                   );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors group ${emp.status === 'inactive' ? 'opacity-50' : ''}`}>
                  <td className="sticky left-0 z-10 bg-white p-4 border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase truncate flex items-center gap-1 ${emp.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {emp.paymentModality === 'CLT' && <Clock size={10} className="text-blue-500" />}
                          {emp.name}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{emp.role}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={12}/></button>
                        <button onClick={() => handleToggleStatus(emp)} className={`p-1.5 rounded-lg ${emp.status === 'active' ? 'text-rose-400 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}><Power size={12}/></button>
                      </div>
                    </div>
                  </td>
                  {calendarDays.map(day => {
                    const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const att = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const virtualStatus = att ? getVirtualStatus(att) : null;
                    let bgColor = 'text-slate-200 hover:bg-slate-100';
                    if (att) {
                        switch(virtualStatus) {
                          case 'present': bgColor = emp.paymentModality === 'CLT' ? 'bg-blue-600 text-white shadow-inner' : 'bg-emerald-500 text-white shadow-inner'; break;
                          case 'absent': bgColor = 'bg-rose-500 text-white shadow-inner'; break;
                          case 'partial': bgColor = 'bg-amber-500 text-white shadow-inner'; break;
                          case 'atestado': bgColor = 'bg-purple-600 text-white shadow-inner'; break;
                          case 'justified': bgColor = 'bg-sky-500 text-white shadow-inner'; break;
                          case 'vacation': bgColor = 'bg-amber-400 text-white shadow-inner'; break;
                        }
                    } else if (isToday) {
                        bgColor = 'bg-blue-50/30 text-blue-400';
                    }
                    return (
                      <td key={day} onClick={() => handleToggleAttendance(emp.id, dateStr)} className={`p-0 border-r h-12 text-center text-[8px] font-black transition-all cursor-pointer ${bgColor}`}>
                        {getAttendanceLabel(att, emp)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-2xl p-8 md:p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh] border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-6">
                 <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">{editingId ? 'Editar Perfil Operacional' : 'Novo Cadastro Operacional'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronização Cloud Fera Service</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-200 rounded-2xl">
                    <button type="button" onClick={() => setEmployeeForm({...employeeForm, paymentModality: 'DIARIA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentModality === 'DIARIA' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>DIARISTA / AUTÔNOMO</button>
                    <button type="button" onClick={() => setEmployeeForm({...employeeForm, paymentModality: 'CLT'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentModality === 'CLT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>REGIME CLT (MENSALISTA)</button>
                  </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="EX: JOÃO DA SILVA" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cargo / Função</label>
                   <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                     <option value="">SELECIONE UM CARGO...</option>
                     {state.employeeRoles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                   </select>
                </div>

                {employeeForm.paymentModality === 'DIARIA' && (
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor da Diária (R$)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-4 rounded-2xl text-[11px] font-black outline-none focus:bg-white" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                     </div>
                  </div>
                )}

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CPF</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black outline-none focus:bg-white" placeholder="000.000.000-00" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Telefone / WhatsApp</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black outline-none focus:bg-white" placeholder="(00) 00000-0000" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Chave PIX (Acertos)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black outline-none focus:bg-white" placeholder="E-MAIL, CPF OU ALEATÓRIA" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                </div>

                <div className="md:col-span-2 space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Endereço de Residência</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} />
                </div>

                {employeeForm.paymentModality === 'CLT' && (
                  <div className="md:col-span-2 p-6 bg-blue-50 rounded-[32px] border border-blue-100 space-y-4">
                     <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Clock size={16}/> Configuração de Jornada de Trabalho</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-blue-400 uppercase">ENTRADA</label>
                           <input type="time" className="w-full bg-white border border-blue-200 p-3 rounded-xl text-[10px] font-black" value={employeeForm.startTime} onChange={e => setEmployeeForm({...employeeForm, startTime: e.target.value})}/>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-blue-400 uppercase">S. INTRA-JORNADA</label>
                           <input type="time" className="w-full bg-white border border-blue-200 p-3 rounded-xl text-[10px] font-black" value={employeeForm.breakStart} onChange={e => setEmployeeForm({...employeeForm, breakStart: e.target.value})}/>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-blue-400 uppercase">R. INTRA-JORNADA</label>
                           <input type="time" className="w-full bg-white border border-blue-200 p-3 rounded-xl text-[10px] font-black" value={employeeForm.breakEnd} onChange={e => setEmployeeForm({...employeeForm, breakEnd: e.target.value})}/>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-blue-400 uppercase">SAÍDA FINAL</label>
                           <input type="time" className="w-full bg-white border border-blue-200 p-3 rounded-xl text-[10px] font-black" value={employeeForm.endTime} onChange={e => setEmployeeForm({...employeeForm, endTime: e.target.value})}/>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-blue-400 uppercase">CARGA HORÁRIA TOTAL</label>
                        <input className="w-full bg-white border border-blue-200 p-3 rounded-xl text-[10px] font-black uppercase" placeholder="EX: 44H SEMANAIS" value={employeeForm.workload} onChange={e => setEmployeeForm({...employeeForm, workload: e.target.value})}/>
                     </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all hover:bg-emerald-600 active:scale-95 flex items-center justify-center gap-3">
                   {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> SALVAR CADASTRO</>}
                </button>
              </div>
           </form>
        </div>
      )}

      {showTimeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-md p-10 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-4">
                 <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">Registro de Ponto: {showTimeModal.emp.name.split(' ')[0]}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{showTimeModal.date.split('-').reverse().join('/')}</p>
                 </div>
                 <button onClick={() => setShowTimeModal(null)} className="p-2"><X size={20}/></button>
              </div>
              
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ENTRADA</label>
                       <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-xs" value={pointForm.clockIn} onChange={e => setPointForm({...pointForm, clockIn: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase ml-1">S. INTRA-JORNADA</label>
                       <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-xs" value={pointForm.breakStart} onChange={e => setPointForm({...pointForm, breakStart: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase ml-1">R. INTRA-JORNADA</label>
                       <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-xs" value={pointForm.breakEnd} onChange={e => setPointForm({...pointForm, breakEnd: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase ml-1">SAÍDA FINAL</label>
                       <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-xs" value={pointForm.clockOut} onChange={e => setPointForm({...pointForm, clockOut: e.target.value})}/>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">STATUS DO DIA</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-[10px] uppercase" value={pointForm.status} onChange={e => setPointForm({...pointForm, status: e.target.value as any})}>
                       <option value="present">PRESENÇA NORMAL (P)</option>
                       <option value="partial">HORÁRIO REDUZIDO (H)</option>
                       <option value="absent">FALTA INJUSTIFICADA (F)</option>
                       <option value="atestado">ATESTADO MÉDICO (AT)</option>
                       <option value="justified">FALTA JUSTIFICADA (FJ)</option>
                       <option value="vacation">FÉRIAS / FOLGA (FE)</option>
                    </select>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">OBSERVAÇÕES / JUSTIFICATIVA</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-[10px] uppercase h-20 outline-none focus:bg-white" placeholder="DESCREVA O MOTIVO DA AUSÊNCIA OU ALTERAÇÃO..." value={pointForm.observation} onChange={e => setPointForm({...pointForm, observation: e.target.value})}/>
                 </div>
              </div>

              <button onClick={handleSavePoint} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all">
                 {isLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CONFIRMAR REGISTRO'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
