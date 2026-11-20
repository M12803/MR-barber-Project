import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Transaction } from '../../types';
import { Receipt, Search, Filter, Eye, Printer } from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { db } = useApp();
  const [search, setSearch] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const transactions = db.transactions.filter(t => {
    if (filterEmployee !== 'all' && t.employeeId !== filterEmployee) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.employeeName.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gold-400" />
            <span>سجل العمليات والتذاكر (Transactions Ledger)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل تاريخي كامل وغير قابل للحذف لجميع تذاكر الخدمات المحصلة
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-dark-900 border border-dark-800 px-3 py-1.5 rounded-xl">
          إجمالي التذاكر: <span className="font-bold text-gold-400 font-mono">{transactions.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم التذكرة أو اسم العميل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <select
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
            className="bg-dark-850 border border-dark-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-gold-500/50"
          >
            <option value="all">جميع الحلاقين</option>
            {db.employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-dark-850 border border-dark-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-gold-500/50"
          >
            <option value="all">جميع الحالات</option>
            <option value="COMPLETED">مكتملة</option>
            <option value="CORRECTION_PENDING">بانتظار تصحيح</option>
            <option value="VOIDED">ملغاة (قيد عكسي)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">رقم التذكرة</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">الحلاق</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">الخدمات</th>
                <th className="p-3.5">المحصل</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">العمولة</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    لا توجد عمليات تطابق معايير البحث
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-bold font-mono text-gold-400">{tx.ticketNumber}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{formatDateTime(tx.createdAt)}</td>
                    <td className="p-3.5 font-medium">{tx.employeeName}</td>
                    <td className="p-3.5 text-slate-400">{tx.customerName || '-'}</td>
                    <td className="p-3.5 max-w-[180px] truncate">
                      {tx.items.map(i => i.serviceName).join(' + ')}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-100">
                      {formatCurrency(tx.collectedAmount)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{tx.paymentMethod}</td>
                    <td className="p-3.5 font-mono text-emerald-400">
                      {formatCurrency(tx.commissionSnapshot.totalCommission)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          tx.status === 'COMPLETED'
                            ? 'success'
                            : tx.status === 'VOIDED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {tx.status === 'COMPLETED'
                          ? 'مكتمل'
                          : tx.status === 'VOIDED'
                          ? 'ملغي'
                          : 'طلب تعديل'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setReceiptTx(tx)}
                          title="طباعة الإيصال"
                          className="p-1 hover:text-gold-400 text-slate-400 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          title="عرض التفاصيل"
                          className="p-1 hover:text-gold-400 text-slate-400 transition"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Ticket Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
          title={`تفاصيل التذكرة: ${selectedTx.ticketNumber}`}
          subtitle={`التاريخ: ${formatDateTime(selectedTx.createdAt)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-dark-800 rounded-xl">
              <div>
                <span className="text-slate-400 block">الحلاق:</span>
                <span className="font-bold text-slate-200">{selectedTx.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">العميل:</span>
                <span className="font-bold text-slate-200">{selectedTx.customerName || 'عميل نقدي'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">طريقة السداد:</span>
                <span className="font-bold text-gold-400 font-mono">{selectedTx.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block">حالة التذكرة:</span>
                <Badge variant={selectedTx.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {selectedTx.status}
                </Badge>
              </div>
            </div>

            {/* Line items breakdown */}
            <div className="border border-dark-750 rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-dark-800 text-slate-400 p-2">
                  <tr>
                    <th className="p-2.5">الخدمة</th>
                    <th className="p-2.5">السعر</th>
                    <th className="p-2.5">الخصم</th>
                    <th className="p-2.5">الصافي</th>
                    <th className="p-2.5">العمولة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {selectedTx.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{item.serviceName}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(item.discount)}</td>
                      <td className="p-2.5 font-bold font-mono">{formatCurrency(item.finalPrice)}</td>
                      <td className="p-2.5 font-mono text-emerald-400">
                        {formatCurrency(item.commissionEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-dark-850 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>الإجمالي قبل الخصم:</span>
                <span className="font-mono">{formatCurrency(selectedTx.grossTotal)}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>إجمالي الخصم المطبق:</span>
                <span className="font-mono">-{formatCurrency(selectedTx.discountTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gold-400 pt-1 border-t border-dark-750">
                <span>المبلغ المحصل بالكامل:</span>
                <span className="font-mono">{formatCurrency(selectedTx.collectedAmount)}</span>
              </div>
              {selectedTx.amountReceived !== undefined && (
                <div className="flex justify-between text-slate-300">
                  <span>المستلم من العميل:</span>
                  <span className="font-mono font-bold">{formatCurrency(selectedTx.amountReceived)}</span>
                </div>
              )}
              {selectedTx.changeAmount !== undefined && selectedTx.changeAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>الباقي للعميل:</span>
                  <span className="font-mono">{formatCurrency(selectedTx.changeAmount)}</span>
                </div>
              )}
              {selectedTx.outstandingAmount !== undefined && selectedTx.outstandingAmount > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>المتبقي آجل:</span>
                  <span className="font-mono">{formatCurrency(selectedTx.outstandingAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedTx(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt */}
      <ReceiptModal
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
        transaction={receiptTx}
      />
    </div>
  );
};
