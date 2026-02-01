
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Save, Fingerprint, Smartphone, MapPin, CreditCard } from 'lucide-react';
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
          // Muda para ausente (Falta)
          await dbSave('attendance_records', { ...existing, status: 'absent', value: 0 });
        } else {
          // Remove o registro (vazio)
          await dbDelete('attendance_records', existing.id);
        }
      } else {
        // Cria como presente (P)
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
    } catch (e) { notify("Erro ao sincronizar presença", "error"); }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name) return notify("Nome completo é obrigatório", "error");
    
    // Validação de CPF Único
    if (employeeForm.cpf) {
      const isDuplicate = state.employees.some(emp => emp.cpf === employeeForm.cpf && emp.id !== editingId);
      if (isDuplicate) return notify("Erro: Este CPF já pertence a outro colaborador.", "error");
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
      setEmployeeForm(initialFormState);
      notify(editingId ? "Cadastro atualizado com sucesso" : "Novo colaborador integrado ao sistema");
    } catch (e: any) { notify("Falha na sincronização cloud", "error"); } finally { setIsLoading(false); }
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

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Equipe & RH</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Controle de Frequência e Dados Cadastrais</p>
        </div>
        <button onClick={() => { setEditingId(null); setEmployeeForm(initialFormState); setShowForm(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 tracking-[0.2em] hover:bg-blue-600 transition-all">
           <UserPlus size={16} /> NOVO COLABORADOR
        </button>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
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
                <th className="sticky left-0 bg-slate-50 p-4 text-left text-[9px] font-black text-slate-400 uppercase border-r min-w-[220px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Nome do Colaborador</th>
                {calendarDays.map(day => <th key={day} className="p-2 text-center text-[9px] font-black text-slate-400 border-r min-w-[34px]">{day}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="sticky left-0 bg-white p-4 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-800 truncate">{emp.name}</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{emp.role}</p>
                      </div>
                      <button onClick={() => handleEdit(emp)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={12}/></button>
                    </div>
                  </td>
                  {calendarDays.map(day => {
                    const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const att = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                    return (
                      <td 
                        key={day} 
                        onClick={() => handleToggleAttendance(emp.id, dateStr)}
                        className={`p-0 border-r h-12 text-center text-[9px] font-black cursor-pointer transition-all hover:brightness-95 ${att?.status === 'present' ? 'bg-emerald-500 text-white' : att?.status === 'absent' ? 'bg-rose-500 text-white' : 'text-slate-200 hover:bg-slate-100'}`}
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveEmployee} className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-8 shadow-2xl animate-in zoom-in-95 border border-slate-100 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{editingId ? 'Editar Colaborador' : 'Novo Perfil de Equipe'}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronização Cloud em tempo real</p>
                 </div>
                 <button type="button" onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-300"><X size={20}/></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">NOME COMPLETO *</label>
                   <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" size={16}/>
                      <input required className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-slate-900 transition-all" placeholder="DIGITE O NOME" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">CPF *</label>
                      <div className="relative group">
                         <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                         <input required className="w-full bg-slate-50 border border-slate-200 pl-11 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="APENAS NÚMEROS" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">TELEFONE</label>
                      <div className="relative group">
                         <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                         <input className="w-full bg-slate-50 border border-slate-200 pl-11 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="(00) 00000-0000" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">CARGO / FUNÇÃO *</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                         {state.employeeRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">VALOR DIÁRIA (R$)</label>
                      <div className="relative group">
                         <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="0.00" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">CHAVE PIX (PARA PAGAMENTOS)</label>
                   <div className="relative group">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black outline-none focus:bg-white" placeholder="CHAVE PIX OU CONTA" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">ENDEREÇO RESIDENCIAL</label>
                   <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                      <input className="w-full bg-slate-50 border border-slate-200 pl-12 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white" placeholder="CIDADE / BAIRRO / LOGRADOURO" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                 <button disabled={isLoading} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-emerald-600">
                   {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18}/>}
                   {editingId ? 'ATUALIZAR DADOS CADASTRAIS' : 'FINALIZAR CADASTRO NO CLOUD'}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
export default Employees;
