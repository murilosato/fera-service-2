
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { Users, UserPlus, X, ChevronRight, ChevronLeft, Edit2, Trash2, Loader2, Fingerprint, MapPin, CreditCard } from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface EmployeesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const Employees: React.FC<EmployeesProps> = ({ state, setState, notify }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const initialFormState = { 
    name: '', 
    role: '', 
    defaultValue: '80', 
    paymentModality: 'DIARIA', 
    cpf: '', 
    phone: '', 
    pixKey: '', 
    address: '' 
  };
  const [employeeForm, setEmployeeForm] = useState(initialFormState);

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const daysInMonth = useMemo(() => new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate(), [currentCalendarDate]);
  const calendarDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const handleToggleAttendance = async (empId: string, day: number) => {
    const year = currentCalendarDate.getFullYear();
    const month = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === dateStr);
    const employee = state.employees.find(e => e.id === empId);

    try {
      if (existing) {
        if (existing.status === 'present') {
           // Muda de Presente para Ausente (F)
           await dbSave('attendance_records', { 
             id: existing.id, 
             companyId: state.currentUser?.companyId,
             status: 'absent', 
             value: 0 
           });
           notify("Status: AUSENTE (F)");
        } else {
           // Se for Ausente, remove o registro (Limpa)
           await dbDelete('attendance_records', existing.id);
           notify("Registro Removido");
        }
      } else {
        // Se não existir, cria como Presente (P)
        await dbSave('attendance_records', {
          companyId: state.currentUser?.companyId,
          employeeId: empId,
          date: dateStr,
          status: 'present',
          value: employee?.defaultValue || 80,
          paymentStatus: 'pendente'
        });
        notify("Status: PRESENTE (P)");
      }
      await refreshData();
    } catch (e) {
      console.error(e);
      notify("Erro ao atualizar status", "error");
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name) return notify("Nome é obrigatório", "error");
    setIsLoading(true);
    try {
      await dbSave('employees', {
        companyId: state.currentUser?.companyId,
        name: employeeForm.name.toUpperCase(),
        role: employeeForm.role.toUpperCase(),
        paymentModality: employeeForm.paymentModality,
        defaultValue: parseFloat(employeeForm.defaultValue),
        cpf: employeeForm.cpf,
        phone: employeeForm.phone,
        pixKey: employeeForm.pixKey,
        address: employeeForm.address.toUpperCase(),
        status: 'active'
      });
      await refreshData();
      setShowAddForm(false);
      setEmployeeForm(initialFormState);
      notify("Colaborador Cadastrado");
    } catch (e: any) {
      notify("Erro no cadastro", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div><h2 className="text-xl font-black text-slate-900 uppercase">Equipe & RH</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Presença e Cadastros</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddForm(true)} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl">
            <UserPlus size={16} /> NOVO COLABORADOR
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18} /></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18} /></button>
          </div>
          <div className="text-[8px] font-black uppercase text-slate-400 flex gap-4">
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> P = Presente</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> F = Falta</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50"><th className="sticky left-0 z-10 bg-slate-50 p-4 text-left text-[9px] font-black uppercase text-slate-400 border-r min-w-[200px]">Colaborador</th>{calendarDays.map(day => <th key={day} className="p-2 text-center text-[9px] font-black text-slate-400 border-r min-w-[34px]">{day}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {state.employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/30">
                  <td className="sticky left-0 z-10 bg-white p-4 border-r">
                     <p className="text-[10px] font-black text-slate-800 uppercase truncate">{emp.name}</p>
                     <p className="text-[7px] text-slate-400 font-bold uppercase">{emp.role}</p>
                  </td>
                  {calendarDays.map(day => {
                    const year = currentCalendarDate.getFullYear();
                    const month = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
                    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
                    const att = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                    return (
                      <td key={day} className="p-0 border-r h-10">
                         <button 
                           onClick={() => handleToggleAttendance(emp.id, day)} 
                           className={`w-full h-full text-[9px] font-black transition-all ${att?.status === 'present' ? 'bg-emerald-500 text-white' : att?.status === 'absent' ? 'bg-rose-500 text-white' : 'hover:bg-slate-100 text-slate-300'}`}
                         >
                            {att?.status === 'present' ? 'P' : att?.status === 'absent' ? 'F' : '-'}
                         </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <h3 className="text-xs font-black text-slate-900 uppercase">Cadastro de Colaborador</h3>
                 <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">NOME COMPLETO</label><input required className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white" placeholder="DIGITE O NOME" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">CPF</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" placeholder="000.000.000-00" value={employeeForm.cpf} onChange={e => setEmployeeForm({...employeeForm, cpf: e.target.value})} /></div>
                   <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">TELEFONE</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" placeholder="(00) 00000-0000" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">FUNÇÃO</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white" placeholder="EX: AJUDANTE" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} /></div>
                   <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">VALOR DIÁRIA (R$)</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" type="number" placeholder="80.00" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} /></div>
                </div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">CHAVE PIX</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none focus:bg-white" placeholder="CHAVE PARA PAGAMENTO" value={employeeForm.pixKey} onChange={e => setEmployeeForm({...employeeForm, pixKey: e.target.value})} /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">ENDEREÇO RESIDENCIAL</label><input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white" placeholder="RUA, NÚMERO, BAIRRO" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} /></div>
                <button disabled={isLoading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'CONFIRMAR CADASTRO'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
