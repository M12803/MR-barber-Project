import { dbStorage } from '../lib/db/storage';
import {
  Transaction,
  TransactionLineItem,
  PaymentMethod,
  User,
  CorrectionRequest,
} from '../types';
import { generateId, generateTicketNumber } from '../lib/utils';
import { auditService } from './auditService';

export interface CreateTransactionInput {
  employeeId: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    serviceId: string;
    unitPrice: number;
    discount?: number;
  }>;
  discountTotal?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  shiftId?: string;
}

export const transactionService = {
  createTransaction(input: CreateTransactionInput, currentUser: User): Transaction {
    const db = dbStorage.getDb();
    const employee = db.employees.find(e => e.id === input.employeeId);
    if (!employee) {
      throw new Error('لم يتم العثور على الموظف المحدد');
    }

    // Determine sequence number for today
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todaysTransactions = db.transactions.filter(t => 
      t.ticketNumber.includes(`MR-${todayStr}`)
    );
    const nextSeq = todaysTransactions.length + 1;
    const ticketNumber = generateTicketNumber(nextSeq);

    // Calculate line items with snapshot commissions
    const rule = employee.compensationRule;
    let computedGross = 0;
    let computedDiscounts = input.discountTotal || 0;

    const lineItems: TransactionLineItem[] = input.items.map(item => {
      const srv = db.services.find(s => s.id === item.serviceId);
      const serviceName = srv ? srv.name : 'خدمة مخصصة';
      const unitPrice = item.unitPrice;
      const discount = item.discount || 0;
      const finalPrice = Math.max(0, unitPrice - discount);

      computedGross += unitPrice;

      // Commission calculation based on rule
      let itemCommission = 0;
      if (rule.type === 'PERCENTAGE') {
        const basis = rule.commissionBasis === 'LIST_PRICE' ? unitPrice : finalPrice;
        itemCommission = (basis * rule.rateOrAmount) / 100;
      } else if (rule.type === 'FIXED_PER_SERVICE') {
        itemCommission = rule.rateOrAmount;
      } else if (rule.type === 'SALARY_PLUS_COMMISSION') {
        const basis = rule.commissionBasis === 'LIST_PRICE' ? unitPrice : finalPrice;
        itemCommission = (basis * rule.rateOrAmount) / 100;
      } else {
        // FIXED_SALARY
        itemCommission = 0;
      }

      return {
        serviceId: item.serviceId,
        serviceName,
        unitPrice,
        discount,
        finalPrice,
        commissionEarned: itemCommission,
      };
    });

    const netTotal = Math.max(0, computedGross - computedDiscounts);
    const collectedAmount = netTotal;
    const totalCommission = lineItems.reduce((acc, curr) => acc + curr.commissionEarned, 0);

    const newTx: Transaction = {
      id: generateId('tx'),
      ticketNumber,
      employeeId: employee.id,
      employeeName: employee.fullName,
      createdById: currentUser.id,
      shiftId: input.shiftId,
      customerName: input.customerName || 'عميل نقدي',
      customerPhone: input.customerPhone,
      items: lineItems,
      grossTotal: computedGross,
      discountTotal: computedDiscounts,
      netTotal,
      collectedAmount,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      commissionSnapshot: {
        ruleType: rule.type,
        rateOrAmount: rule.rateOrAmount,
        totalCommission,
      },
    };

    dbStorage.updateDb(d => {
      // 1. Add transaction
      d.transactions.unshift(newTx);

      // 2. If CASH payment, record cashbox inflow
      if (input.paymentMethod === 'CASH') {
        const currentBalance = d.cashboxLedger.length > 0 
          ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
          : 0;
        const newBalance = currentBalance + collectedAmount;

        d.cashboxLedger.push({
          id: generateId('csh'),
          timestamp: new Date().toISOString(),
          type: 'SERVICE_INFLOW',
          amount: collectedAmount,
          runningBalance: newBalance,
          sourceReference: ticketNumber,
          recordedById: currentUser.id,
          description: `إيراد تذكرة خدمات (${ticketNumber}) - ${employee.fullName}`,
        });
      }
    });

    // 3. Audit
    auditService.log(
      currentUser.id,
      currentUser.displayName,
      currentUser.role,
      'CREATE_TRANSACTION',
      'TRANSACTION',
      newTx.id,
      `إصدار تذكرة جديدة ${ticketNumber} بقيمة ${collectedAmount} ج.م بواسطة ${currentUser.displayName}`
    );

    return newTx;
  },

  getAll(): Transaction[] {
    return dbStorage.getDb().transactions;
  },

  getByEmployee(employeeId: string): Transaction[] {
    return dbStorage.getDb().transactions.filter(t => t.employeeId === employeeId);
  },

  submitCorrectionRequest(
    transactionId: string,
    reason: string,
    employee: User
  ): CorrectionRequest {
    const db = dbStorage.getDb();
    const tx = db.transactions.find(t => t.id === transactionId);
    if (!tx) throw new Error('التذكرة غير موجودة');

    const request: CorrectionRequest = {
      id: generateId('crq'),
      transactionId,
      ticketNumber: tx.ticketNumber,
      employeeId: employee.employeeId || employee.id,
      employeeName: employee.displayName,
      requestReason: reason,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    dbStorage.updateDb(d => {
      d.correctionRequests.unshift(request);
      const t = d.transactions.find(x => x.id === transactionId);
      if (t) t.status = 'CORRECTION_PENDING';
    });

    auditService.log(
      employee.id,
      employee.displayName,
      employee.role,
      'SUBMIT_CORRECTION_REQUEST',
      'TRANSACTION',
      transactionId,
      `طلب تصحيح للتذكرة ${tx.ticketNumber}: ${reason}`
    );

    return request;
  },

  approveCorrection(requestId: string, adminReason: string, adminUser: User): void {
    dbStorage.updateDb(d => {
      const req = d.correctionRequests.find(r => r.id === requestId);
      if (!req) return;

      req.status = 'APPROVED';
      req.decidedAt = new Date().toISOString();
      req.decidedByAdminId = adminUser.id;
      req.adminDecisionReason = adminReason;

      const tx = d.transactions.find(t => t.id === req.transactionId);
      if (tx) {
        tx.status = 'VOIDED';

        // Reversal of cashbox inflow if it was CASH
        if (tx.paymentMethod === 'CASH') {
          const lastBalance = d.cashboxLedger.length > 0 
            ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
            : 0;
          d.cashboxLedger.push({
            id: generateId('csh'),
            timestamp: new Date().toISOString(),
            type: 'SHIFT_ADJUSTMENT',
            amount: -tx.collectedAmount,
            runningBalance: lastBalance - tx.collectedAmount,
            sourceReference: `VOID_${tx.ticketNumber}`,
            recordedById: adminUser.id,
            description: `إلغاء وقيد عكسي للتذكرة ${tx.ticketNumber} بناءً على موافقة الإدارة: ${adminReason}`,
          });
        }
      }
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'APPROVE_CORRECTION_VOID',
      'TRANSACTION',
      requestId,
      `الموافقة على إلغاء التذكرة وإجراء قيد عكسي مالي: ${adminReason}`
    );
  },

  rejectCorrection(requestId: string, adminReason: string, adminUser: User): void {
    dbStorage.updateDb(d => {
      const req = d.correctionRequests.find(r => r.id === requestId);
      if (!req) return;

      req.status = 'REJECTED';
      req.decidedAt = new Date().toISOString();
      req.decidedByAdminId = adminUser.id;
      req.adminDecisionReason = adminReason;

      const tx = d.transactions.find(t => t.id === req.transactionId);
      if (tx) tx.status = 'COMPLETED';
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'REJECT_CORRECTION',
      'TRANSACTION',
      requestId,
      `رفض طلب تعديل التذكرة: ${adminReason}`
    );
  },
};
