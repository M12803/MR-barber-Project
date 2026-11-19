import { dbStorage } from '../lib/db/storage';
import {
  Shift,
  Expense,
  PaymentMethod,
  User,
  CashboxEntry,
} from '../types';
import { generateId } from '../lib/utils';
import { auditService } from './auditService';

export const cashboxService = {
  getCurrentBalance(): number {
    const db = dbStorage.getDb();
    if (db.cashboxLedger.length === 0) return 0;
    return db.cashboxLedger[db.cashboxLedger.length - 1].runningBalance;
  },

  getLedger(): CashboxEntry[] {
    return [...dbStorage.getDb().cashboxLedger].reverse();
  },

  startShift(employeeId: string, employeeName: string, openingCash: number, notes?: string): Shift {
    const newShift: Shift = {
      id: generateId('shf'),
      employeeId,
      employeeName,
      startTime: new Date().toISOString(),
      openingCash,
      status: 'OPEN',
      notes,
    };

    dbStorage.updateDb(d => {
      d.shifts.unshift(newShift);
    });

    auditService.log(
      employeeId,
      employeeName,
      'EMPLOYEE',
      'START_SHIFT',
      'SHIFT',
      newShift.id,
      `بدء وردية جديدة للموظف ${employeeName} برصيد افتتاحي ${openingCash} ج.م`
    );

    return newShift;
  },

  endShift(shiftId: string, declaredCash: number, actorUser: User, notes?: string): Shift {
    const db = dbStorage.getDb();
    const shift = db.shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('الوردية غير موجودة');

    // Calculate cash collected during this shift
    const shiftCashTx = db.transactions.filter(t => 
      t.employeeId === shift.employeeId && 
      t.paymentMethod === 'CASH' &&
      new Date(t.createdAt) >= new Date(shift.startTime)
    );
    const totalCashCollected = shiftCashTx.reduce((acc, curr) => acc + curr.collectedAmount, 0);
    const expectedCash = shift.openingCash + totalCashCollected;
    const variance = declaredCash - expectedCash;

    dbStorage.updateDb(d => {
      const s = d.shifts.find(x => x.id === shiftId);
      if (s) {
        s.endTime = new Date().toISOString();
        s.declaredClosingCash = declaredCash;
        s.expectedCash = expectedCash;
        s.variance = variance;
        s.status = 'CLOSED';
        s.notes = notes ? `${s.notes || ''} | إغلاق: ${notes}` : s.notes;
      }
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'END_SHIFT',
      'SHIFT',
      shiftId,
      `إغلاق الوردية للموظف ${shift.employeeName} - المتوقع: ${expectedCash} ج.م، الفعلي: ${declaredCash} ج.م، الفارق: ${variance} ج.م`
    );

    return shift;
  },

  getActiveShift(employeeId: string): Shift | undefined {
    return dbStorage.getDb().shifts.find(s => s.employeeId === employeeId && s.status === 'OPEN');
  },

  getAllShifts(): Shift[] {
    return dbStorage.getDb().shifts;
  },

  recordExpense(
    categoryId: string,
    amount: number,
    description: string,
    paymentMethod: PaymentMethod,
    actorUser: User,
    receiptReference?: string
  ): Expense {
    const db = dbStorage.getDb();
    const cat = db.expenseCategories.find(c => c.id === categoryId);
    const categoryName = cat ? cat.name : 'مصروف عام';

    const newExp: Expense = {
      id: generateId('exp'),
      categoryId,
      categoryName,
      amount,
      date: new Date().toISOString(),
      paymentMethod,
      description,
      createdById: actorUser.id,
      createdByName: actorUser.displayName,
      receiptReference,
    };

    dbStorage.updateDb(d => {
      d.expenses.unshift(newExp);

      // Cashbox outflow if CASH
      if (paymentMethod === 'CASH') {
        const lastBalance = d.cashboxLedger.length > 0 
          ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
          : 0;
        d.cashboxLedger.push({
          id: generateId('csh'),
          timestamp: new Date().toISOString(),
          type: 'EXPENSE_OUTFLOW',
          amount: -amount,
          runningBalance: lastBalance - amount,
          sourceReference: newExp.id,
          recordedById: actorUser.id,
          description: `تسجيل مصروف (${categoryName}): ${description}`,
        });
      }
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'CREATE_EXPENSE',
      'EXPENSE',
      newExp.id,
      `تسجيل مصروف بقيمة ${amount} ج.م (${categoryName}) - ${description}`
    );

    return newExp;
  },

  recordOwnerDeposit(amount: number, description: string, actorUser: User): void {
    dbStorage.updateDb(d => {
      const lastBalance = d.cashboxLedger.length > 0 
        ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
        : 0;
      d.cashboxLedger.push({
        id: generateId('csh'),
        timestamp: new Date().toISOString(),
        type: 'OWNER_DEPOSIT',
        amount,
        runningBalance: lastBalance + amount,
        sourceReference: 'OWNER_IN',
        recordedById: actorUser.id,
        description: `إيداع نقدي في الخزينة: ${description}`,
      });
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'OWNER_DEPOSIT',
      'SHIFT',
      'csh_deposit',
      `إيداع صاحب العمل ${amount} ج.م في الخزينة`
    );
  },

  recordOwnerWithdrawal(amount: number, description: string, actorUser: User): void {
    dbStorage.updateDb(d => {
      const lastBalance = d.cashboxLedger.length > 0 
        ? d.cashboxLedger[d.cashboxLedger.length - 1].runningBalance 
        : 0;
      d.cashboxLedger.push({
        id: generateId('csh'),
        timestamp: new Date().toISOString(),
        type: 'OWNER_WITHDRAWAL',
        amount: -amount,
        runningBalance: lastBalance - amount,
        sourceReference: 'OWNER_OUT',
        recordedById: actorUser.id,
        description: `سحب نقدي من الخزينة: ${description}`,
      });
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'OWNER_WITHDRAWAL',
      'SHIFT',
      'csh_withdrawal',
      `سحب صاحب العمل ${amount} ج.م من الخزينة`
    );
  },

  getAllExpenses(): Expense[] {
    return dbStorage.getDb().expenses;
  },
};
