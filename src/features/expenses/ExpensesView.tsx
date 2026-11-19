import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cashboxService } from '../../services/cashboxService';
import { PaymentMethod } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ArrowDownCircle, Plus, Receipt } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const expenses = db.expenses;
  const categories = db.expenseCategories;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const val = Number(amount);
    if (!val || val <= 0) {
      alert('يرجى إدخال مبلغ صحيح للمصروف');
      return;
    }
    if (!description.trim()) {
      alert('يرجى كتابة بيان وتفاصيل المصروف');
      return;
    }

    cashboxService.recordExpense(
      categoryId || categories[0]?.id,
      val,
      description.trim(),
      paymentMethod,
      currentUser
    );

    setIsModalOpen(false);
    setAmount('');
    setDescription('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-gold-400" />
            <span>المصروفات العامة والتشغيلية (Expenses Tracker)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل فواتير الشراء، مستلزمات الحلاقة، البوفيه، والمصاريف الدورية
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-dark-900 border border-dark-800 px-4 py-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">إجمالي المصروفات</span>
            <span className="text-base font-bold text-red-400 font-mono">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 ml-1.5" />
            تسجيل مصروف جديد
          </Button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">البند والتصنيف</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">البيان والتفاصيل</th>
                <th className="p-3.5">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">{formatDateTime(exp.date)}</td>
                    <td className="p-3.5">
                      <Badge variant="gold">{exp.categoryName}</Badge>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-red-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{exp.paymentMethod}</td>
                    <td className="p-3.5 text-slate-300 max-w-[300px]">{exp.description}</td>
                    <td className="p-3.5 text-slate-400">{exp.createdByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل مصروف تشغيلي جديد"
        subtitle="إذا كان الدفع نقداً، سيتم خصم القيمة تلقائياً من درج الخزينة"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">بند المصروف:</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">المبلغ (ج.م):</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="مثال: 250"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">طريقة الدفع:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
              >
                <option value="CASH">نقداً من الخزينة (خصم فوري)</option>
                <option value="CARD">بطاقة بنكية / فيزا</option>
                <option value="INSTAPAY">تحويل انستاباي</option>
                <option value="VODAFONE_CASH">محفظة فودافون كاش</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">البيان والشرح:</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="مثال: شراء كرتونة فوط معقمة وشفرات حلاقة..."
              className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" type="submit">
              تسجيل المصروف
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
