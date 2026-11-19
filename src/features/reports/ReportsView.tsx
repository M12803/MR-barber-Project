import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { exportService } from '../../services/exportService';
import { Button } from '../../components/ui/Button';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Wallet,
  ArrowDownCircle,
  Coins,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { db } = useApp();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Compute metrics
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredTx = db.transactions.filter(t => {
    if (t.status === 'VOIDED') return false;
    if (period === 'today') {
      return t.createdAt.startsWith(todayStr);
    }
    if (period === 'month') {
      const currentMonth = todayStr.slice(0, 7);
      return t.createdAt.startsWith(currentMonth);
    }
    return true;
  });

  const totalGross = filteredTx.reduce((s, t) => s + t.grossTotal, 0);
  const totalDiscounts = filteredTx.reduce((s, t) => s + t.discountTotal, 0);
  const totalCollected = filteredTx.reduce((s, t) => s + t.collectedAmount, 0);
  const totalCommissions = filteredTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);

  const filteredExpenses = db.expenses.filter(e => {
    if (period === 'today') return e.date.startsWith(todayStr);
    if (period === 'month') return e.date.startsWith(todayStr.slice(0, 7));
    return true;
  });
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const estimatedShopMargin = totalCollected - totalCommissions - totalExpenses;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-gold-400" />
            <span>التقارير التحليلية وتصدير البيانات (Reports & Excel)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إحصائيات الإيرادات، العمولات، الأرباح، وتصدير دفتر العمليات الكامل إلى ملف Excel (.xlsx)
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          className="shadow-gold-md"
          onClick={() => exportService.exportFullWorkbook()}
        >
          <Download className="w-4 h-4 ml-2" />
          تصدير مصنف Excel كامل (10 شيتات)
        </Button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'today', label: 'اليوم' },
          { id: 'week', label: 'هذا الأسبوع' },
          { id: 'month', label: 'هذا الشهر' },
          { id: 'all', label: 'جميع الفترات' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id as any)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              period === p.id
                ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الإيراد المحصل</span>
            <TrendingUp className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-black text-gold-400 font-mono mt-2">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            الخصومات الممنوحة: {formatCurrency(totalDiscounts)}
          </span>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>عمولات الحلاقين المستحقة</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {formatCurrency(totalCommissions)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            تمثل {totalCollected > 0 ? Math.round((totalCommissions / totalCollected) * 100) : 0}% من الإيراد
          </span>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>المصروفات العامة</span>
            <ArrowDownCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            فواتير ومستلزمات تشغيل
          </span>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>صافي ربح الصالون التقديري</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {formatCurrency(estimatedShopMargin)}
          </div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            بعد خصم العمولات والمصاريف
          </span>
        </div>
      </div>

      {/* Staff Commission Statements Breakdown */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-400" />
            <span>كشف حساب واستحقاق الحلاقين خلال الفترة المحددة</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">كود الموظف</th>
                <th className="p-3.5">اسم الحلاق</th>
                <th className="p-3.5">عدد التذاكر</th>
                <th className="p-3.5">قيمة الخدمات</th>
                <th className="p-3.5">العمولة المكتسبة</th>
                <th className="p-3.5">مديونية السلف المتبقية</th>
                <th className="p-3.5">صافي الاستحقاق للصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {db.employees.map(emp => {
                const empTx = filteredTx.filter(t => t.employeeId === emp.id);
                const count = empTx.length;
                const value = empTx.reduce((s, t) => s + t.collectedAmount, 0);
                const comm = empTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);
                const empAdvances = db.advanceRequests.filter(a => a.employeeId === emp.id);
                const debt = empAdvances
                  .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
                  .reduce((s, a) => s + a.remainingBalance, 0);

                return (
                  <tr key={emp.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-bold font-mono text-gold-400">{emp.code}</td>
                    <td className="p-3.5 font-medium">{emp.fullName}</td>
                    <td className="p-3.5 font-mono">{count}</td>
                    <td className="p-3.5 font-mono">{formatCurrency(value)}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{formatCurrency(comm)}</td>
                    <td className="p-3.5 font-mono text-amber-400">{formatCurrency(debt)}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-100">
                      {formatCurrency(comm - debt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
