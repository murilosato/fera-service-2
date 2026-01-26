
import { AppState, ServiceType, UserRole } from './types';

export const INITIAL_STATE: AppState = {
  areas: [
    {
      id: 'a1',
      name: 'OS-001',
      startDate: '2024-03-01',
      startReference: 'Trevo de Entrada',
      endReference: 'Posto de Gasolina Shell',
      observations: 'Trecho de alta visibilidade',
      services: [
        {
          id: 's1',
          areaId: 'a1',
          type: ServiceType.ROCADA_TRATOR_M2,
          areaM2: 5000,
          unitValue: 1.5,
          totalValue: 7500,
          serviceDate: '2024-03-01'
        }
      ]
    }
  ],
  employees: [
    { id: 'e1', name: 'João Silva', role: 'Operador de Roçadeira', status: 'active', defaultDailyRate: 85.00 },
    { id: 'e2', name: 'Maria Santos', role: 'Ajudante Geral', status: 'active', defaultDailyRate: 75.00 }
  ],
  attendanceRecords: [],
  productionRecords: [],
  inventory: [
    { id: 'i1', name: 'Fio de Nylon', category: 'insumos', currentQty: 10, minQty: 5, unitValue: 45.0 },
    { id: 'i2', name: 'Óleo 2T', category: 'insumos', currentQty: 3, minQty: 10, unitValue: 35.0 }
  ],
  inventoryExits: [],
  cashIn: [
    { id: 'c1', date: '2024-03-05', value: 15000, reference: 'Fatura Fevereiro', type: '1ª parcela' }
  ],
  cashOut: [
    { id: 'o1', date: '2024-03-02', value: 2000, type: 'Pagamento Funcionários' }
  ],
  monthlyGoalM2: 50000,
  serviceRates: {
    [ServiceType.VARRICAO_KM]: 150.00,
    [ServiceType.CAPINA_MANUAL_M2]: 2.50,
    [ServiceType.ROCADA_MECANIZADA_M2]: 1.80,
    [ServiceType.ROCADA_TRATOR_M2]: 0.90,
    [ServiceType.BOCA_DE_LOBO]: 45.00,
    [ServiceType.PINTURA_MEIO_FIO]: 1.20,
  },
  currentUser: null,
  users: [
    {
      id: 'master-1',
      email: 'admin@feraservice.com',
      name: 'Diretoria Master',
      role: UserRole.MASTER,
      status: 'active',
      permissions: {
        production: true,
        finance: true,
        inventory: true,
        employees: true,
        analytics: true,
        ai: true
      }
    }
  ]
};

export const SERVICE_OPTIONS = Object.values(ServiceType);
