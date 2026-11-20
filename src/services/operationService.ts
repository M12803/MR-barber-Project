import { dbStorage } from '../lib/db/storage';
import { CustomerOperation } from '../types';
import { generateId } from '../lib/utils';

export const operationService = {
  addOperation(
    employeeId: string,
    serviceName: string,
    amount: number,
    notes?: string
  ): CustomerOperation {
    const db = dbStorage.getDb();
    const employee = db.employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('الموظف غير موجود');

    const nextNumber = db.operations.length + 1001;
    const operationNumber = `OP-${nextNumber}`;

    const newOp: CustomerOperation = {
      id: generateId('op'),
      operationNumber,
      employeeId: employee.id,
      employeeName: employee.name,
      serviceName,
      amount,
      notes: notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    dbStorage.updateDb(d => {
      d.operations.unshift(newOp);
    });

    return newOp;
  },

  getAll(): CustomerOperation[] {
    return dbStorage.getDb().operations;
  },

  getByEmployee(employeeId: string): CustomerOperation[] {
    return dbStorage.getDb().operations.filter(op => op.employeeId === employeeId);
  },

  getTodayByEmployee(employeeId: string): CustomerOperation[] {
    const todayStr = new Date().toISOString().slice(0, 10);
    return dbStorage.getDb().operations.filter(
      op => op.employeeId === employeeId && op.createdAt.startsWith(todayStr)
    );
  },

  updateOperationByAdmin(
    id: string,
    serviceName: string,
    amount: number,
    adminNote: string
  ): void {
    dbStorage.updateDb(d => {
      const op = d.operations.find(o => o.id === id);
      if (op) {
        op.serviceName = serviceName;
        op.amount = amount;
        op.isModifiedByAdmin = true;
        op.adminModificationNote = adminNote || `تعديل بواسطة الإدارة في ${new Date().toLocaleTimeString('ar-EG')}`;
      }
    });
  },

  deleteOperationByAdmin(id: string): void {
    dbStorage.updateDb(d => {
      d.operations = d.operations.filter(o => o.id !== id);
    });
  },
};
