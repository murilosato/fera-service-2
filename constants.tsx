
import { AppState, ServiceType, UserRole } from './types';

export const INITIAL_STATE: AppState = {
  areas: [],
  employees: [
    { id: 'e1', companyId: 'fera-main', name: 'João Silva', role: 'Operador de Roçadeira', status: 'active', defaultValue: 85.00, paymentModality: 'DIARIA' },
    { id: 'e2', companyId: 'fera-main', name: 'Maria Santos', role: 'Ajudante Geral', status: 'active', defaultValue: 75.00, paymentModality: 'DIARIA' }
  ],
  attendanceRecords: [],
  inventory: [
    // Fix: Added missing required property 'idealQty' to match InventoryItem interface
    { id: 'i1', companyId: 'fera-main', name: 'Fio de Nylon', category: 'insumos', currentQty: 10, minQty: 5, idealQty: 20, unitValue: 45.0 },
    // Fix: Added missing required property 'idealQty' to match InventoryItem interface
    { id: 'i2', companyId: 'fera-main', name: 'Óleo 2T', category: 'insumos', currentQty: 3, minQty: 10, idealQty: 15, unitValue: 35.0 }
  ],
  inventoryExits: [],
  cashIn: [],
  cashOut: [],
  monthlyGoals: {
    [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`]: {
      production: 50000,
      revenue: 100000,
      inventory: 1000,
      finance: 20000
    }
  },
  serviceRates: {
    [ServiceType.VARRICAO_KM]: 150.00,
    [ServiceType.CAPINA_MANUAL_M2]: 2.50,
    [ServiceType.ROCADA_MECANIZADA_M2]: 1.80,
    [ServiceType.ROCADA_TRATOR_M2]: 0.90,
    [ServiceType.BOCA_DE_LOBO]: 45.00,
    [ServiceType.PINTURA_MEIO_FIO]: 1.20,
  },
  serviceGoals: {
    [ServiceType.VARRICAO_KM]: 500,
    [ServiceType.CAPINA_MANUAL_M2]: 10000,
    [ServiceType.ROCADA_MECANIZADA_M2]: 20000,
    [ServiceType.ROCADA_TRATOR_M2]: 30000,
    [ServiceType.BOCA_DE_LOBO]: 100,
    [ServiceType.PINTURA_MEIO_FIO]: 5000,
  },
  financeCategories: ['Salários', 'Insumos', 'Manutenção', 'Impostos', 'Aluguel', 'Combustível'],
  // Fix: Adicionado propriedades faltantes exigidas pela interface AppState
  inventoryCategories: ['Insumos', 'Equipamentos', 'Manutenção', 'EPIS'],
  employeeRoles: ['Operador de Roçadeira', 'Ajudante Geral', 'Motorista', 'Encarregado'],
  currentUser: null,
  users: [
    {
      id: 'master-1',
      companyId: 'fera-main',
      email: 'admin@feraservice.com',
      name: 'Diretoria Master',
      role: UserRole.MASTER,
      status: 'ativo',
      // Fix: Adicionado a permissão 'ai' que estava faltando conforme a interface UserPermissions
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
