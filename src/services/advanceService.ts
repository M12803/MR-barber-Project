import { dbStorage } from '../lib/db/storage';
import { Advance, AdvanceStatus } from '../types';
import { generateId } from '../lib/utils';

export const advanceService = {
  recordAdvance(
    employeeId: string,
    amount: number,
    reason: string
  ): Advance {
    const db = dbStorage.getDb();
    const employee = db.employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('الموظف غير موجود');

    const nextSeq = db.advances.length + 1;
    const advanceNumber = `ADV-${String(nextSeq).padStart(2, '0')}`;

    const newAdvance: Advance = {
      id: generateId('adv'),
      advanceNumber,
      employeeId: employee.id,
      employeeName: employee.name,
      amount,
      reason: reason.trim() || 'ظرف شخصي',
      status: 'PENDING',
      repaidAmount: 0,
      remainingAmount: amount,
      createdAt: new Date().toISOString(),
      repaymentHistory: [],
    };

    dbStorage.updateDb(d => {
      d.advances.unshift(newAdvance);
    });

    return newAdvance;
  },

  approveAdvance(id: string, note?: string): void {
    dbStorage.updateDb(d => {
      const adv = d.advances.find(a => a.id === id);
      if (adv) {
        adv.status = 'APPROVED';
        adv.decisionNote = note;
      }
    });
  },

  recordRepayment(id: string, repayAmount: number, note?: string): void {
    dbStorage.updateDb(d => {
      const adv = d.advances.find(a => a.id === id);
      if (!adv) return;

      const newRepaid = adv.repaidAmount + repayAmount;
      const newRemaining = Math.max(0, adv.amount - newRepaid);

      adv.repaidAmount = newRepaid;
      adv.remainingAmount = newRemaining;
      adv.status = newRemaining === 0 ? 'REPAID' : 'PARTIALLY_REPAID';

      if (!adv.repaymentHistory) adv.repaymentHistory = [];
      adv.repaymentHistory.push({
        amount: repayAmount,
        date: new Date().toISOString(),
        note: note || 'سداد نقدي في الدرج',
      });
    });
  },

  getAll(): Advance[] {
    return dbStorage.getDb().advances;
  },

  getByEmployee(employeeId: string): Advance[] {
    return dbStorage.getDb().advances.filter(a => a.employeeId === employeeId);
  },

  deleteByAdmin(id: string): void {
    dbStorage.updateDb(d => {
      d.advances = d.advances.filter(a => a.id !== id);
    });
  },
};
