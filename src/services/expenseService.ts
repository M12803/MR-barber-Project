import { dbStorage } from '../lib/db/storage';
import { ShopExpense } from '../types';
import { generateId, isToday } from '../lib/utils';

export const expenseService = {
  recordExpense(
    recordedByUserId: string,
    recordedByName: string,
    itemName: string,
    amount: number,
    quantity?: string,
    category?: string,
    notes?: string
  ): ShopExpense {
    const db = dbStorage.getDb();
    if (!Array.isArray(db.expenses)) {
      dbStorage.updateDb(d => {
        d.expenses = [];
      });
    }

    const currentExpenses = dbStorage.getDb().expenses || [];
    const nextSeq = currentExpenses.length + 1;
    const expenseNumber = `EXP-${String(nextSeq).padStart(2, '0')}`;

    const newExpense: ShopExpense = {
      id: generateId('exp'),
      expenseNumber,
      itemName: itemName.trim(),
      amount: Math.abs(amount),
      quantity: quantity?.trim() || '1',
      category: category?.trim() || 'مستلزمات عامة',
      recordedByUserId,
      recordedByName: recordedByName.trim() || 'غير محدد',
      notes: notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    dbStorage.updateDb(d => {
      if (!Array.isArray(d.expenses)) d.expenses = [];
      d.expenses.unshift(newExpense);
    });

    return newExpense;
  },

  getAll(): ShopExpense[] {
    const db = dbStorage.getDb();
    return db.expenses || [];
  },

  getToday(): ShopExpense[] {
    const db = dbStorage.getDb();
    return (db.expenses || []).filter(e => isToday(e.createdAt));
  },

  deleteByAdmin(id: string): void {
    dbStorage.updateDb(d => {
      if (Array.isArray(d.expenses)) {
        d.expenses = d.expenses.filter(e => e.id !== id);
      }
    });
  },
};
