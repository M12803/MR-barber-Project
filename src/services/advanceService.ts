import { dbStorage } from '../lib/db/storage';
import {
  AdvanceRequest,
  PaymentMethod,
  User,
  AdvanceInstallment,
  AdvanceRepayment,
} from '../types';
import { generateId } from '../lib/utils';
import { auditService } from './auditService';

export const advanceService = {
  requestAdvance(
    employeeId: string,
    amount: number,
    reason: string,
    employeeUser: User
  ): AdvanceRequest {
    const db = dbStorage.getDb();
    const emp = db.employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('الموظف غير موجود');

    const newReq: AdvanceRequest = {
      id: generateId('adv'),
      employeeId: emp.id,
      employeeName: emp.fullName,
      requestedAmount: amount,
      reason,
      status: 'PENDING',
      requestDate: new Date().toISOString(),
      remainingBalance: amount,
    };

    dbStorage.updateDb(d => {
      d.advanceRequests.unshift(newReq);
    });

    auditService.log(
      employeeUser.id,
      employeeUser.displayName,
      employeeUser.role,
      'REQUEST_ADVANCE',
      'ADVANCE',
      newReq.id,
      `طلب سلفة بقيمة ${amount} ج.م - السبب: ${reason}`
    );

    return newReq;
  },

  approveAdvance(
    advanceId: string,
    approvedAmount: number,
    adminUser: User,
    notes?: string
  ): void {
    dbStorage.updateDb(d => {
      const adv = d.advanceRequests.find(a => a.id === advanceId);
      if (!adv) return;

      const isPartial = approvedAmount < adv.requestedAmount;
      adv.status = isPartial ? 'PARTIALLY_APPROVED' : 'APPROVED';
      adv.approvedAmount = approvedAmount;
      adv.remainingBalance = approvedAmount;
      adv.decisionDate = new Date().toISOString();
      adv.decisionByAdminId = adminUser.id;
      adv.decisionNotes = notes;
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'APPROVE_ADVANCE',
      'ADVANCE',
      advanceId,
      `اعتماد سلفة بقيمة ${approvedAmount} ج.م`
    );
  },

  rejectAdvance(advanceId: string, adminUser: User, notes: string): void {
    dbStorage.updateDb(d => {
      const adv = d.advanceRequests.find(a => a.id === advanceId);
      if (!adv) return;

      adv.status = 'REJECTED';
      adv.decisionDate = new Date().toISOString();
      adv.decisionByAdminId = adminUser.id;
      adv.decisionNotes = notes;
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'REJECT_ADVANCE',
      'ADVANCE',
      advanceId,
      `رفض طلب السلفة: ${notes}`
    );
  },

  disburseAdvance(
    advanceId: string,
    paymentMethod: PaymentMethod,
    installmentsCount: number,
    adminUser: User
  ): void {
    dbStorage.updateDb(d => {
      const adv = d.advanceRequests.find(a => a.id === advanceId);
      if (!adv || !adv.approvedAmount) return;

      adv.status = 'DISBURSED';
      adv.disbursedAmount = adv.approvedAmount;
      adv.disbursementDate = new Date().toISOString();
      adv.disbursementMethod = paymentMethod;

      // Generate Installments
      const count = Math.max(1, installmentsCount || 1);
      const perInstallment = Math.round(adv.approvedAmount / count);
      const installments: AdvanceInstallment[] = [];

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + i * 15); // every 15 days
        installments.push({
          id: generateId('inst'),
          advanceId: adv.id,
          dueDate: dueDate.toISOString().slice(0, 10),
          expectedAmount: i === count ? adv.approvedAmount - perInstallment * (count - 1) : perInstallment,
          paidAmount: 0,
          isPaid: false,
        });
      }
      adv.installments = installments;

      // Cashbox outflow if paid via CASH
      if (paymentMethod === 'CASH') {
        const lastBalance = d.cashboxLedger.length > 0 
          ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
          : 0;
        d.cashboxLedger.push({
          id: generateId('csh'),
          timestamp: new Date().toISOString(),
          type: 'ADVANCE_OUTFLOW',
          amount: -adv.approvedAmount,
          runningBalance: lastBalance - adv.approvedAmount,
          sourceReference: adv.id,
          recordedById: adminUser.id,
          description: `صرف سلفة للموظف (${adv.employeeName}) بمبلغ ${adv.approvedAmount} ج.م نقداً`,
        });
      }
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'DISBURSE_ADVANCE',
      'ADVANCE',
      advanceId,
      `صرف السلفة فعلياً وطرحها من الخزينة بواسطة ${adminUser.displayName}`
    );
  },

  recordRepayment(
    advanceId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    adminUser: User,
    notes?: string
  ): void {
    dbStorage.updateDb(d => {
      const adv = d.advanceRequests.find(a => a.id === advanceId);
      if (!adv) return;

      const repayment: AdvanceRepayment = {
        id: generateId('rep'),
        advanceId: adv.id,
        employeeId: adv.employeeId,
        amount,
        date: new Date().toISOString(),
        paymentMethod,
        recordedByAdminId: adminUser.id,
        notes,
      };

      if (!adv.repayments) adv.repayments = [];
      adv.repayments.push(repayment);

      // Deduct from balance
      adv.remainingBalance = Math.max(0, adv.remainingBalance - amount);
      if (adv.remainingBalance === 0) {
        adv.status = 'SETTLED';
      } else {
        adv.status = 'PARTIALLY_REPAID';
      }

      // Cashbox inflow if repaid CASH
      if (paymentMethod === 'CASH') {
        const lastBalance = d.cashboxLedger.length > 0 
          ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
          : 0;
        d.cashboxLedger.push({
          id: generateId('csh'),
          timestamp: new Date().toISOString(),
          type: 'ADVANCE_REPAYMENT_INFLOW',
          amount,
          runningBalance: lastBalance + amount,
          sourceReference: adv.id,
          recordedById: adminUser.id,
          description: `سداد قسط سلفة من الموظف (${adv.employeeName}) بمبلغ ${amount} ج.م`,
        });
      }
    });

    auditService.log(
      adminUser.id,
      adminUser.displayName,
      adminUser.role,
      'RECORD_ADVANCE_REPAYMENT',
      'ADVANCE',
      advanceId,
      `تسجيل سداد سلفة بقيمة ${amount} ج.م - المتبقي: ${advanceId}`
    );
  },

  getAll(): AdvanceRequest[] {
    return dbStorage.getDb().advanceRequests;
  },

  getByEmployee(employeeId: string): AdvanceRequest[] {
    return dbStorage.getDb().advanceRequests.filter(a => a.employeeId === employeeId);
  },
};
