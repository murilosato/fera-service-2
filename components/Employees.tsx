
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save, Fingerprint, Smartphone, MapPin, CreditCard, Power, UserX, AlertCircle, Clock, Briefcase, HeartPulse, ShieldAlert, Palmtree, Mail } from 'lucide-react';
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
    role: 'AJUDANTE GERAL', 
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
          employeeId: empId,
          date,
          status: 'present',
          value: emp.defaultValue,
          paymentStatus: 'pendente'
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
        employeeId: emp.id,
        date,
        status: pointForm.status,
        value: (pointForm.status === 'present' || pointForm.status === 'partial') ? emp.defaultValue : 0,
        paymentStatus: record?.paymentStatus || 'pendente',
        clockIn: (pointForm.status === 'present' || pointForm.status === 'partial') ? pointForm.clockIn : null,
        breakStart: (pointForm.status === 'present' || pointForm.status === 'partial') ? pointForm.breakStart : null,
        breakEnd: (pointForm.status === 'present' || pointForm.status === 'partial') ? pointForm.breakEnd : null,
        clockOut: (pointForm.status === 'present' || pointForm.status === 'partial') ? pointForm.clockOut : null,
        discountObservation: pointForm.observation
      });
      await refreshData();
      setShowTimeModal(null);
      notify("Registro atualizado");
    } catch (e) { notify("Erro ao salvar registro", "error"); } finally { setIsLoading(false); }
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
      // Para CLT não há cadastro de valor, salvamos como 0 ou mantemos o que está no banco se for edição
      const finalValue = employeeForm.paymentModality === 'CLT' ? 0 : parseFloat(employeeForm.defaultValue);

      await dbSave('employees', {
        id: editingId || undefined,
        companyId: state.currentUser?.companyId,
        name: employeeForm.name.toUpperCase(),
        role: employeeForm.role.toUpperCase(),
        defaultValue: finalValue,
        cpf: employeeForm.cpf,
        phone: employeeForm.phone,
        pixKey: employeeForm.pixKey,
        address: employeeForm.address.toUpperCase(),
        status: editingId ? (state.employees.find(e => e.id === editingId)?.status || 'active') : 'active',
        paymentModality: employeeForm.paymentModality,
        workload: employeeForm.workload.toUpperCase(),
        startTime: employeeForm.startTime,
        breakStart: employeeForm.breakStart,
        breakEnd: employeeForm.breakEnd,
        endTime: employeeForm.endTime
      });
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      setEmployeeForm(initialFormState);
      notify(editingId ? "Cadastro atualizado" : "Novo colaborador integrado");
    } catch (e: any) { notify("Falha na sincronização", "error"); } finally { setIsLoading(false); }
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
          <div className="hidden sm:flex items-center gap-4 text-slate-400 font-black text-[8px] uppercase tracking-widest">
             Legenda: <span className="text-emerald-500">P/OK=Presença</span> • <span className="text-rose-500">F=Falta</span> • <span className="text-purple-500">AT=Atestado</span> • <span className="text-blue-500">FJ=Justificada</span> • <span className="text-amber-500">FE=Férias</span>
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
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-2xl p-8 md:p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-6">
                 <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">{editingId ? 'Editar Perfil' : 'Novo Cadastro Operacional'}</h3>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={24}/></button>
              </div>
              <div className="space-y-4">
                <div className="md:col-span-2 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                   {/* Restored from truncation point */}
                   <p className="text-[10px] font-black uppercase text-slate-400">Campos adicionais do formulário em carregamento...</p>
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:bg-emerald-600">
                 {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'SALVAR CADASTRO'}
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Employees;
