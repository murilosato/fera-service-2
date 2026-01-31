
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { 
  Users, UserPlus, Search, X, Calendar as CalendarIcon, ChevronRight, ChevronLeft, 
  Edit2, CheckCircle2, XCircle, Trash2, Loader2, MoreHorizontal
} from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

interface EmployeesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Employees: React.FC<EmployeesProps> = ({ state, setState }) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const initialFormState = {
    name: '',
    role: '',
    defaultValue: '80',
    paymentModality: 'DIARIA' as 'DIARIA' | 'MENSAL',
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

  const daysInMonth = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentCalendarDate]);

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const handleSaveEmployee = async () => {
    if (!employeeForm.name) return;
    setIsLoading(true);
    try {
      await dbSave('employees', {
        id: editingEmployeeId || undefined,
        company_id: state.currentUser?.companyId,
        name: employeeForm.name,
        role: employeeForm.role,
        payment_modality: employeeForm.paymentModality,
        default_value: parseFloat(employeeForm.defaultValue),
        cpf: employeeForm.cpf,
        phone: employeeForm.phone,
        pix_key: employeeForm.pixKey,
        address: employeeForm.address,
        status: 'active'
      });
      await refreshData();
      setShowAddForm(false);
      setEmployeeForm(initialFormState);
      setEditingEmployeeId(null);
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = async (empId: string, day: number) => {
    const year = currentCalendarDate.getFullYear();
    const month = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    
    const existing = state.attendanceRecords.find(r => r.employeeId === empId && r.date === dateStr);
    const employee = state.employees.find(e => e.id === empId);

    try {
      if (existing) {
        if (existing.status === 'present') {
           await dbSave('attendance_records', { id: existing.id, status: 'absent', value: 0 });
        } else {
           await dbDelete('attendance_records', existing.id);
        }
      } else {
        await dbSave('attendance_records', {
          company_id: state.currentUser?.companyId,
          employee_id: empId,
          date: dateStr,
          status: 'present',
          value: employee?.defaultValue || 80,
          payment_status: 'pendente'
        });
      }
      await refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEmployees = state.employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Gestão de Equipe</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Frequência Diária e Cadastro</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Calendário</button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Lista</button>
          </div>
          <button onClick={() => { setEditingEmployeeId(null); setEmployeeForm(initialFormState); setShowAddForm(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2">
            <UserPlus size={16} /> Novo
          </button>
        </div>
      </header>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18} /></button>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
                {currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </h3>
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18} /></button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Presente</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Falta</span></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 p-4 text-left text-[9px] font-black uppercase text-slate-400 border-r border-slate-100 min-w-[200px]">Colaborador</th>
                  {calendarDays.map(day => (
                    <th key={day} className="p-2 text-center text-[9px] font-black text-slate-400 border-r border-slate-100 min-w-[36px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-4 border-r border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">{emp.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-800 uppercase truncate">{emp.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{emp.role}</p>
                          </div>
                       </div>
                    </td>
                    {calendarDays.map(day => {
                      const year = currentCalendarDate.getFullYear();
                      const month = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
                      const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
                      const attendance = state.attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
                      
                      return (
                        <td key={day} className="p-0 border-r border-slate-100 h-10">
                           <button 
                            onClick={() => handleToggleAttendance(emp.id, day)}
                            className={`w-full h-full flex items-center justify-center transition-all ${
                              attendance?.status === 'present' ? 'bg-emerald-500 text-white' : 
                              attendance?.status === 'absent' ? 'bg-rose-500 text-white' : 
                              'hover:bg-slate-100'
                            }`}
                           >
                              {attendance?.status === 'present' ? 'P' : attendance?.status === 'absent' ? 'F' : ''}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col group hover:border-blue-500 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">{emp.name.charAt(0)}</div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => {
                      setEditingEmployeeId(emp.id);
                      setEmployeeForm({
                        name: emp.name,
                        role: emp.role || '',
                        defaultValue: emp.defaultValue.toString(),
                        paymentModality: emp.paymentModality as 'DIARIA' | 'MENSAL',
                        cpf: emp.cpf || '',
                        phone: emp.phone || '',
                        pixKey: emp.pixKey || '',
                        address: emp.address || ''
                      });
                      setShowAddForm(true);
                    }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                  </div>
               </div>
               <h3 className="text-sm font-black text-slate-900 uppercase truncate">{emp.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 mb-4">{emp.role || 'Sem Cargo'}</p>
               
               <div className="mt-auto pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor Diária</p>
                    <p className="text-xs font-black text-slate-700">{formatMoney(emp.defaultValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modalidade</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase">{emp.paymentModality}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Colaborador</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cadastro no Banco Central</p>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X /></button>
              </div>
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                   <button onClick={() => setEmployeeForm({...employeeForm, paymentModality: 'DIARIA'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentModality === 'DIARIA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Diária</button>
                   <button onClick={() => setEmployeeForm({...employeeForm, paymentModality: 'MENSAL'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.paymentModality === 'MENSAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mensal</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                    <input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cargo/Função</label>
                    <input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor Diária (R$)</label>
                    <input className="w-full bg-slate-50 border p-4 rounded-2xl font-black text-xs outline-none" type="number" value={employeeForm.defaultValue} onChange={e => setEmployeeForm({...employeeForm, defaultValue: e.target.value})} />
                  </div>
                </div>
                <button disabled={isLoading} onClick={handleSaveEmployee} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex justify-center items-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'EFETIVAR CADASTRO'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
