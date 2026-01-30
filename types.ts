
export enum ServiceType {
  VARRICAO_KM = 'Varrição (KM)',
  CAPINA_MANUAL_M2 = 'C. Manual (m²)',
  ROCADA_MECANIZADA_M2 = 'Roçada Meq (m²)',
  ROCADA_TRATOR_M2 = 'Roç. c/ Trator (m²)',
  BOCA_DE_LOBO = 'Boca de Lobo',
  PINTURA_MEIO_FIO = 'Pint. Meio Fio'
}

export enum UserRole {
  MASTER = 'DIRETORIA_MASTER',
  ADMIN = 'GERENTE_UNIDADE',
  OPERATIONAL = 'OPERACIONAL'
}

export interface UserPermissions {
  production: boolean;
  finance: boolean;
  inventory: boolean;
  employees: boolean;
  analytics: boolean;
  ai: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  companyId?: string;
  status: 'ativo' | 'suspenso';
  permissions: UserPermissions;
}

export interface Area {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  startReference: string;
  endReference: string;
  observations: string;
  services: Service[];
}

export interface Service {
  id: string;
  areaId: string;
  type: ServiceType;
  areaM2: number;
  unitValue: number;
  totalValue: number;
  serviceDate: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  defaultDailyRate?: number;
  cpf?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  paymentType?: 'pix' | 'bank';
  pixKey?: string;
  bankAccount?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  value: number;
  status: 'present' | 'absent';
  paymentStatus?: 'pago' | 'pendente';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'peças' | 'insumos' | 'EPIs' | 'outros';
  currentQty: number;
  minQty: number;
  unitValue?: number;
}

export interface InventoryExit {
  id: string;
  itemId: string;
  quantity: number;
  date: string;
  destination: string;
  observation: string;
}

export interface CashIn {
  id: string;
  date: string;
  value: number;
  reference: string;
  type: string;
}

export interface CashOut {
  id: string;
  date: string;
  value: number;
  type: string;
  proofUrl?: string;
}

export interface AppState {
  areas: Area[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  inventory: InventoryItem[];
  inventoryExits: InventoryExit[];
  cashIn: CashIn[];
  cashOut: CashOut[];
  monthlyGoalM2: number;
  monthlyGoalRevenue: number; // Nova propriedade
  serviceRates: Record<ServiceType, number>;
  serviceGoals: Record<ServiceType, number>;
  financeCategories: string[];
  currentUser: User | null;
  users: User[];
}
