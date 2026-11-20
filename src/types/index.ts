// ============================================================================
// MOHAMED RAMSHAN - BARBER SHOP MANAGEMENT SYSTEM
// Domain Types & Data Contracts
// ============================================================================

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type EmploymentStatus = 'ACTIVE' | 'INACTIVE';

export type PaymentMethod = 'CASH' | 'CARD' | 'INSTAPAY' | 'VODAFONE_CASH' | 'OTHER';

export type CompensationType = 
  | 'PERCENTAGE'            // نسبة مئوية من قيمة الخدمات
  | 'FIXED_PER_SERVICE'     // مبلغ ثابت لكل خدمة
  | 'FIXED_SALARY'          // راتب ثابت شهري/أسبوعي
  | 'SALARY_PLUS_COMMISSION'; // راتب ثابت + نسبة مئوية

export type CommissionBasis = 'LIST_PRICE' | 'COLLECTED_AMOUNT' | 'DISCOUNTED_VALUE';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  employeeId?: string; // Linked employee profile if role is EMPLOYEE
  pinCode: string;     // Hashed or 4-digit PIN for quick switch
  isActive: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface EmployeeCompensationRule {
  type: CompensationType;
  rateOrAmount: number;         // e.g. 40 for 40% or 50 for 50 EGP per service
  baseSalary?: number;          // If SALARY_PLUS_COMMISSION or FIXED_SALARY
  commissionBasis: CommissionBasis;
  effectiveFrom: string;
}

export interface Employee {
  id: string;
  code: string;                 // e.g. EMP-01
  fullName: string;
  phone?: string;
  roleTitle: string;            // e.g. "حلاق رئيسي", "مصفف شعر", "أخصائي عناية"
  status: EmploymentStatus;
  compensationRule: EmployeeCompensationRule;
  joinDate: string;
  avatarColor?: string;
  customFields?: Record<string, any>;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultPrice: number;        // In EGP
  defaultCommissionRate?: number; // Optional specific commission rate
  estimatedDurationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}

export type TransactionStatus = 'COMPLETED' | 'CORRECTION_PENDING' | 'VOIDED' | 'ADJUSTED';

export interface TransactionLineItem {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  discount: number;
  finalPrice: number;
  commissionEarned: number;
}

export interface Transaction {
  id: string;
  ticketNumber: string;        // e.g. MR-20261119-001
  employeeId: string;
  employeeName: string;
  createdById: string;
  shiftId?: string;
  customerName?: string;
  customerPhone?: string;
  items: TransactionLineItem[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  collectedAmount: number;
  amountReceived?: number;     // المبلغ المستلم من العميل (المدفوع نقداً)
  changeAmount?: number;       // الباقي للعميل
  outstandingAmount?: number;  // المبلغ المتبقي على العميل (في حال الدفع الجزئي)
  paymentMethod: PaymentMethod;
  notes?: string;
  status: TransactionStatus;
  createdAt: string;
  idempotencyKey?: string;
  // Snapshots
  commissionSnapshot: {
    ruleType: CompensationType;
    rateOrAmount: number;
    totalCommission: number;
  };
}

export type AdvanceStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'PARTIALLY_REPAID'
  | 'SETTLED';

export interface AdvanceInstallment {
  id: string;
  advanceId: string;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  isPaid: boolean;
}

export interface AdvanceRepayment {
  id: string;
  advanceId: string;
  employeeId: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  recordedByAdminId: string;
  notes?: string;
}

export interface AdvanceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  reason: string;
  status: AdvanceStatus;
  requestDate: string;
  decisionDate?: string;
  decisionByAdminId?: string;
  decisionNotes?: string;
  disbursementDate?: string;
  disbursementMethod?: PaymentMethod;
  remainingBalance: number;
  installments?: AdvanceInstallment[];
  repayments?: AdvanceRepayment[];
}

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  declaredClosingCash?: number;
  expectedCash?: number;
  variance?: number; // declared - expected
  status: ShiftStatus;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  description: string;
  createdById: string;
  createdByName: string;
  receiptReference?: string;
}

export type CashboxMovementType = 
  | 'SERVICE_INFLOW'
  | 'ADVANCE_OUTFLOW'
  | 'ADVANCE_REPAYMENT_INFLOW'
  | 'EXPENSE_OUTFLOW'
  | 'OWNER_DEPOSIT'
  | 'OWNER_WITHDRAWAL'
  | 'SHIFT_ADJUSTMENT';

export interface CashboxEntry {
  id: string;
  timestamp: string;
  type: CashboxMovementType;
  amount: number; // Positive for inflow, negative for outflow
  runningBalance: number;
  sourceReference: string; // e.g. Ticket number, Advance ID, Expense ID
  recordedById: string;
  description: string;
}

export type CorrectionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CorrectionRequest {
  id: string;
  transactionId: string;
  ticketNumber: string;
  employeeId: string;
  employeeName: string;
  requestReason: string;
  requestedAt: string;
  status: CorrectionRequestStatus;
  adminDecisionReason?: string;
  decidedAt?: string;
  decidedByAdminId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'TRANSACTION' | 'ADVANCE' | 'EXPENSE' | 'SHIFT' | 'EMPLOYEE' | 'SERVICE' | 'SETTING' | 'AUTH';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface ShopSettings {
  shopName: string;
  shopSubtitle: string;
  tagline: string;
  phone: string;
  address: string;
  currency: string;
  taxNumber?: string;
  logoUrl?: string;
  inactivityLockMinutes: number;
  receiptHeader: string;
  receiptFooter: string;
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  trackShifts: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface DatabaseSchema {
  version: number;
  lastBackupDate?: string;
  settings: ShopSettings;
  users: User[];
  employees: Employee[];
  serviceCategories: ServiceCategory[];
  services: ServiceItem[];
  transactions: Transaction[];
  advanceRequests: AdvanceRequest[];
  shifts: Shift[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  cashboxLedger: CashboxEntry[];
  correctionRequests: CorrectionRequest[];
  auditLogs: AuditLogEntry[];
}
