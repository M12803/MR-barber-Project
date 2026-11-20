import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime, isToday } from '../../lib/utils';
import { reportService } from '../../services/reportService';
import { advanceService } from '../../services/advanceService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Employee } from '../../types';
import {
  TrendingUp,
  Users,
  HandCoins,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  UserCheck,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { db, setCurrentView, refreshDb } = useApp();

  const summary = reportService.getDashboardSummary();
  const pendingAdvances = db.advances.filter(a => a.status === 'PENDING');

  // Selected Employee Modal for full details
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Repayment Modal
  const [repayAdvanceId, setRepayAdvanceId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('100');
  const [repayNote, setRepayNote] = useState<string>('سداد نقدي في الدرج');

  // Period Filter for employee performance cards
  type EmpPeriod = 'today' | 'week' | 'month' | 'year';
  const [empPeriod, setEmpPeriod] = useState<EmpPeriod>('today');

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const getFilteredOpsForEmp = (empId: string, period: EmpPeriod) => {
    return db.operations.filter(o => {
      if (o.employeeId !== empId) return false;
      if (period === 'today') return isToday(o.createdAt);
      const d = new Date(o.createdAt);
      if (period === 'week') return d >= oneWeekAgo;
      if (period === 'month') return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      if (period === 'year') return d.getFullYear() === currentYear;
      return true;
    });
  };

  const getPeriodTitle = (p: EmpPeriod) => {
    switch (p) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذه السنة';
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleApproveAdvance = (advId: string) => {
    advanceService.approveAdvance(advId, 'تمت الموافقة والمراجعة من المدير');
    refreshDb();
  };

  const handleConfirmRepayment = () => {
    if (!repayAdvanceId) return;
    const amt = Number(repayAmount);
    if (!amt || amt <= 0) return;
    advanceService.recordRepayment(repayAdvanceId, amt, repayNote);
    setRepayAdvanceId(null);
    setRepayAmount('100');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Welcome Top Banner */}
      <div className="bg-dark-900 border border-gold-500/25 p-6 rounded-3xl shadow-gold-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 font-display">
              لوحة التحكم الرئيسية | {db.settings.shopName}
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة إيرادات اليوم، عدد العملاء، السلف المسجلة، وأداء الحلاقين
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline-gold"
            size="sm"
            onClick={() => reportService.exportToExcel('today')}
          >
            <FileSpreadsheet className="w-4 h-4 ml-1.5" />
            تصدير تقرير اليوم (Excel)
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setCurrentView('reports')}
          >
            عرض التقارير الشاملة
          </Button>
        </div>
      </div>

      {/* Pending Advances Alert Banner */}
      {pendingAdvances.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-200">
                يوجد {pendingAdvances.length} سلفة مسجلة جديدة بانتظار مراجعتك
              </h4>
              <p className="text-[11px] text-amber-300/80">
                سحبها الموظف من الدرج وتحتاج اعتمادك
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="gold"
            onClick={() => setCurrentView('operations')}
          >
            مراجعة السلف فوراً
          </Button>
        </div>
      )}

      {/* 5 Essential Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Today Revenue */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-5 rounded-3xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إيراد الخدمات اليوم</span>
            <div className="w-10 h-10 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-black text-gold-400 font-mono">
              {formatCurrency(summary.todayRevenue)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              إجمالي المحصل من الحلاقة اليوم
            </span>
          </div>
        </div>

        {/* Metric 2: Today Clients */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-5 rounded-3xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">عدد العملاء</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-black text-slate-100 font-mono">
              {summary.todayClients}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              عميل تمت حلاقتهم اليوم
            </span>
          </div>
        </div>

        {/* Metric 3: Today Advances */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-5 rounded-3xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">السلف المسجلة</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-black text-amber-400 font-mono">
              {formatCurrency(summary.todayAdvances)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              سلف خرجت من الدرج اليوم
            </span>
          </div>
        </div>

        {/* Metric 4: Today Expenses & Supplies */}
        <div
          onClick={() => setCurrentView('operations')}
          className="bg-dark-900 border border-dark-800 hover:border-emerald-500/40 p-5 rounded-3xl transition duration-300 shadow-sm cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">مصاريف ومستلزمات</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono">
              {formatCurrency(summary.todayExpenses)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              شراء مستلزمات اليوم
            </span>
          </div>
        </div>

        {/* Metric 5: Active Employees */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-5 rounded-3xl transition duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الموظفون</span>
            <div className="w-10 h-10 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-black text-slate-200 font-mono">
              {summary.activeEmployees}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              حلاقين نشطين في المحل
            </span>
          </div>
        </div>
      </div>

      {/* Employee Cards Section (إدارة ومتابعة دخل الحلاقين) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" />
              <span>متابعة إنتاجية ودخل الحلاقين ({getPeriodTitle(empPeriod)})</span>
            </h3>
            <p className="text-xs text-slate-400">
              اختر الفترة الزمنية لمتابعة حلاقة كل موظف، واضغط على أي كارت لعرض كشف حسابه بالكامل
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Switcher Tabs */}
            <div className="flex items-center gap-1 bg-dark-900 border border-dark-800 p-1 rounded-2xl">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-gold-400" />
                الفترة:
              </span>
              {(
                [
                  { id: 'today', label: 'اليوم' },
                  { id: 'week', label: 'هذا الأسبوع' },
                  { id: 'month', label: 'هذا الشهر' },
                  { id: 'year', label: 'هذه السنة' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setEmpPeriod(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    empPeriod === tab.id
                      ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setCurrentView('employees')}>
              إدارة الفريق
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {db.employees.map(emp => {
            const empPeriodOps = getFilteredOpsForEmp(emp.id, empPeriod);
            const clientsCount = empPeriodOps.length;
            const totalRevenue = empPeriodOps.reduce((sum, o) => sum + o.amount, 0);

            const empAdvs = db.advances.filter(a => a.employeeId === emp.id);
            const remainingDebt = empAdvs.reduce((sum, a) => sum + a.remainingAmount, 0);

            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className="bg-dark-900 border border-dark-800 hover:border-gold-500/50 p-5 rounded-3xl transition-all duration-200 text-right flex flex-col justify-between group hover:shadow-gold-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg font-display group-hover:scale-105 transition">
                      {emp.name.charAt(0)}
                    </div>
                    <Badge variant={emp.isActive ? 'success' : 'neutral'}>
                      {emp.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-base text-slate-100 group-hover:text-gold-300 transition">
                    {emp.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">حلاق بالصالون</p>
                </div>

                <div className="mt-4 pt-3 border-t border-dark-800/80 space-y-2 text-xs w-full">
                  <div className="flex justify-between text-slate-400">
                    <span>عملاء {getPeriodTitle(empPeriod)}:</span>
                    <span className="font-bold text-slate-100 font-mono">
                      {clientsCount} عميل
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>حلاقة {getPeriodTitle(empPeriod)}:</span>
                    <span className="font-bold text-gold-400 font-mono text-sm">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                  {remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-400 pt-1 border-t border-dark-800/50">
                      <span>سلف مستحقة:</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(remainingDebt)}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Employee Detailed Modal */}
      {selectedEmp && (
        <Modal
          isOpen={Boolean(selectedEmp)}
          onClose={() => setSelectedEmp(null)}
          title={`كشف حساب الموظف: ${selectedEmp.name}`}
          subtitle="جميع تذاكر الحلاقة والسلف المسجلة الخاصة به"
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Quick Metrics by Periods */}
            {(() => {
              const todayOps = getFilteredOpsForEmp(selectedEmp.id, 'today');
              const todayRev = todayOps.reduce((s, o) => s + o.amount, 0);

              const weekOps = getFilteredOpsForEmp(selectedEmp.id, 'week');
              const weekRev = weekOps.reduce((s, o) => s + o.amount, 0);

              const monthOps = getFilteredOpsForEmp(selectedEmp.id, 'month');
              const monthRev = monthOps.reduce((s, o) => s + o.amount, 0);

              const yearOps = getFilteredOpsForEmp(selectedEmp.id, 'year');
              const yearRev = yearOps.reduce((s, o) => s + o.amount, 0);

              const advs = db.advances.filter(a => a.employeeId === selectedEmp.id);
              const remAdv = advs.reduce((s, a) => s + a.remainingAmount, 0);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-dark-800 rounded-2xl border border-dark-750">
                    <div className="border-l border-dark-700/60 pl-2">
                      <span className="text-slate-400 block mb-1">حلاقة اليوم:</span>
                      <span className="text-base font-bold font-mono text-gold-400">{formatCurrency(todayRev)}</span>
                      <span className="text-[10px] text-slate-500 block">({todayOps.length} عميل)</span>
                    </div>
                    <div className="border-l border-dark-700/60 pl-2">
                      <span className="text-slate-400 block mb-1">هذا الأسبوع:</span>
                      <span className="text-base font-bold font-mono text-gold-400">{formatCurrency(weekRev)}</span>
                      <span className="text-[10px] text-slate-500 block">({weekOps.length} عميل)</span>
                    </div>
                    <div className="border-l border-dark-700/60 pl-2">
                      <span className="text-slate-400 block mb-1">هذا الشهر:</span>
                      <span className="text-base font-bold font-mono text-gold-400">{formatCurrency(monthRev)}</span>
                      <span className="text-[10px] text-slate-500 block">({monthOps.length} عميل)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">هذه السنة:</span>
                      <span className="text-base font-bold font-mono text-gold-400">{formatCurrency(yearRev)}</span>
                      <span className="text-[10px] text-slate-500 block">({yearOps.length} عميل)</span>
                    </div>
                  </div>

                  {remAdv > 0 && (
                    <div className="bg-amber-950/30 border border-amber-600/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-200">
                      <span>إجمالي السلف المتبقية على الموظف حالياً:</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">{formatCurrency(remAdv)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Operations list */}
            <div>
              <h4 className="font-bold text-slate-200 text-sm mb-2">آخر عمليات الحلاقة المنفذة:</h4>
              <div className="max-h-48 overflow-y-auto border border-dark-750 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-dark-800 text-slate-400 p-2">
                    <tr>
                      <th className="p-3">رقم العملية</th>
                      <th className="p-3">الخدمة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 text-slate-300">
                    {db.operations
                      .filter(o => o.employeeId === selectedEmp.id)
                      .slice(0, 10)
                      .map(o => (
                        <tr key={o.id}>
                          <td className="p-3 font-mono font-bold text-gold-400">{o.operationNumber}</td>
                          <td className="p-3 font-semibold text-slate-100">{o.serviceName}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(o.amount)}</td>
                          <td className="p-3 font-mono text-slate-400">{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advances list */}
            <div>
              <h4 className="font-bold text-slate-200 text-sm mb-2">السلف المسجلة:</h4>
              <div className="max-h-40 overflow-y-auto border border-dark-750 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-dark-800 text-slate-400 p-2">
                    <tr>
                      <th className="p-3">الكود</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">السبب</th>
                      <th className="p-3">المتبقي</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 text-slate-300">
                    {db.advances
                      .filter(a => a.employeeId === selectedEmp.id)
                      .map(a => (
                        <tr key={a.id}>
                          <td className="p-3 font-mono font-bold text-gold-400">{a.advanceNumber}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">{formatCurrency(a.amount)}</td>
                          <td className="p-3">{a.reason}</td>
                          <td className="p-3 font-mono text-slate-200">{formatCurrency(a.remainingAmount)}</td>
                          <td className="p-3">
                            <Badge variant={a.status === 'REPAID' ? 'success' : 'warning'}>
                              {a.status === 'PENDING' ? 'بانتظار المراجعة' : a.status === 'APPROVED' ? 'معتمدة' : 'مسددة'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {a.remainingAmount > 0 && (
                              <Button
                                size="sm"
                                variant="outline-gold"
                                onClick={() => {
                                  setRepayAdvanceId(a.id);
                                  setRepayAmount(String(a.remainingAmount));
                                }}
                              >
                                تسجيل سداد
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedEmp(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Repayment Modal */}
      {repayAdvanceId && (
        <Modal
          isOpen={Boolean(repayAdvanceId)}
          onClose={() => setRepayAdvanceId(null)}
          title="تسجيل رد / سداد سلفة في الدرج"
          subtitle="إعادة المبلغ إلى درج المحل وتسوية مديونية الموظف"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">المبلغ المردود (جنيه):</label>
              <input
                type="number"
                min="1"
                value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/60"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">ملاحظة:</label>
              <input
                type="text"
                value={repayNote}
                onChange={e => setRepayNote(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setRepayAdvanceId(null)}>
                إلغاء
              </Button>
              <Button variant="gold" onClick={handleConfirmRepayment}>
                تأكيد رد المبلغ للدرج
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
