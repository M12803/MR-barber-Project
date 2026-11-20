import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { operationService } from '../../services/operationService';
import { advanceService } from '../../services/advanceService';
import { expenseService } from '../../services/expenseService';
import { CustomerOperation, Advance, ShopExpense } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Scissors,
  HandCoins,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Search,
  ShoppingBag,
  Plus,
} from 'lucide-react';

export const OperationsView: React.FC = () => {
  const { db, refreshDb } = useApp();

  const [activeTab, setActiveTab] = useState<'operations' | 'advances' | 'expenses'>('operations');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [search, setSearch] = useState('');

  // Edit Operation Modal
  const [editingOp, setEditingOp] = useState<CustomerOperation | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Repayment Modal
  const [repayingAdv, setRepayingAdv] = useState<Advance | null>(null);
  const [repayAmount, setRepayAmount] = useState('100');
  const [repayNote, setRepayNote] = useState('سداد نقدي في الدرج');

  // Add Expense Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseItem, setExpenseItem] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('100');
  const [expenseQuantity, setExpenseQuantity] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('مستلزمات حلاقة');
  const [expenseRecordedBy, setExpenseRecordedBy] = useState('محمد رمضان (المالك)');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Filtered Operations
  const filteredOperations = db.operations.filter(op => {
    if (filterEmployee !== 'all' && op.employeeId !== filterEmployee) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        op.operationNumber.toLowerCase().includes(q) ||
        op.employeeName.toLowerCase().includes(q) ||
        op.serviceName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Advances
  const filteredAdvances = db.advances.filter(adv => {
    if (filterEmployee !== 'all' && adv.employeeId !== filterEmployee) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        adv.advanceNumber.toLowerCase().includes(q) ||
        adv.employeeName.toLowerCase().includes(q) ||
        adv.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Expenses
  const filteredExpenses = (db.expenses || []).filter(exp => {
    if (filterEmployee !== 'all') {
      const targetEmp = db.employees.find(e => e.id === filterEmployee);
      if (targetEmp && !exp.recordedByName.includes(targetEmp.name)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        exp.expenseNumber.toLowerCase().includes(q) ||
        exp.itemName.toLowerCase().includes(q) ||
        exp.recordedByName.toLowerCase().includes(q) ||
        (exp.notes && exp.notes.toLowerCase().includes(q)) ||
        (exp.category && exp.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle Edit Operation
  const handleOpenEditOp = (op: CustomerOperation) => {
    setEditingOp(op);
    setEditServiceName(op.serviceName);
    setEditAmount(String(op.amount));
    setAdminNote('');
  };

  const handleSaveOpEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOp) return;
    const amt = Number(editAmount);
    if (!amt || amt <= 0) return;

    operationService.updateOperationByAdmin(
      editingOp.id,
      editServiceName,
      amt,
      adminNote || 'تم التعديل بواسطة الإدارة'
    );

    setEditingOp(null);
    refreshDb();
  };

  const handleDeleteOp = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا التسجيل؟')) {
      operationService.deleteOperationByAdmin(id);
      refreshDb();
    }
  };

  // Advances Actions
  const handleApproveAdvance = (id: string) => {
    advanceService.approveAdvance(id, 'تمت الموافقة والمراجعة من الإدارة');
    refreshDb();
  };

  const handleConfirmRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingAdv) return;
    const amt = Number(repayAmount);
    if (!amt || amt <= 0) return;

    advanceService.recordRepayment(repayingAdv.id, amt, repayNote);
    setRepayingAdv(null);
    refreshDb();
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المصروف؟')) {
      expenseService.deleteByAdmin(id);
      refreshDb();
    }
  };

  const handleSaveExpenseAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      alert('يرجى تحديد المبلغ المدفوع');
      return;
    }
    if (!expenseItem.trim()) {
      alert('يرجى كتابة اسم المستلزمات أو المصروف');
      return;
    }

    expenseService.recordExpense(
      'usr_admin',
      expenseRecordedBy.trim() || 'محمد رمضان (المالك)',
      expenseItem,
      amt,
      expenseQuantity,
      expenseCategory,
      expenseNotes
    );

    setIsAddExpenseOpen(false);
    setExpenseItem('');
    setExpenseAmount('100');
    setExpenseQuantity('');
    setExpenseNotes('');
    refreshDb();
  };

  const totalFilteredExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 font-display">
            <Scissors className="w-5 h-5 text-gold-400" />
            <span>سجل العمليات والسلف والمصاريف (حسابات المحل المركزية)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة وتعديل تسجيلات الحلاقة، مراجعة السلف، ومتابعة مصاريف ومستلزمات الصالون المسجلة من الجميع
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => setIsAddExpenseOpen(true)}
          className="shadow-gold-md"
        >
          <Plus className="w-4 h-4 ml-1.5" />
          <span>إضافة مستلزمات / مصروف جديد</span>
        </Button>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-dark-900 border border-dark-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'operations'
                ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white bg-dark-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>تسجيلات الحلاقة ({filteredOperations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advances')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'advances'
                ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white bg-dark-800'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>سجل السلف من الدرج ({filteredAdvances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'bg-emerald-500 text-dark-950 shadow-sm'
                : 'text-slate-400 hover:text-white bg-dark-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>مصاريف ومستلزمات المحل ({filteredExpenses.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالرقم أو اسم الحلاق..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <select
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
            className="bg-dark-850 border border-dark-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
          >
            <option value="all">جميع الحلاقين</option>
            {db.employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operations Table */}
      {activeTab === 'operations' && (
        <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
                <tr>
                  <th className="p-4">رقم العملية</th>
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">اسم الحلاق</th>
                  <th className="p-4">نوع الحلاقة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">ملاحظات</th>
                  <th className="p-4 text-center">تحكم الأدمن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-200">
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد تسجيلات مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map(op => (
                    <tr key={op.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 font-bold font-mono text-gold-400">{op.operationNumber}</td>
                      <td className="p-4 font-mono text-slate-400">{formatDateTime(op.createdAt)}</td>
                      <td className="p-4 font-bold text-slate-100">{op.employeeName}</td>
                      <td className="p-4 font-medium">{op.serviceName}</td>
                      <td className="p-4 font-bold font-mono text-emerald-400">{formatCurrency(op.amount)}</td>
                      <td className="p-4 text-slate-400">
                        {op.notes || '-'}
                        {op.isModifiedByAdmin && (
                          <span className="text-[10px] text-amber-400 block mt-0.5 font-sans">
                            {op.adminModificationNote}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditOp(op)}
                            title="تعديل التسجيل"
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-gold-500/20 text-slate-400 hover:text-gold-400 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOp(op.id)}
                            title="حذف التسجيل"
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advances Table */}
      {activeTab === 'advances' && (
        <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
                <tr>
                  <th className="p-4">كود السلفة</th>
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">المبلغ المأخوذ</th>
                  <th className="p-4">المسترد للدرج</th>
                  <th className="p-4">المتبقي</th>
                  <th className="p-4">سبب السلفة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات الأدمن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-200">
                {filteredAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      لا توجد سلف مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredAdvances.map(adv => (
                    <tr key={adv.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 font-bold font-mono text-gold-400">{adv.advanceNumber}</td>
                      <td className="p-4 font-mono text-slate-400">{formatDateTime(adv.createdAt)}</td>
                      <td className="p-4 font-bold text-slate-100">{adv.employeeName}</td>
                      <td className="p-4 font-bold font-mono text-amber-400">{formatCurrency(adv.amount)}</td>
                      <td className="p-4 font-mono text-emerald-400">{formatCurrency(adv.repaidAmount)}</td>
                      <td className="p-4 font-mono font-bold text-slate-200">{formatCurrency(adv.remainingAmount)}</td>
                      <td className="p-4 text-slate-300">{adv.reason}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            adv.status === 'REPAID'
                              ? 'success'
                              : adv.status === 'APPROVED'
                              ? 'gold'
                              : adv.status === 'PARTIALLY_REPAID'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {adv.status === 'PENDING'
                            ? 'بانتظار المراجعة'
                            : adv.status === 'APPROVED'
                            ? 'معتمدة'
                            : adv.status === 'PARTIALLY_REPAID'
                            ? 'سداد جزئي'
                            : 'مسددة بالكامل'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {adv.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="gold"
                              onClick={() => handleApproveAdvance(adv.id)}
                            >
                              اعتماد
                            </Button>
                          )}
                          {adv.remainingAmount > 0 && (
                            <Button
                              size="sm"
                              variant="outline-gold"
                              onClick={() => {
                                setRepayingAdv(adv);
                                setRepayAmount(String(adv.remainingAmount));
                              }}
                            >
                              تسجيل رد مبلغ
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-400">
              إجمالي المصاريف والمستلزمات المعروضة:
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatCurrency(totalFilteredExpenses)}
            </span>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-dark-800 text-slate-400 font-semibold border-b border-dark-750">
                  <tr>
                    <th className="p-4">كود المصروف</th>
                    <th className="p-4">اسم الصنف / المستلزمات</th>
                    <th className="p-4">المبلغ المدفوع</th>
                    <th className="p-4">الكمية</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">المشتري / المسجل</th>
                    <th className="p-4">التاريخ والوقت</th>
                    <th className="p-4">ملاحظات</th>
                    <th className="p-4 text-center">إجراء الأدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 text-slate-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        لا توجد أي مصاريف أو مستلزمات مطابقة للبحث أو الفلتر.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-dark-850/50 transition">
                        <td className="p-4 font-bold font-mono text-emerald-400">
                          {exp.expenseNumber}
                        </td>
                        <td className="p-4 font-bold text-slate-100">
                          {exp.itemName}
                        </td>
                        <td className="p-4 font-bold font-mono text-gold-400">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {exp.quantity || '-'}
                        </td>
                        <td className="p-4">
                          <Badge variant="neutral">
                            {exp.category || 'عام'}
                          </Badge>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            {exp.recordedByName}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {formatDateTime(exp.createdAt)}
                        </td>
                        <td className="p-4 text-slate-400">
                          {exp.notes || '-'}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="حذف هذا المصروف"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Operation Modal */}
      {editingOp && (
        <Modal
          isOpen={Boolean(editingOp)}
          onClose={() => setEditingOp(null)}
          title={`تعديل تسجيل حلاقة: ${editingOp.operationNumber}`}
          subtitle={`الحلاق: ${editingOp.employeeName}`}
        >
          <form onSubmit={handleSaveOpEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">نوع الحلاقة:</label>
              <select
                value={editServiceName}
                onChange={e => setEditServiceName(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
              >
                {db.services.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">المبلغ المحصل (جنيه):</label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-base font-bold text-gold-300 focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                سبب التعديل (لتوثيق التصحيح):
              </label>
              <input
                type="text"
                required
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="مثال: تصحيح خطأ الحلاق في تسجيل المبلغ..."
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditingOp(null)}>
                إلغاء
              </Button>
              <Button type="submit" variant="gold">
                حفظ التصحيح
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Repay Advance Modal */}
      {repayingAdv && (
        <Modal
          isOpen={Boolean(repayingAdv)}
          onClose={() => setRepayingAdv(null)}
          title={`تسجيل سداد سلفة: ${repayingAdv.advanceNumber}`}
          subtitle={`الموظف: ${repayingAdv.employeeName} | المتبقي: ${formatCurrency(repayingAdv.remainingAmount)}`}
        >
          <form onSubmit={handleConfirmRepayment} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                المبلغ المسترد للدرج (جنيه):
              </label>
              <input
                type="number"
                min="1"
                max={repayingAdv.remainingAmount}
                required
                value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-base font-bold text-emerald-400 focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">ملاحظة السداد:</label>
              <input
                type="text"
                value={repayNote}
                onChange={e => setRepayNote(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setRepayingAdv(null)}>
                إلغاء
              </Button>
              <Button type="submit" variant="gold">
                تأكيد رد المبلغ للدرج
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <Modal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          title="تسجيل مستلزمات أو مصاريف للمحل"
          subtitle="تسجيل أي مشتريات (شفرات، مناديل، شاي، صيانة...) في حسابات المحل المركزية"
          maxWidth="md"
        >
          <form onSubmit={handleSaveExpenseAdmin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                اسم الصنف / المستلزمات:
              </label>
              <input
                type="text"
                required
                value={expenseItem}
                onChange={e => setExpenseItem(e.target.value)}
                placeholder="مثال: علبة شفرات دوركو، كرتونة مناديل، شاي وسكر..."
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  المبلغ المدفوع (جنيه):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="100"
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  الكمية / العدد (اختياري):
                </label>
                <input
                  type="text"
                  value={expenseQuantity}
                  onChange={e => setExpenseQuantity(e.target.value)}
                  placeholder="علبتين، كرتونة، 3 حبات..."
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  تصنيف المصروف:
                </label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/60"
                >
                  <option value="مستلزمات حلاقة">✂️ مستلزمات حلاقة وعناية</option>
                  <option value="نظافة وتعقيم">🧼 نظافة وتعقيم ومطهرات</option>
                  <option value="ضيافة ومشروبات">☕ ضيافة ومشروبات (شاي، سكر، مياه)</option>
                  <option value="صيانة وتصليح">🔧 صيانة وأدوات وكهرباء</option>
                  <option value="فواتير ومصاريف عامة">📄 فواتير ومصاريف عامة</option>
                  <option value="أخرى">📦 أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  المشتري / المسجل باسم:
                </label>
                <select
                  value={expenseRecordedBy}
                  onChange={e => setExpenseRecordedBy(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/60"
                >
                  <option value="محمد رمضان (المالك)">👑 محمد رمضان (المالك)</option>
                  {db.employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      👤 {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                ملاحظات إضافية (اختياري):
              </label>
              <input
                type="text"
                value={expenseNotes}
                onChange={e => setExpenseNotes(e.target.value)}
                placeholder="اسم المحل أو تفاصيل إضافية..."
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsAddExpenseOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="gold">
                حفظ المستلزمات في الحسابات
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
