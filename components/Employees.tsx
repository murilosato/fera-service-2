
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
    if (emp.status === 'inactive') return notify("Não é possível lançar frequência para inativos", "error");

    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === date);

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
      } else {
        await dbDelete('attendance_records', existing.id);
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
    
    // Verificação de CPF duplicado
    const cleanCpf = employeeForm.cpf.replace(/\D/g, '');
    if (cleanCpf) {
      const duplicate = state.employees.find(emp => 
        emp.id !== editingId && 
        emp.cpf?.replace(/\D/g, '') === cleanCpf
      );
      if (duplicate) {
        return notify(`Erro: O CPF ${employeeForm.cpf} já está cadastrado para o colaborador: ${duplicate.name}`, "error");
      }
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
        status: editingId ? (state.employees.find(e => e.id === editingId)?.status || 'active') : 'active'
      });
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      setEmployeeForm(initialFormState);
      notify(editingId ? "Cadastro atualizado" : "Novo colaborador integrado");
    } catch (e: any) { 
      console.error(e);
      notify("Falha na sincronização com o banco de dados", "error"); 
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
      address: emp.address || ''
    });
    setShowForm(true);
  };

  const daysInMonth = useMemo(() => new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate(), [currentCalendarDate]);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const filteredEmployees = state.employees.filter(e => showInactive || e.status === 'active');

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
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded" /><span className="text-[8px] font-black text-slate-400 uppercase">Presente</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-amber-500 rounded" /><span className="text-[8px] font-black text-slate-400 uppercase">Meia Diária</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-500 rounded" /><span className="text-[8px] font-black text-slate-400 uppercase">Falta</span></div>
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
                        <p className={`text-[10px] font-black uppercase truncate ${emp.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{emp.name}</p>
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
                    
                    let bgColor = 'text-slate-200 hover:bg-slate-100';
                    let statusLabel = '-';
                    
                    if (att?.status === 'present') {
                        bgColor = 'bg-emerald-500 text-white';
                        statusLabel = 'P';
                    } else if (att?.status === 'partial') {
                        bgColor = 'bg-amber-500 text-white';
                        statusLabel = 'H';
                    } else if (att?.status === 'absent') {
                        bgColor = 'bg-rose-500 text-white';
                        statusLabel = 'F';
                    } else if (isToday) {
                        bgColor = 'bg-slate-100 border-x-2 border-slate-900';
                    }

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleToggleAttendance(emp.id, dateStr)}
                        className={`p-0 border-r h-12 text-center text-[9px] font-black transition-all cursor-pointer ${bgColor}`}
                      >
                        {statusLabel}
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
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-md p-8 md:p-10 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-6">
                 <h3 className="text-sm font-black uppercase text-slate-900">{editingId ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                 <button type="button" onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={24}/></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Nome Completo</label>
                   <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900" placeholder="NOME DO COLABORADOR" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">CPF</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="000.000.000-00" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Telefone</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="(00) 00000-0000" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Função</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                         {state.employeeRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Valor Diária (R$)</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Chave PIX</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="E-MAIL, CPF OU TELEFONE" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                </div>
              </div>

              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                SALVAR CADASTRO
              </button>
           </form>
        </div>
      )}
    </div>
  );
};
export default Employees;
