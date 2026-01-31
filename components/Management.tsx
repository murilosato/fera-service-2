import React, { useState, useEffect } from 'react';
import { AppState, User, UserRole, UserPermissions } from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  Lock, 
  User as UserIcon,
  X,
  Settings,
  Building,
  ToggleLeft,
  ToggleRight,
  Circle,
  ChevronDown,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Management: React.FC<ManagementProps> = ({ state, setState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'companies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  
  const [companiesList, setCompaniesList] = useState<any[]>([]);

  const isMaster = state.currentUser?.role === UserRole.MASTER;

  useEffect(() => {
    if (isMaster) {
      fetchCompanies();
    }
  }, [isMaster]);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*');
    if (data) setCompaniesList(data);
  };

  // Fixed TypeScript error: Specified HTMLFormElement for the form event to access 'elements'
  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = (e.currentTarget.elements.namedItem('compName') as HTMLInputElement).value;
    const { data, error } = await supabase.from('companies').insert([{ name }]).select();
    if (!error) {
      fetchCompanies();
      setShowAddCompany(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gestão de Infraestrutura</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Controle Multi-Empresa e Acessos</p>
        </div>
        <div className="flex gap-2">
           {isMaster && (
             <button 
               onClick={() => setShowAddCompany(true)}
               className="bg-emerald-600 text-white px-5 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
             >
               <Building size={16} /> NOVA EMPRESA
             </button>
           )}
           <button 
             onClick={() => setShowAddUser(true)}
             className="bg-slate-900 text-white px-5 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
           >
             <UserPlus size={16} /> NOVO ACESSO
           </button>
        </div>
      </header>

      {isMaster && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveSubTab('companies')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'companies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Empresas
          </button>
        </div>
      )}

      {activeSubTab === 'users' ? (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          {/* Tabela de usuários conforme antes, mas populada do state.users atualizado pelo sync */}
          <div className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
             Gerencie aqui os acessos da unidade. Novos usuários devem ser convidados via Supabase Auth.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companiesList.map(comp => (
            <div key={comp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Empresa Ativa</p>
                  <h3 className="text-sm font-black text-slate-800 uppercase">{comp.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold">ID: {comp.id.slice(0,8)}...</p>
               </div>
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Building size={20} />
               </div>
            </div>
          ))}
        </div>
      )}

      {showAddCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleAddCompany} className="bg-white rounded-[32px] w-full max-w-sm p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-xs">Registrar Unidade</h3>
                <button type="button" onClick={() => setShowAddCompany(false)}><X size={20} /></button>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Nome da Empresa</label>
                <input name="compName" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs outline-none focus:border-emerald-500" placeholder="Ex: Fera Service - SP" />
              </div>
              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">CRIAR EMPRESA NO BANCO</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Management;