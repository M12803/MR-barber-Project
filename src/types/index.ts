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

export interface DatabaseSchema {
  version: number;
  settings: ShopSettings;
  users: User[];
  employees: Employee[];
  services: ServiceType[];
  operations: CustomerOperation[];
  advances: Advance[];
}
