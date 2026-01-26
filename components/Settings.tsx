
import React from 'react';
import { AppState, ServiceType } from '../types';
import { Save, Info } from 'lucide-react';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Settings: React.FC<SettingsProps> = ({ state, setState }) => {
  const [tempRates, setTempRates] = React.useState(state.serviceRates);

  const handleRateChange = (type: ServiceType, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempRates(prev => ({ ...prev, [type]: numValue }));
  };

  const handleSave = () => {
    setState(prev => ({ ...prev, serviceRates: tempRates }));
    alert('Valores de unidade atualizados! Novos registros usarão estes valores.');
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
        <p className="text-slate-500">Defina os valores padrão para cada tipo de serviço.</p>
      </header>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-blue-700">
        <Info className="shrink-0" />
        <p className="text-sm">
          <strong>Atenção:</strong> Alterar estes valores não modifica registros de produção já existentes (histórico). 
          Os novos valores serão aplicados apenas para serviços adicionados a partir de agora.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <h3 className="font-bold text-lg text-slate-800">Tabela de Preços Atual (Valores de Unidade)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(ServiceType).map((type) => (
              <div key={type} className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">{type}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tempRates[type]}
                    onChange={(e) => handleRateChange(type, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
            >
              <Save size={20} />
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
