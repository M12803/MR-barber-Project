import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cashboxService } from '../../services/cashboxService';
import { exportService } from '../../services/exportService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Receipt,
  Users,
  Wallet,
  ArrowDownCircle,
  FileSpreadsheet,
  Scissors,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { db, setCurrentView } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = db.transactions.filter(
    t => t.createdAt.startsWith(todayStr) && t.status !== 'VOIDED'
  );

  const todayGross = todayTransactions.reduce((s, t) => s + t.grossTotal, 0);
  const todayCollected = todayTransactions.reduce((s, t) => s + t.collectedAmount, 0);
  const todayCommissions = todayTransactions.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);
  const todayExpenses = db.expenses
    .filter(e => e.date.startsWith(todayStr))
    .reduce((s, e) => s + e.amount, 0);

  const cashboxBalance = cashboxService.getCurrentBalance();
  const pendingCorrections = db.correctionRequests.filter(r => r.status === 'PENDING');
  const pendingAdvances = db.advanceRequests.filter(a => a.status === 'PENDING');

  // Employee Performance today
  const employeeCards = db.employees
    .filter(e => e.status === 'ACTIVE')
    .map(emp => {
      const empTodayTx = todayTransactions.filter(t => t.employeeId === emp.id);
      const ticketsCount = empTodayTx.length;
      const totalValue = empTodayTx.reduce((s, t) => s + t.collectedAmount, 0);
      const totalCommission = empTodayTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);

      return {
        emp,
        ticketsCount,
        totalValue,
        totalCommission,
      };
    });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900 border border-gold-500/20 p-5 rounded-2xl shadow-gold-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 font-display">
              لوحة التحكم الشاملة | صالون محمد رمشان
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ملخص الأداء المالي، تشغيل الوردية، ومتابعة كفاءة فريق العمل اليوم
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline-gold" size="sm" onClick={() => exportService.exportFullWorkbook()}>
            <FileSpreadsheet className="w-4 h-4 ml-1.5" />
            تصدير تقرير Excel
          </Button>
          <Button variant="gold" size="sm" onClick={() => setCurrentView('pos')}>
            <Scissors className="w-4 h-4 ml-1.5" />
            نقطة البيع (POS)
          </Button>
        </div>
      </div>

      {/* Alert Banners if there are pending approvals */}
      {(pendingCorrections.length > 0 || pendingAdvances.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCorrections.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-600/40 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-amber-200">
                    يوجد {pendingCorrections.length} طلب تعديل / إلغاء تذكرة معلق
                  </h4>
                  <p className="text-[11px] text-amber-300/80">يتطلب موافقة الإدارة وإجراء قيد عكسي</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setCurrentView('corrections')}>
                مراجعة
              </Button>
            </div>
          )}

          {pendingAdvances.length > 0 && (
            <div className="bg-sky-950/40 border border-sky-600/40 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="text-xs font-bold text-sky-200">
                    يوجد {pendingAdvances.length} طلب سلفة بانتظار الاعتماد
                  </h4>
                  <p className="text-[11px] text-sky-300/80">مقدمة من موظفي الصالون</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setCurrentView('advances')}>
                مراجعة السلف
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-4 rounded-2xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إيرادات اليوم (المحصل)</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gold-400 font-mono">
              {formatCurrency(todayCollected)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>الإجمالي قبل الخصومات: {formatCurrency(todayGross)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Tickets */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-4 rounded-2xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">عدد التذاكر والعملاء اليوم</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100 font-mono">
              {todayTransactions.length} <span className="text-sm font-normal text-slate-400">تذكرة</span>
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>معدل النشاط نشط ومستقر</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Commissions */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-4 rounded-2xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">عمولات الحلاقين اليوم</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {formatCurrency(todayCommissions)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>صافي الصالون التقديري: {formatCurrency(todayCollected - todayCommissions)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Cashbox Balance */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-4 rounded-2xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">رصيد الخزينة (درج الكاش)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(cashboxBalance)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>مصروفات اليوم: {formatCurrency(todayExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid (Section 5.2 FR-ADM-02) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-400" />
            <span>بطاقات أداء الحلاقين اليوم</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('employees')}>
            عرض تفاصيل الحسابات
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {employeeCards.map(({ emp, ticketsCount, totalValue, totalCommission }) => (
            <div
              key={emp.id}
              className="bg-dark-900 border border-dark-800 hover:border-gold-500/30 p-4 rounded-2xl transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
                    {emp.fullName.charAt(0)}
                  </div>
                  <Badge variant="gold">{emp.code}</Badge>
                </div>
                <h4 className="font-bold text-sm text-slate-100">{emp.fullName}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{emp.roleTitle}</p>
                <div className="mt-2 text-[11px] text-slate-500">
                  <span>نظام الحساب: </span>
                  <span className="text-slate-300 font-medium">
                    {emp.compensationRule.type === 'PERCENTAGE'
                      ? `نسبة ${emp.compensationRule.rateOrAmount}%`
                      : emp.compensationRule.type === 'FIXED_PER_SERVICE'
                      ? `${emp.compensationRule.rateOrAmount} ج.م / خدمة`
                      : 'راتب شهري'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>تذاكر اليوم:</span>
                  <span className="font-bold text-slate-200 font-mono">{ticketsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>قيمة الخدمات:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                <div className="flex justify-between text-gold-400 font-semibold pt-1 border-t border-dark-800/60">
                  <span>العمولة المستحقة:</span>
                  <span className="font-mono">{formatCurrency(totalCommission)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold-400" />
            <span>آخر العمليات والتذاكر المسجلة</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('transactions')}>
            عرض جميع العمليات
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">رقم التذكرة</th>
                <th className="p-3.5">الوقت</th>
                <th className="p-3.5">الحلاق</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">الخدمات</th>
                <th className="p-3.5">المبلغ المحصل</th>
                <th className="p-3.5">الدفع</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {db.transactions.slice(0, 6).map(tx => (
                <tr key={tx.id} className="hover:bg-dark-850/50 transition">
                  <td className="p-3.5 font-bold font-mono text-gold-400">{tx.ticketNumber}</td>
                  <td className="p-3.5 text-slate-400 font-mono">{formatDateTime(tx.createdAt)}</td>
                  <td className="p-3.5 font-medium">{tx.employeeName}</td>
                  <td className="p-3.5 text-slate-400">{tx.customerName || '-'}</td>
                  <td className="p-3.5 max-w-[200px] truncate">
                    {tx.items.map(i => i.serviceName).join(' + ')}
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-100">
                    {formatCurrency(tx.collectedAmount)}
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
                        : 'طلب تعديل'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
