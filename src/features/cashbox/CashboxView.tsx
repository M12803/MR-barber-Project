import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cashboxService } from '../../services/cashboxService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const CashboxView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const currentBalance = cashboxService.getCurrentBalance();
  const ledger = cashboxService.getLedger();
  const shifts = cashboxService.getAllShifts();

  const handleDeposit = () => {
    if (!currentUser) return;
    const val = Number(amount);
    if (!val || val <= 0) return;
    cashboxService.recordOwnerDeposit(val, description || 'إيداع نقدي بالخزينة', currentUser);
    setIsDepositModalOpen(false);
    setAmount('');
    setDescription('');
    refreshDb();
  };

  const handleWithdrawal = () => {
    if (!currentUser) return;
    const val = Number(amount);
    if (!val || val <= 0) return;
    cashboxService.recordOwnerWithdrawal(val, description || 'سحب نقدي من الخزينة', currentUser);
    setIsWithdrawModalOpen(false);
    setAmount('');
    setDescription('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Top Header Card */}
      <div className="bg-dark-900 border border-gold-500/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-gold-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              رصيد الخزينة الحالي (الكاش الفعلي المحسوب في الدرج)
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(currentBalance)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline-gold" size="sm" onClick={() => setIsDepositModalOpen(true)}>
            <PlusCircle className="w-4 h-4 ml-1.5" />
            إيداع نقدي (إدخال عهدة)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsWithdrawModalOpen(true)}>
            <MinusCircle className="w-4 h-4 ml-1.5" />
            سحب أرباح / توريد
          </Button>
        </div>
      </div>

      {/* Shifts Summary Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>سجل الورديات ومطابقة النقدية (Shifts & Reconciliation)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">بداية الوردية</th>
                <th className="p-3.5">عهدة البداية</th>
                <th className="p-3.5">نهاية الوردية</th>
                <th className="p-3.5">الكاش المتوقع</th>
                <th className="p-3.5">الكاش الفعلي المورد</th>
                <th className="p-3.5">الفارق (العجز/الزيادة)</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {shifts.map(shift => (
                <tr key={shift.id} className="hover:bg-dark-850/50 transition">
                  <td className="p-3.5 font-bold">{shift.employeeName}</td>
                  <td className="p-3.5 font-mono text-slate-400">{formatDateTime(shift.startTime)}</td>
                  <td className="p-3.5 font-mono">{formatCurrency(shift.openingCash)}</td>
                  <td className="p-3.5 font-mono text-slate-400">
                    {shift.endTime ? formatDateTime(shift.endTime) : 'مستمرة الآن'}
                  </td>
                  <td className="p-3.5 font-mono">
                    {shift.expectedCash !== undefined ? formatCurrency(shift.expectedCash) : '-'}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-gold-400">
                    {shift.declaredClosingCash !== undefined ? formatCurrency(shift.declaredClosingCash) : '-'}
                  </td>
                  <td className="p-3.5 font-mono">
                    {shift.variance !== undefined ? (
                      <span
                        className={`font-bold ${
                          shift.variance === 0
                            ? 'text-emerald-400'
                            : shift.variance < 0
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {shift.variance > 0 ? `+${shift.variance}` : shift.variance} ج.م
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={shift.status === 'OPEN' ? 'success' : 'neutral'}>
                      {shift.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashbox Movements Ledger */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gold-400" />
            <span>دفتر حركة الخزينة التراكمي (Cash Ledger)</span>
          </h3>
          <span className="text-xs text-slate-400">سجل متسلسل غير قابل للتعديل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">نوع الحركة</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">الرصيد بعد الحركة</th>
                <th className="p-3.5">المرجع</th>
                <th className="p-3.5">البيان والتفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {ledger.map(entry => {
                const isPositive = entry.amount >= 0;
                return (
                  <tr key={entry.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">{formatDateTime(entry.timestamp)}</td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {isPositive ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span>
                          {entry.type === 'SERVICE_INFLOW'
                            ? 'إيراد تذكرة خدمات'
                            : entry.type === 'EXPENSE_OUTFLOW'
                            ? 'مصروف'
                            : entry.type === 'ADVANCE_OUTFLOW'
                            ? 'صرف سلفة'
                            : entry.type === 'ADVANCE_REPAYMENT_INFLOW'
                            ? 'سداد سلفة'
                            : entry.type === 'OWNER_DEPOSIT'
                            ? 'إيداع نقدي'
                            : entry.type === 'OWNER_WITHDRAWAL'
                            ? 'سحب نقدي'
                            : 'تسوية رصيد'}
                        </span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold">
                      <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                        {isPositive ? `+${formatCurrency(entry.amount)}` : formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-100">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{entry.sourceReference}</td>
                    <td className="p-3.5 text-slate-300 max-w-[250px] truncate">{entry.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="إيداع نقدي في الخزينة"
        subtitle="إدخال عهدة فكة أو سيولة إضافية إلى درج الكاش"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">المبلغ المودع (ج.م):</label>
            <input
              type="number"
              min="10"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="مثال: 500"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">البيان:</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="سبب الإيداع (مثال: عهدة فكة صباحية)"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" onClick={handleDeposit}>
              تأكيد الإيداع
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="سحب نقدي من الخزينة"
        subtitle="سحب أرباح أو توريد إلى الحساب البنكي الخارجي"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">المبلغ المسحوب (ج.م):</label>
            <input
              type="number"
              min="10"
              max={currentBalance}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="مثال: 1000"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">البيان والسبب:</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="مثال: سحب أرباح أسبوعية للمالك"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsWithdrawModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={handleWithdrawal}>
              تأكيد السحب
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
