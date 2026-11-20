// ============================================================================
// MOHAMED RAMSHAN - BARBER SHOP MANAGEMENT SYSTEM
// Simple, Focused & Robust Data Models (Core Salon Essentials)
// ============================================================================

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  pinCode: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  pinCode: string;
  isActive: boolean;
  joinDate: string;
}

export interface ServiceType {
  id: string;
  name: string;
  defaultPrice: number;
}

export interface CustomerOperation {
  id: string;
  operationNumber: string; // e.g. OP-1001
  employeeId: string;
  employeeName: string;
  serviceName: string;
  amount: number;
  notes?: string;
  createdAt: string; // ISO string
  isModifiedByAdmin?: boolean;
  adminModificationNote?: string;
}

export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'PARTIALLY_REPAID' | 'REPAID';

export interface Advance {
  id: string;
  advanceNumber: string; // e.g. ADV-01
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  status: AdvanceStatus;
  repaidAmount: number;
  remainingAmount: number;
  createdAt: string;
  decisionNote?: string;
  repaymentHistory?: Array<{
    amount: number;
    date: string;
    note?: string;
  }>;
}

export interface ShopSettings {
  shopName: string;
  shopSubtitle: string;
  phone: string;
  currency: string;
}

export interface ShiftLog {
  id: string; // uuid
  employeeId: string;
  employeeName: string;
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp, optional until logout
}

export interface ShopExpense {
  id: string;
  expenseNumber: string; // e.g. EXP-01
  itemName: string; // اسم الصنف أو المستلزمات
  amount: number; // المبلغ المدفوع
  quantity?: string; // الكمية أو العدد (علبة، كرتونة، عدد 5...)
  category?: string; // تصنيف المصروف (مستلزمات حلاقة، ضيافة ونظافة، صيانة وفواتير، أخرى)
  recordedByUserId: string;
  recordedByName: string; // اسم الموظف أو الأدمن اللي اشترى وسجل
  notes?: string;
  createdAt: string; // ISO timestamp
}

export interface DatabaseSchema {
  version: number;
  settings: ShopSettings;
  users: User[];
  employees: Employee[];
  services: ServiceType[];
  operations: CustomerOperation[];
  advances: Advance[];
  /** New collection for shift tracking */
  shiftLogs: ShiftLog[];
  /** New collection for shop expenses and supplies */
  expenses: ShopExpense[];
}
