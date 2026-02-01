
export enum ServiceType {
  VARRICAO_KM = 'Varrição (KM)',
  CAPINA_MANUAL_M2 = 'C. Manual (m²))',
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

export interface Company {
  id: string;
  name: string;
  plan: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  companyId: string | null;
  status: 'ativo' | 'suspenso';
  permissions: UserPermissions;
  company?: Company;
}

export interface Area {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate?: string;
  startReference: string;
  endReference: string;
  observations: string;
  status: 'executing' | 'finished';
  services: Service[];
}

export interface Service {
  id: string;
  companyId: string;
  areaId: string;
  type: ServiceType;
  areaM2: number;
  unitValue: number;
  totalValue: number;
  service_date: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  defaultValue: number;
  paymentModality: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  address?: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent';
  value: number;
  paymentStatus: string;
}

export interface CashIn {
  id: string;
  companyId: string;
  date: string;
  value: number;
  reference: string;
  type: string;
  category: string;
}

export interface CashOut {
  id: string;
  companyId: string;
  date: string;
  value: number;
  type: string;
  reference: string;
  category: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  currentQty: number;
  minQty: number;
  unitValue?: number;
}

export interface InventoryExit {
  id: string;
  companyId: string;
  itemId: string;
  quantity: number;
  date: string;
  destination: string;
  observation: string;
}

export interface MonthlyGoal {
  production: number;
  revenue: number;
  inventory: number;
  finance: number;
}

export interface AppState {
  areas: Area[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  inventory: InventoryItem[];
  inventoryExits: InventoryExit[];
  cashIn: CashIn[];
  cashOut: CashOut[];
  monthlyGoals: Record<string, MonthlyGoal>;
  serviceRates: Record<ServiceType, number>;
  serviceGoals: Record<ServiceType, number>;
  financeCategories: string[];
  inventoryCategories: string[];
  employeeRoles: string[];
  currentUser: User | null;
  users: User[];
  isSyncing?: boolean;
}
