
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save, Fingerprint, Smartphone, MapPin, CreditCard, Power, UserX, AlertCircle } from 'lucide-react';
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

  const initialFormState = { name: '', role: 'Ajudante Geral', defaultValue: '80', cpf: '', phone: '', pixKey: '', address: '' };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleToggleAttendance = async (empId: string, date: string) => {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;
    
    if (emp.status === 'inactive') {
      return notify("Não é possível lançar frequência para inativos", "error");
    }

    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === date);

    try {
      if (existing) {
        if (existing.status === 'present') {
          await dbSave('attendance_records', { ...existing, status: 'absent', value: 0 });
        } else {
          await dbDelete('attendance_records', existing.id);
        }
      } else {
        await dbSave('attendance_records', {
          companyId: state.currentUser?.companyId,
          employee_id: empId,
          date,
          status: 'present',
          value: emp.defaultValue,
          payment_status: 'pendente'
        });
      }
      await refreshData();
    } catch (e) { notify("Erro ao sincronizar presença", "error"); }
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
        status: editingId ? (state.employees.find(e => e.id === editingId)?.status || 'active') : 'active'
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
      defaultValue: String(emp.defaultValue),
      cpf: emp.cpf || '',
      phone: emp.phone || '',
      pixKey: emp.pixKey || '',
      address: emp.address || ''
    });
    setShowForm(true);
  };

  const daysInMonth = useMemo(() => new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate(), [currentCalendarDate]);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredEmployees = state.employees.filter(e => showInactive || e.status === 'active');

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Equipe & RH</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Controle de Frequência e Status Cadastral</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowInactive(!showInactive)} 
            className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm transition-all ${!showInactive ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}
          >
             {showInactive ? <UserX size={16}/> : <Users size={16}/>}
             {showInactive ? 'FILTRAR ATIVOS' : 'EXIBIR TODOS'}
          </button>
          <button onClick={() => { setEditingId(null); setEmployeeForm(initialFormState); setShowForm(true); }} className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 tracking-[0.2em] hover:bg-emerald-700 transition-all">
             <UserPlus size={16} /> NOVO CADASTRO
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="p-6 border-b bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"><ChevronLeft size={18} /></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Presente (P)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded" />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Falta (F)</span>
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="sticky left-0 bg-slate-50 p-4 text-left text-[9px] font-black text-slate-400 uppercase border-r min-w-[220px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Nome / Status</th>
                {calendarDays.map(day => <th key={day} className="p-2 text-center text-[9px] font-black text-slate-400 border-r min-w-[34px]">{day}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors group ${emp.status === 'inactive' ? 'opacity-60 bg-slate-50/20' : ''}`}>
                  <td className="sticky left-0 bg-white p-4 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[10px] font-black uppercase truncate ${emp.status === 'inactive' ? 'text-slate-400 line-through italic' : 'text-slate-800'}`}>{emp.name}</p>
                          <span className={`w-2 h-2 rounded-full ${emp.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                        </div>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{emp.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(emp)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={12}/></button>
                        <button onClick={() => handleToggleStatus(emp)} title={emp.status === 'active' ? 'Inativar' : 'Ativar'} className={`p-2 rounded-lg transition-all ${emp.status === 'active' ? 'text-slate-300 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-500 bg-emerald-50'}`}>
                           <Power size={12}/>
                        </button>
                      </div>
                    </div>
                  </td>
                  {calendarDays.map(day => {
                    const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const att = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <td 
                        key={day} 
                        onClick={() => handleToggleAttendance(emp.id, dateStr)}
                        className={`p-0 border-r h-12 text-center text-[9px] font-black transition-all ${emp.status === 'active' ? 'cursor-pointer hover:brightness-95' : 'cursor-not-allowed'} ${att?.status === 'present' ? 'bg-emerald-500 text-white' : att?.status === 'absent' ? 'bg-rose-500 text-white' : isToday ? 'bg-slate-50 text-slate-900 border-2 border-slate-900' : 'text-slate-200 hover:bg-slate-100'}`}
                      >
                        {emp.status === 'active' ? (att?.status === 'present' ? 'P' : att?.status === 'absent' ? 'F' : '-') : <X size={10} className="mx-auto opacity-20"/>}
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
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh] border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dados Corporativos em Cloud</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-300"><X size={20}/></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome Completo</label>
                   <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input required className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all" placeholder="NOME DO COLABORADOR" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CPF (SÓ NÚMEROS)</label>
                      <div className="relative group">
                         <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                         <input required className="w-full bg-slate-50 border border-slate-200 pl-11 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="00000000000" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Telefone</label>
                      <div className="relative group">
                         <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                         <input className="w-full bg-slate-50 border border-slate-200 pl-11 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="(00) 00000-0000" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Função / Cargo</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                         {state.employeeRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Valor Diária (R$)</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="0.00" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Chave PIX (Acerto)</label>
                   <div className="relative group">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="CPF, TELEFONE OU ALEATÓRIA" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Endereço Residencial</label>
                   <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" placeholder="LOGRADOURO, Nº, CIDADE" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} />
                   </div>
                </div>
              </div>

              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-emerald-600">
                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18}/>}
                SINCRONIZAR DADOS
              </button>
           </form>
        </div>
      )}
    </div>
  );
};
export default Employees;
