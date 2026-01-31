
import React, { useState, useMemo } from 'react';
import { AppState, Employee, AttendanceRecord } from '../types';
import { 
  Users, UserPlus, ToggleLeft, ToggleRight, Search, X, CalendarCheck, Calendar as CalendarIcon, ChevronRight, ChevronLeft, ClipboardList, Edit2, TrendingUp, Download, CheckCircle, XCircle, AlertCircle, CreditCard, FileSpreadsheet, Phone, MapPin, Fingerprint, Wallet, Clock, CheckCircle2
} from 'lucide-react';
import { dbSave, dbDelete, fetchCompleteCompanyData } from '../lib/supabase';

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
  const [isLoading, setIsLoading] = useState(false);
  
  const initialFormState = {
    name: '',
    role: '',
    rate: '80',
    modality: 'DIARIA' as 'DIARIA' | 'MENSAL',
    cpf: '',
    phone: '',
    pixKey: '',
    address: ''
  };

  const [employeeForm, setEmployeeForm] = useState(initialFormState);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const refreshData = async () => {
    if (state.currentUser?.companyId) {
      const data = await fetchCompleteCompanyData(state.currentUser.companyId);
      if (data) setState(prev => ({ ...prev, ...data }));
    }
  };

  const handleSaveEmployee = async () => {
    if (!employeeForm.name) return;
    setIsLoading(true);
    try {
      await dbSave('employees', {
        id: editingEmployeeId || undefined,
        company_id: state.currentUser?.companyId,
        name: employeeForm.name,
        role: employeeForm.role,
        payment_modality: employeeForm.modality,
        default_value: parseFloat(employeeForm.rate),
        cpf: employeeForm.cpf,
        phone: employeeForm.phone,
        pix_key: employeeForm.pixKey,
        address: employeeForm.address,
        status: 'active'
      });
      await refreshData();
      setShowAddForm(false);
      setEmployeeForm(initialFormState);
    } catch (e) {
      alert("Erro ao salvar funcionário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = async (empId: string, date: string) => {
    const existing = state.attendanceRecords.find(r => (r as any).employee_id === empId && (r as any).date === date);
    const employee = state.employees.find(e => e.id === empId);

    try {
      if (existing) {
        const nextStatus = existing.status === 'present' ? 'absent' : 'present';
        await dbSave('attendance_records', {
          id: existing.id,
          status: nextStatus,
          value: nextStatus === 'present' ? (employee as any).default_value : 0
        });
      } else {
        await dbSave('attendance_records', {
          company_id: state.currentUser?.companyId,
          employee_id: empId,
          date,
          status: 'present',
          value: (employee as any).default_value || 80,
          payment_status: 'pendente'
        });
      }
      await refreshData();
    } catch (e) {
      alert("Erro ao registrar presença.");
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Gestão de Equipe</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Conectado ao Banco Cloud</p>
        </div>
        <button onClick={() => { setEditingEmployeeId(null); setEmployeeForm(initialFormState); setShowAddForm(true); }} className="bg-blue-600 text-white p-3 rounded-2xl shadow-md"><UserPlus size={20} /></button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button onClick={() => setViewMode('calendar')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Calendário</button>
          <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Equipe</button>
      </div>

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.employees.map(emp => (
            <div key={emp.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex flex-col group shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">{emp.name.charAt(0)}</div>
                  <button onClick={() => {
                    setEditingEmployeeId(emp.id);
                    setEmployeeForm({
                      name: emp.name,
                      role: emp.role || '',
                      rate: (emp as any).default_value?.toString() || '0',
                      modality: (emp as any).payment_modality || 'DIARIA',
                      cpf: (emp as any).cpf || '',
                      phone: (emp as any).phone || '',
                      pixKey: (emp as any).pix_key || '',
                      address: (emp as any).address || ''
                    });
                    setShowAddForm(true);
                  }} className="p-2 text-slate-300 hover:text-blue-600 rounded-xl"><Edit2 size={18} /></button>
               </div>
               <h3 className="text-sm font-black text-slate-800 uppercase truncate">{emp.name}</h3>
               <p className="text-[9px] text-slate-400 font-black uppercase mb-1">{(emp as any).payment_modality}</p>
               <p className="text-xs font-black text-slate-600">R$ {formatMoney((emp as any).default_value || 0)}</p>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase">Colaborador</h3><button onClick={() => setShowAddForm(false)}><X /></button></div>
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                   <button onClick={() => setEmployeeForm({...employeeForm, modality: 'DIARIA'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.modality === 'DIARIA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Diária</button>
                   <button onClick={() => setEmployeeForm({...employeeForm, modality: 'MENSAL'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${employeeForm.modality === 'MENSAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mensal</button>
                </div>
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none" placeholder="Nome Completo" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none" placeholder="Valor (R$)" type="number" value={employeeForm.rate} onChange={e => setEmployeeForm({...employeeForm, rate: e.target.value})} />
                <button disabled={isLoading} onClick={handleSaveEmployee} className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {isLoading ? 'SALVANDO...' : 'SALVAR NO SUPABASE'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
