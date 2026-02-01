
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save } from 'lucide-react';
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

  const initialFormState = { name: '', role: 'Ajudante Geral', defaultValue: '80', cpf: '', phone: '', pixKey: '', address: '' };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleToggleAttendance = async (empId: string, date: string) => {
    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === date);
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;

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
          employeeId: empId,
          date,
          status: 'present',
          value: emp.defaultValue,
          paymentStatus: 'pendente'
        });
      }
      await refreshData();
    } catch (e) { notify("Erro ao marcar presença", "error"); }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name) return notify("Nome obrigatório", "error");
    
    // Validação de CPF Duplicado
    if (employeeForm.cpf) {
      const isDuplicate = state.employees.some(emp => emp.cpf === employeeForm.cpf && emp.id !== editingId);
      if (isDuplicate) return notify("CPF já cadastrado no sistema!", "error");
    }

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
        status: 'active'
      });
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      notify("Dados salvos");
    } catch (e: any) { notify("Erro no servidor", "error"); } finally { setIsLoading(false); }
  };

  const daysInMonth = useMemo(() => new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate(), [currentCalendarDate]);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div><h2 className="text-xl font-black text-slate-900 uppercase">Equipe & RH</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Clique nos dias para marcar Presença (P) ou Falta (F)</p></div>
        <button onClick={() => { setEditingId(null); setEmployeeForm(initialFormState); setShowForm(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2"><UserPlus size={16} /> NOVO CADASTRO</button>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg"><ChevronLeft size={18} /></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg"><ChevronRight size={18} /></button>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-600"><div className="w-3 h-3 bg-emerald-500 rounded" /> Presente</div>
             <div className="flex items-center gap-2 text-[9px] font-black uppercase text-rose-600"><div className="w-3 h-3 bg-rose-500 rounded" /> Falta</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50"><th className="sticky left-0 bg-slate-50 p-4 text-left text-[9px] font-black text-slate-400 uppercase border-r min-w-[200px]">Colaborador</th>{calendarDays.map(day => <th key={day} className="p-2 text-center text-[9px] font-black text-slate-400 border-r min-w-[34px]">{day}</th>)}</tr></thead>
            <tbody className="divide-y">
              {state.employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="sticky left-0 bg-white p-4 border-r">
                    <div className="flex justify-between items-center group">
                      <div><p className="text-[10px] font-black uppercase text-slate-800">{emp.name}</p><p className="text-[7px] text-slate-400 font-bold uppercase">{emp.role}</p></div>
                      <button onClick={() => { setEditingId(emp.id); setEmployeeForm({ name: emp.name, role: emp.role, defaultValue: String(emp.defaultValue), cpf: emp.cpf || '', phone: emp.phone || '', pixKey: emp.pixKey || '', address: emp.address || '' }); setShowForm(true); }} className="opacity-0 group-hover:opacity-100 p-2 text-blue-600"><Edit2 size={12}/></button>
                    </div>
                  </td>
                  {calendarDays.map(day => {
                    const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const att = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                    return (
                      <td 
                        key={day} 
                        onClick={() => handleToggleAttendance(emp.id, dateStr)}
                        className={`p-0 border-r h-10 text-center text-[9px] font-black cursor-pointer transition-all hover:brightness-95 ${att?.status === 'present' ? 'bg-emerald-500 text-white' : att?.status === 'absent' ? 'bg-rose-500 text-white' : 'text-slate-200'}`}
                      >
                        {att?.status === 'present' ? 'P' : att?.status === 'absent' ? 'F' : '-'}
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xs font-black uppercase">{editingId ? 'Editar Cadastro' : 'Novo Colaborador'}</h3>
                 <button type="button" onClick={() => setShowForm(false)}><X/></button>
              </div>
              <div className="space-y-4">
                <input required className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" placeholder="Nome Completo" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                <input className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black" placeholder="CPF (Apenas Números)" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <select className="bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                     {state.employeeRoles.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                   <input type="number" className="bg-slate-50 border p-4 rounded-2xl text-[10px] font-black" placeholder="Diária R$" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                </div>
                <input className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" placeholder="Chave PIX" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                <input className="w-full bg-slate-50 border p-4 rounded-2xl text-[10px] font-black uppercase" placeholder="Endereço Completo" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} />
              </div>
              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={16}/>}
                SALVAR NO CLOUD
              </button>
           </form>
        </div>
      )}
    </div>
  );
};
export default Employees;
