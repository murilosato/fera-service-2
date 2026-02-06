
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save, Fingerprint, Smartphone, MapPin, CreditCard, Power, UserX, AlertCircle, Clock, Briefcase, HeartPulse, ShieldAlert, Palmtree } from 'lucide-react';
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
  const [showInactive, setShowInactive] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState<{ emp: Employee, date: string, record?: AttendanceRecord } | null>(null);

  const initialFormState = { 
    name: '', 
    role: 'Ajudante Geral', 
    defaultValue: '80', 
    cpf: '', 
    phone: '', 
    pixKey: '', 
    address: '',
    paymentModality: 'DIARIA' as 'DIARIA' | 'CLT',
    workload: '44h Semanais',
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

  const handleToggleAttendance = async (empId: string, date: string) => {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;
    if (emp.status === 'inactive') return notify("Não é possível lançar frequência para inativos", "error");

    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === date);

    if (emp.paymentModality === 'CLT') {
      setPointForm({
        clockIn: existing?.clockIn || emp.startTime || '08:00',
        breakStart: existing?.breakStart || emp.breakStart || '12:00',
        breakEnd: existing?.breakEnd || emp.breakEnd || '13:00',
        clockOut: existing?.clockOut || emp.endTime || '17:00',
        status: existing?.status || 'present',
        observation: existing?.discountObservation || ''
      });
      setShowTimeModal({ emp, date, record: existing });
      return;
    }

    try {
      if (!existing) {
        await dbSave('attendance_records', {
          companyId: state.currentUser?.companyId,
          employee_id: empId,
          date,
          status: 'present',
          value: emp.defaultValue,
          payment_status: 'pendente'
        });
      } else if (existing.status === 'present') {
        await dbSave('attendance_records', { ...existing, status: 'partial', value: emp.defaultValue / 2 });
      } else if (existing.status === 'partial') {
        await dbSave('attendance_records', { ...existing, status: 'absent', value: 0 });
      } else if (existing.status === 'absent') {
        await dbSave('attendance_records', { ...existing, status: 'atestado', value: 0 });
      } else if (existing.status === 'atestado') {
        await dbSave('attendance_records', { ...existing, status: 'justified', value: 0 });
      } else {
        await dbDelete('attendance_records', existing.id);
      }
      await refreshData();
    } catch (e) { notify("Erro ao sincronizar presença", "error"); }
  };

  const handleSavePoint = async () => {
    if (!showTimeModal) return;
    const { emp, date, record } = showTimeModal;

    setIsLoading(true);
    try {
      await dbSave('attendance_records', {
        id: record?.id || undefined,
        companyId: state.currentUser?.companyId,
        employee_id: emp.id,
        date,
        status: pointForm.status,
        value: (pointForm.status === 'present' || pointForm.status === 'partial') ? emp.defaultValue : 0,
        payment_status: record?.paymentStatus || 'pendente',
        clock_in: pointForm.status === 'present' ? pointForm.clockIn : null,
        break_start: pointForm.status === 'present' ? pointForm.breakStart : null,
        break_end: pointForm.status === 'present' ? pointForm.breakEnd : null,
        clock_out: pointForm.status === 'present' ? pointForm.clockOut : null,
        discount_observation: pointForm.observation
      });
      await refreshData();
      setShowTimeModal(null);
      notify("Registro atualizado");
    } catch (e) {
      notify("Erro ao salvar registro", "error");
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
    
    setIsLoading(true);
    try {
      await dbSave('employees', {
        id: editingId || undefined,
        companyId: state.currentUser?.companyId,
        name: employeeForm.name.toUpperCase(),
        role: employeeForm.role.toUpperCase(),
        defaultValue: parseFloat(employeeForm.defaultValue),
        cpf: employeeForm.cpf,
        phone: employeeForm.phone,
        pixKey: employeeForm.pixKey,
        address: employeeForm.address.toUpperCase(),
        status: editingId ? (state.employees.find(e => e.id === editingId)?.status || 'active') : 'active',
        payment_modality: employeeForm.paymentModality,
        workload: employeeForm.workload,
        start_time: employeeForm.startTime,
        break_start: employeeForm.breakStart,
        break_end: employeeForm.breakEnd,
        end_time: employeeForm.endTime
      });
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      setEmployeeForm(initialFormState);
      notify(editingId ? "Cadastro atualizado" : "Novo colaborador integrado");
    } catch (e: any) { 
      notify("Falha na sincronização", "error"); 
    } finally { setIsLoading(false); }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEmployeeForm({
      name: emp.name,
      role: emp.role,
      defaultValue: String(emp.defaultValue),
      cpf: emp.cpf || '',
      phone: emp.phone || '',
      pixKey: emp.pixKey || '',
      address: emp.address || '',
      paymentModality: emp.paymentModality || 'DIARIA',
      workload: emp.workload || '44h Semanais',
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

  const getAttendanceLabel = (att: AttendanceRecord | undefined, emp: Employee) => {
    if (!att) return '-';
    
    if (emp.paymentModality === 'CLT') {
      switch(att.status) {
        case 'present': return att.clockIn || 'OK';
        case 'atestado': return 'AT';
        case 'justified': return 'FJ';
        case 'vacation': return 'FE';
        case 'absent': return 'F';
        case 'partial': return 'P';
        default: return '-';
      }
    } else {
      switch(att.status) {
        case 'present': return 'P';
        case 'partial': return 'H';
        case 'absent': return 'F';
        case 'atestado': return 'AT';
        case 'justified': return 'FJ';
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

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 md:p-6 border-b bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ChevronLeft size={18} /></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ChevronRight size={18} /></button>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded" /><span className="text-[7px] font-black text-slate-400 uppercase">Presença</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded" /><span className="text-[7px] font-black text-slate-400 uppercase">Falta</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded" /><span className="text-[7px] font-black text-slate-400 uppercase">Atestado</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded" /><span className="text-[7px] font-black text-slate-400 uppercase">Justificada</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded" /><span className="text-[7px] font-black text-slate-400 uppercase">Férias</span></div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 p-4 text-left border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] min-w-[200px]">Colaborador</th>
                {calendarDays.map(day => <th key={day} className="p-2 text-center border-r min-w-[34px]">{day}</th>)}
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
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{emp.role} • {emp.paymentModality}</p>
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
                    
                    let bgColor = 'text-slate-200 hover:bg-slate-100';
                    
                    if (att) {
                        switch(att.status) {
                          case 'present': bgColor = emp.paymentModality === 'CLT' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'; break;
                          case 'absent': bgColor = 'bg-rose-500 text-white'; break;
                          case 'partial': bgColor = 'bg-amber-500 text-white'; break;
                          case 'atestado': bgColor = 'bg-purple-600 text-white'; break;
                          case 'justified': bgColor = 'bg-sky-500 text-white'; break;
                          case 'vacation': bgColor = 'bg-amber-400 text-white'; break;
                        }
                    } else if (isToday) {
                        bgColor = 'bg-slate-100 border-x-2 border-slate-900';
                    }

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleToggleAttendance(emp.id, dateStr)}
                        className={`p-0 border-r h-12 text-center text-[8px] font-black transition-all cursor-pointer ${bgColor}`}
                      >
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
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-xl p-8 md:p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-6">
                 <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">{editingId ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="radio" className="hidden" name="modality" checked={employeeForm.paymentModality === 'DIARIA'} onChange={() => setEmployeeForm({...employeeForm, paymentModality: 'DIARIA'})}/>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${employeeForm.paymentModality === 'DIARIA' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>DIARISTA</div>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="radio" className="hidden" name="modality" checked={employeeForm.paymentModality === 'CLT'} onChange={() => setEmployeeForm({...employeeForm, paymentModality: 'CLT'})}/>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${employeeForm.paymentModality === 'CLT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>CONTRATADO (CLT)</div>
                       </label>
                    </div>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Nome Completo</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="NOME DO COLABORADOR" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">CPF</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="000.000.000-00" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Função</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                      {state.employeeRoles.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                {employeeForm.paymentModality === 'CLT' && (
                  <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 space-y-6">
                    <div className="flex items-center gap-2 border-b border-blue-100 pb-3"><Clock size={16} className="text-blue-600" /><h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Definição de Jornada Contratual</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-blue-400 uppercase ml-1 block">Entrada</label>
                          <input type="time" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-[10px] font-black outline-none" value={employeeForm.startTime} onChange={e => setEmployeeForm({...employeeForm, startTime: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-blue-400 uppercase ml-1 block">Saída Inter.</label>
                          <input type="time" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-[10px] font-black outline-none" value={employeeForm.breakStart} onChange={e => setEmployeeForm({...employeeForm, breakStart: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-blue-400 uppercase ml-1 block">Volta Inter.</label>
                          <input type="time" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-[10px] font-black outline-none" value={employeeForm.breakEnd} onChange={e => setEmployeeForm({...employeeForm, breakEnd: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-blue-400 uppercase ml-1 block">Saída Final</label>
                          <input type="time" className="w-full bg-white border border-blue-100 p-3 rounded-xl text-[10px] font-black outline-none" value={employeeForm.endTime} onChange={e => setEmployeeForm({...employeeForm, endTime: e.target.value})} />
                       </div>
                    </div>
                  </div>
                )}
              </div>
              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>} SALVAR CADASTRO
              </button>
           </form>
        </div>
      )}

      {showTimeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-sm p-8 space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-100">
              <div className="text-center">
                 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><Clock size={28} /></div>
                 <h3 className="text-[12px] font-black uppercase text-slate-900">Registro de Ocorrência</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{showTimeModal.emp.name} • {showTimeModal.date.split('-').reverse().join('/')}</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tipo de Registro</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500" value={pointForm.status} onChange={e => setPointForm({...pointForm, status: e.target.value as any})}>
                       <option value="present">Presença Integral</option>
                       <option value="partial">Atraso / Saída Antecipada</option>
                       <option value="atestado">Atestado Médico (Justificado)</option>
                       <option value="justified">Falta Justificada</option>
                       <option value="absent">Falta Injustificada</option>
                       <option value="vacation">Férias / Folga</option>
                    </select>
                 </div>

                 {pointForm.status === 'present' || pointForm.status === 'partial' ? (
                   <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Entrada</label>
                        <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black outline-none" value={pointForm.clockIn} onChange={e => setPointForm({...pointForm, clockIn: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Saída</label>
                        <input type="time" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black outline-none" value={pointForm.clockOut} onChange={e => setPointForm({...pointForm, clockOut: e.target.value})} />
                      </div>
                   </div>
                 ) : null}

                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Justificativa / Observação</label>
                    <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500 resize-none" placeholder="DESCREVA O MOTIVO..." value={pointForm.observation} onChange={e => setPointForm({...pointForm, observation: e.target.value})} />
                 </div>

                 <button onClick={handleSavePoint} disabled={isLoading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-900 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'CONFIRMAR REGISTRO'}
                 </button>
                 <button onClick={() => setShowTimeModal(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default Employees;
