import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime, soundFx } from '../../lib/utils';
import { cashboxService } from '../../services/cashboxService';
import { advanceService } from '../../services/advanceService';
import { transactionService } from '../../services/transactionService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Scissors,
  HandCoins,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  TrendingUp,
} from 'lucide-react';

export const EmployeeHome: React.FC = () => {
  const { currentUser, db, setCurrentView, refreshDb } = useApp();

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advanceReason, setAdvanceReason] = useState<string>('');

  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [openingCash, setOpeningCash] = useState<string>('500');
  const [shiftNotes, setShiftNotes] = useState<string>('');

  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState<boolean>(false);
  const [declaredCash, setDeclaredCash] = useState<string>('');

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const employeeId = currentUser?.employeeId || '';
  const employeeProfile = db.employees.find(e => e.id === employeeId);

  // Today's stats for this employee
  const todayStr = new Date().toISOString().slice(0, 10);
  const myTodayTx = db.transactions.filter(
    t => t.employeeId === employeeId && t.createdAt.startsWith(todayStr) && t.status !== 'VOIDED'
  );

  const myTicketsCount = myTodayTx.length;
  const myTodayCollected = myTodayTx.reduce((s, t) => s + t.collectedAmount, 0);
  const myTodayCommission = myTodayTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);

  // Advances balance
  const myAdvances = db.advanceRequests.filter(a => a.employeeId === employeeId);
  const myOutstandingDebt = myAdvances
    .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
    .reduce((s, a) => s + a.remainingBalance, 0);

  // Active Shift
  const activeShift = cashboxService.getActiveShift(employeeId);

  const handleRequestAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !employeeId) return;
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح للسلفة');
      return;
    }
    if (!advanceReason.trim()) {
      alert('يرجى توضيح سبب طلب السلفة');
      return;
    }

    advanceService.requestAdvance(employeeId, amount, advanceReason.trim(), currentUser);
    soundFx.playSuccess();
    alert('تم إرسال طلب السلفة إلى الإدارة بنجاح وفي انتظار المراجعة');
    setIsAdvanceModalOpen(false);
    setAdvanceAmount('');
    setAdvanceReason('');
    refreshDb();
  };

  const handleStartShift = () => {
    if (!employeeProfile) return;
    cashboxService.startShift(
      employeeProfile.id,
      employeeProfile.fullName,
      Number(openingCash) || 0,
      shiftNotes
    );
    soundFx.playSuccess();
    setIsShiftModalOpen(false);
    refreshDb();
  };

  const handleEndShift = () => {
    if (!activeShift || !currentUser) return;
    cashboxService.endShift(activeShift.id, Number(declaredCash) || 0, currentUser, shiftNotes);
    soundFx.playSuccess();
    setIsEndShiftModalOpen(false);
    refreshDb();
  };

  const handleSubmitCorrection = () => {
    if (!selectedTxId || !correctionReason.trim() || !currentUser) return;
    transactionService.submitCorrectionRequest(selectedTxId, correctionReason.trim(), currentUser);
    soundFx.playSuccess();
    alert('تم رفع طلب التعديل إلى الإدارة للمراجعة');
    setIsCorrectionModalOpen(false);
    setSelectedTxId('');
    setCorrectionReason('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Header Profile Greeting */}
      <div className="bg-dark-900 border border-gold-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/40 text-gold-400 font-bold text-2xl flex items-center justify-center font-display">
            {employeeProfile?.fullName.charAt(0) || 'ح'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100 font-display">
                مرحباً، {employeeProfile?.fullName || currentUser?.displayName}
              </h2>
              <Badge variant="gold">{employeeProfile?.roleTitle || 'حلاق معتمد'}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              نظام الاستحقاق: {employeeProfile?.compensationRule.type === 'PERCENTAGE'
                ? `نسبة مئوية (${employeeProfile.compensationRule.rateOrAmount}%) من إيراد الخدمات`
                : 'مبلغ محدد لكل خدمة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline-gold" size="sm" onClick={() => setIsAdvanceModalOpen(true)}>
            <HandCoins className="w-4 h-4 ml-1.5" />
            طلب سلفة جديدة
          </Button>
          <Button variant="gold" size="sm" onClick={() => setCurrentView('pos')}>
            <Scissors className="w-4 h-4 ml-1.5" />
            نقطة البيع (تسجيل عميل)
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Today Tickets */}
        <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">تذاكري المنجزة اليوم</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100 font-mono">{myTicketsCount}</span>
            <span className="text-xs text-slate-500">عميل</span>
          </div>
        </div>

        {/* Stat 2: Today Service Value */}
        <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">قيمة خدماتي المنفذة</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-gold-400 font-mono">
              {formatCurrency(myTodayCollected)}
            </span>
          </div>
        </div>

        {/* Stat 3: Today Commission */}
        <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">عمولتي المكتسبة اليوم</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(myTodayCommission)}
            </span>
          </div>
        </div>

        {/* Stat 4: Remaining Advance Debt */}
        <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">مديونية السلف الحالية</span>
          <div className="mt-2">
            <span className={`text-2xl font-black font-mono ${myOutstandingDebt > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {formatCurrency(myOutstandingDebt)}
            </span>
          </div>
        </div>
      </div>

      {/* Shift Attendance Management Card */}
      <div className="bg-dark-900 border border-dark-800 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeShift ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-100">حالة الوردية الحالية</h4>
                <Badge variant={activeShift ? 'success' : 'neutral'}>
                  {activeShift ? 'وردية مفتوحة ونشطة' : 'لا توجد وردية مفتوحة'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeShift
                  ? `بدأت الوردية في: ${formatDateTime(activeShift.startTime)} | عهدة فكة البداية: ${formatCurrency(activeShift.openingCash)}`
                  : 'يمكنك فتح الوردية عند بدء يوم العمل لتسجيل عهدة الفكة'}
              </p>
            </div>
          </div>

          <div>
            {activeShift ? (
              <Button variant="danger" size="sm" onClick={() => setIsEndShiftModalOpen(true)}>
                إغلاق الوردية وتوريد الكاش
              </Button>
            ) : (
              <Button variant="outline-gold" size="sm" onClick={() => setIsShiftModalOpen(true)}>
                فتح الوردية الآن
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Transactions & Correction Request Option */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold-400" />
            <span>تذاكري المسجلة اليوم (للاطلاع فقط)</span>
          </h3>
          <span className="text-xs text-slate-400">
            * لا يمكن تعديل أو حذف التذكرة بعد الحفظ، يرجى تقديم طلب تصحيح للإدارة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">رقم التذكرة</th>
                <th className="p-3.5">الوقت</th>
                <th className="p-3.5">الخدمات المنفذة</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">عمولتي</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {myTodayTx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لم تقم بتسجيل أي تذاكر بعد اليوم. اضغط على نقطة البيع للبدء.
                  </td>
                </tr>
              ) : (
                myTodayTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-bold font-mono text-gold-400">{tx.ticketNumber}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{formatDateTime(tx.createdAt)}</td>
                    <td className="p-3.5 max-w-[200px] truncate">
                      {tx.items.map(i => i.serviceName).join(' + ')}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-100">
                      {formatCurrency(tx.collectedAmount)}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-emerald-400">
                      {formatCurrency(tx.commissionSnapshot.totalCommission)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-dark-800 text-[11px] font-mono border border-dark-700">
                        {tx.paymentMethod}
                      </span>
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
                          : 'طلب تعديل معلق'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      {tx.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedTxId(tx.id);
                            setIsCorrectionModalOpen(true);
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>طلب تصحيح</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Request Modal */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title="طلب سلفة جديدة"
        subtitle="سيتم إرسال الطلب إلى الإدارة للاعتماد وتحديد طريقة وجدولة السداد"
      >
        <form onSubmit={handleRequestAdvance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              مبلغ السلفة المطلوب (ج.م):
            </label>
            <input
              type="number"
              min="50"
              step="50"
              required
              value={advanceAmount}
              onChange={e => setAdvanceAmount(e.target.value)}
              placeholder="مثال: 1000"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              سبب طلب السلفة:
            </label>
            <textarea
              rows={3}
              required
              value={advanceReason}
              onChange={e => setAdvanceReason(e.target.value)}
              placeholder="اذكر سبب الطلب بوضوح للإدارة..."
              className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsAdvanceModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" type="submit">
              إرسال الطلب
            </Button>
          </div>
        </form>
      </Modal>

      {/* Start Shift Modal */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title="افتتاح وردية جديدة"
        subtitle="تسجيل عهدة الفكة في بداية الوردية"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              رصيد عهدة الفكة الافتتاحي (ج.م):
            </label>
            <input
              type="number"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ملاحظات بداية الوردية:
            </label>
            <input
              type="text"
              value={shiftNotes}
              onChange={e => setShiftNotes(e.target.value)}
              placeholder="مثال: استلام درج 1 بكامل العهدة"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsShiftModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" onClick={handleStartShift}>
              تأكيد فتح الوردية
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Shift Modal */}
      <Modal
        isOpen={isEndShiftModalOpen}
        onClose={() => setIsEndShiftModalOpen(false)}
        title="إغلاق الوردية وتوريد النقدية"
        subtitle="قم بعد الكاش الفعلي الموجود في الدرج لتسجيل التسوية"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              المبلغ النقدي المحصي بالدرج (ج.م):
            </label>
            <input
              type="number"
              value={declaredCash}
              onChange={e => setDeclaredCash(e.target.value)}
              placeholder="أدخل إجمالي النقدية في الدرج"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsEndShiftModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={handleEndShift}>
              تأكيد إغلاق الوردية
            </Button>
          </div>
        </div>
      </Modal>

      {/* Correction Request Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="تقديم طلب تصحيح أو إلغاء تذكرة"
        subtitle="سيتم مراجعة الطلب بواسطة الإدارة قبل تطبيق أي قيد مالي عكسي"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              سبب طلب التصحيح / الإلغاء:
            </label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="مثال: تم اختيار خدمة خاطئة بالخطأ أو العميل غيّر طلبه..."
              className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsCorrectionModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" onClick={handleSubmitCorrection}>
              رفع الطلب للإدارة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
