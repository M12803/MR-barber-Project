import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { reportService, DailyFinancialRecord } from '../../services/reportService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  FileSpreadsheet,
  Download,
  Users,
  TrendingUp,
  HandCoins,
  Scissors,
  Trophy,
  Wallet,
  Coins,
  ShoppingBag,
  Calendar,
  Eye,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { db } = useApp();
  const [mainTab, setMainTab] = useState<'summary' | 'daily'>('summary');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Daily records state
  const [dailyFilter, setDailyFilter] = useState<'week' | 'month' | 'all' | 'custom'>('month');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('');
  const [selectedDayDetails, setSelectedDayDetails] = useState<DailyFinancialRecord | null>(null);

  const report = reportService.getPeriodReport(period);
  const dailyRecords = reportService.getDailyFinancialRecords(
    dailyFilter,
    dailyFilter === 'custom' ? selectedCustomDate : undefined
  );

  // Totals for daily records currently viewed
  const totalDaysRevenue = dailyRecords.reduce((s, d) => s + d.revenue, 0);
  const totalDaysClients = dailyRecords.reduce((s, d) => s + d.clientsCount, 0);
  const totalDaysAdvances = dailyRecords.reduce((s, d) => s + d.advancesTaken, 0);
  const totalDaysExpenses = dailyRecords.reduce((s, d) => s + d.expenses, 0);
  const totalDaysNetCash = dailyRecords.reduce((s, d) => s + d.netDrawerCash, 0);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 font-display">
            <FileSpreadsheet className="w-5 h-5 text-gold-400" />
            <span>التقارير والإحصائيات المالية والحسابات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة إيرادات الصالون اليومية بالتاريخ، تقارير الأسابيع والشهور، وأداء كل حلاق
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          className="shadow-gold-md"
          onClick={() => reportService.exportToExcel(period)}
        >
          <Download className="w-4 h-4 ml-2" />
          <span>تصدير تقرير شامل إلى Excel (.xlsx)</span>
        </Button>
      </div>

      {/* Main Switcher: Summary & KPIs vs. Daily History Table */}
      <div className="flex items-center gap-2 border-b border-dark-800 pb-2">
        <button
          onClick={() => setMainTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            mainTab === 'summary'
              ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>ملخص وإحصائيات عامة</span>
        </button>

        <button
          onClick={() => setMainTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            mainTab === 'daily'
              ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-900'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>سجل الإيرادات اليومية بالتاريخ (يوم بيوم)</span>
          <span className="bg-dark-800 text-gold-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {dailyRecords.length} يوم
          </span>
        </button>
      </div>

      {/* TAB 1: SUMMARY & KPIS */}
      {mainTab === 'summary' && (
        <div className="space-y-6">
          {/* Period Selection Tabs */}
          <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 p-1.5 rounded-2xl w-fit">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'أسبوعي (آخر 7 أيام)' },
              { id: 'month', label: 'شهري (الشهر الحالي)' },
              { id: 'all', label: 'كل الفترات' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  period === p.id
                    ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Primary KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Metric 1: Total Service Revenue */}
            <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>إجمالي إيراد الحلاقة</span>
                <TrendingUp className="w-4 h-4 text-gold-400" />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-gold-400 font-mono mt-2">
                {formatCurrency(report.totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                دخل الخدمات الفعلي خلال الفترة
              </span>
            </div>

            {/* Metric 2: Total Clients */}
            <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>إجمالي العملاء</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-slate-100 font-mono mt-2">
                {report.totalClients} <span className="text-xs font-normal text-slate-400">عميل</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                عملية حلاقة مسجلة
              </span>
            </div>

            {/* Metric 3: Advances Taken vs Repaid */}
            <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>السلف المسجلة من الدرج</span>
                <HandCoins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-amber-400 font-mono mt-2">
                {formatCurrency(report.totalAdvancesTaken)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                <span>المسترد: {formatCurrency(report.totalAdvancesRepaid)}</span>
                <span className="text-amber-400 font-bold">باقي: {formatCurrency(report.remainingAdvancesDebt)}</span>
              </div>
            </div>

            {/* Metric 4: Total Shop Expenses & Supplies */}
            <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>مصاريف ومستلزمات</span>
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono mt-2">
                {formatCurrency(report.totalExpenses)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                شراء مستلزمات وصيانة وضيافة
              </span>
            </div>

            {/* Metric 5: Net Drawer Movement */}
            <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>صافي حركة درج المحل</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono mt-2">
                {formatCurrency(report.drawerNetMovement)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                الإيراد - السلف + المسترد - المصاريف
              </span>
            </div>
          </div>

          {/* Strict Distinction Explanation Note */}
          <div className="p-4 bg-dark-900 border border-dark-800 rounded-2xl text-xs text-slate-400 flex items-start gap-3">
            <Coins className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                تنبيه مالي مهم لصاحب المحل:
              </span>
              <p className="leading-relaxed">
                السيستم يفرّق تماماً بين <span className="text-gold-400 font-bold">«إيراد الحلاقة»</span> و <span className="text-amber-400 font-bold">«السلف»</span>. السلفة ليست إيراداً وليست مصروفاً نهائياً، بل مبالغ نقدية خرجت مؤقتاً من الدرج ومستحقة الرد من الموظف.
              </p>
            </div>
          </div>

          {/* Staff Ranking & Performance Table */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  ترتيب الموظفين حسب الأداء (كل موظف حلق كام وجمع كام)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
                  <tr>
                    <th className="p-4 text-center">الترتيب</th>
                    <th className="p-4">اسم الحلاق</th>
                    <th className="p-4">عدد العملاء</th>
                    <th className="p-4">إجمالي الدخل المحصل</th>
                    <th className="p-4">السلف المأخوذة</th>
                    <th className="p-4">متبقي السلف كمديونية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 text-slate-200">
                  {report.employeeRanking.map((emp, index) => (
                    <tr key={emp.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 text-center font-bold font-mono">
                        {index === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-gold-500 text-dark-950 font-bold inline-flex items-center justify-center text-xs shadow-gold-sm">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-dark-950 font-bold inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-slate-100 font-bold inline-flex items-center justify-center text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500">{index + 1}</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-sm text-slate-100">{emp.name}</td>
                      <td className="p-4 font-bold font-mono text-slate-200">{emp.clientsCount} عميل</td>
                      <td className="p-4 font-bold font-mono text-emerald-400 text-sm">
                        {formatCurrency(emp.totalRevenue)}
                      </td>
                      <td className="p-4 font-mono text-slate-300">{formatCurrency(emp.advancesTaken)}</td>
                      <td className="p-4 font-mono font-bold text-amber-400">
                        {emp.advancesRemaining > 0 ? formatCurrency(emp.advancesRemaining) : 'لا توجد'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Services Breakdown Table */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  تفاصيل خدمات الحلاقة المنفذة خلال الفترة
                </h3>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(report.serviceCounts).map(([srvName, data]) => (
                <div
                  key={srvName}
                  className="p-4 bg-dark-850 border border-dark-750 rounded-2xl flex flex-col justify-between"
                >
                  <h4 className="font-bold text-slate-200 text-xs">{srvName}</h4>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-base font-black text-gold-400 font-mono">
                      {data.count} <span className="text-xs font-normal text-slate-400">مرة</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatCurrency(data.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED DAILY FINANCIAL BREAKDOWN (يوم بيوم بالتاريخ) */}
      {mainTab === 'daily' && (
        <div className="space-y-6">
          {/* Daily Filter Controls */}
          <div className="bg-dark-900 border border-dark-800 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium ml-1">عرض أيام:</span>
              {[
                { id: 'week', label: 'هذا الأسبوع' },
                { id: 'month', label: 'هذا الشهر كاملاً' },
                { id: 'all', label: 'جميع الأيام المسجلة' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setDailyFilter(f.id as any);
                    setSelectedCustomDate('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dailyFilter === f.id
                      ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                      : 'text-slate-400 hover:text-white bg-dark-850'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">أو اختر تاريخ محدد:</span>
              <input
                type="date"
                value={selectedCustomDate}
                onChange={e => {
                  setSelectedCustomDate(e.target.value);
                  if (e.target.value) setDailyFilter('custom');
                }}
                className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-gold-500/60"
              />
              {selectedCustomDate && (
                <button
                  onClick={() => {
                    setSelectedCustomDate('');
                    setDailyFilter('month');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1"
                >
                  إلغاء التاريخ
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary of Filtered Days */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-dark-900 border border-dark-800 p-4 rounded-3xl">
            <div className="border-l border-dark-800 pl-3">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الأيام:</span>
              <span className="text-lg font-bold font-mono text-slate-100">
                {dailyRecords.length} يوم
              </span>
            </div>
            <div className="border-l border-dark-800 pl-3">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الإيرادات:</span>
              <span className="text-lg font-bold font-mono text-gold-400">
                {formatCurrency(totalDaysRevenue)}
              </span>
            </div>
            <div className="border-l border-dark-800 pl-3">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الزبائن:</span>
              <span className="text-lg font-bold font-mono text-sky-400">
                {totalDaysClients} عميل
              </span>
            </div>
            <div className="border-l border-dark-800 pl-3">
              <span className="text-[11px] text-slate-400 block mb-1">المصاريف والسلف:</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {formatCurrency(totalDaysAdvances + totalDaysExpenses)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">صافي حركة الدرج:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {formatCurrency(totalDaysNetCash)}
              </span>
            </div>
          </div>

          {/* Daily Records Table */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-400" />
                <h3 className="font-bold text-slate-100 text-xs">
                  كشف إيرادات كل يوم بالتاريخ الكامل
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                اضغط على «عرض التفاصيل» لرؤية حلاقة كل موظف والمصاريف في ذلك اليوم
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
                  <tr>
                    <th className="p-3.5">اليوم والتاريخ</th>
                    <th className="p-3.5 text-center">عدد الزبائن</th>
                    <th className="p-3.5">إيراد الحلاقة</th>
                    <th className="p-3.5">سلف مسحوبة</th>
                    <th className="p-3.5">سلف مستردة</th>
                    <th className="p-3.5">مصاريف ومستلزمات</th>
                    <th className="p-3.5">صافي دخل الدرج</th>
                    <th className="p-3.5">أعلى حلاق إيراداً</th>
                    <th className="p-3.5 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 text-slate-200">
                  {dailyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        لا توجد عمليات مسجلة في هذا التاريخ المحدد
                      </td>
                    </tr>
                  ) : (
                    dailyRecords.map(day => (
                      <tr key={day.date} className="hover:bg-dark-850/50 transition">
                        <td className="p-3.5 font-bold text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-gold-400 font-display">{day.dayName}</span>
                            <span className="font-mono text-slate-400 text-[11px]">({day.date})</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-100">
                          {day.clientsCount} عميل
                        </td>
                        <td className="p-3.5 font-bold font-mono text-gold-400">
                          {formatCurrency(day.revenue)}
                        </td>
                        <td className="p-3.5 font-mono text-amber-400">
                          {day.advancesTaken > 0 ? formatCurrency(day.advancesTaken) : '-'}
                        </td>
                        <td className="p-3.5 font-mono text-sky-400">
                          {day.advancesRepaid > 0 ? formatCurrency(day.advancesRepaid) : '-'}
                        </td>
                        <td className="p-3.5 font-mono text-emerald-400">
                          {day.expenses > 0 ? formatCurrency(day.expenses) : '-'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-300">
                          {formatCurrency(day.netDrawerCash)}
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {day.topEmployeeName}
                        </td>
                        <td className="p-3.5 text-center">
                          <Button
                            variant="outline-gold"
                            size="sm"
                            onClick={() => setSelectedDayDetails(day)}
                          >
                            <Eye className="w-3.5 h-3.5 ml-1" />
                            تفاصيل اليوم
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

      {/* MODAL: SINGLE DAY DETAILED BREAKDOWN */}
      {selectedDayDetails && (
        <Modal
          isOpen={Boolean(selectedDayDetails)}
          onClose={() => setSelectedDayDetails(null)}
          title={`تقرير يوم ${selectedDayDetails.dayName} (${selectedDayDetails.date})`}
          subtitle="تفاصيل دخل الحلاقين، التذاكر المسجلة، السلف والمصاريف لهذا اليوم"
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-dark-800 rounded-2xl border border-dark-750">
              <div>
                <span className="text-slate-400 block mb-1">إيراد الحلاقة:</span>
                <span className="text-base font-bold font-mono text-gold-400">
                  {formatCurrency(selectedDayDetails.revenue)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">عدد الزبائن:</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  {selectedDayDetails.clientsCount} عميل
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">المصاريف والسلف:</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {formatCurrency(selectedDayDetails.advancesTaken + selectedDayDetails.expenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">صافي حركة الدرج:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedDayDetails.netDrawerCash)}
                </span>
              </div>
            </div>

            {/* Barbers Performance for this specific Day */}
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-2">
                دخل كل حلاق في يوم {selectedDayDetails.dayName}:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedDayDetails.employeeBreakdown.map(emp => (
                  <div
                    key={emp.name}
                    className="p-3 bg-dark-800/80 border border-dark-750 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-100 block">{emp.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {emp.clientsCount} عميل
                      </span>
                    </div>
                    <span className="font-mono font-bold text-gold-400 text-sm">
                      {formatCurrency(emp.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Tickets of the Day */}
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-2">تذاكر الحلاقة المنفذة:</h4>
              <div className="max-h-48 overflow-y-auto border border-dark-750 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-dark-800 text-slate-400 p-2">
                    <tr>
                      <th className="p-2.5">رقم التذكرة</th>
                      <th className="p-2.5">الحلاق</th>
                      <th className="p-2.5">الخدمة</th>
                      <th className="p-2.5">المبلغ</th>
                      <th className="p-2.5">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 text-slate-300">
                    {db.operations
                      .filter(o => o.createdAt && o.createdAt.startsWith(selectedDayDetails.date))
                      .map(op => (
                        <tr key={op.id}>
                          <td className="p-2.5 font-mono font-bold text-gold-400">
                            {op.operationNumber}
                          </td>
                          <td className="p-2.5 text-slate-100">{op.employeeName}</td>
                          <td className="p-2.5 text-slate-300">{op.serviceName}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-400">
                            {formatCurrency(op.amount)}
                          </td>
                          <td className="p-2.5 font-mono text-slate-400">
                            {formatDateTime(op.createdAt).split(' ')[1]}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advances and Expenses of the Day if any */}
            {(() => {
              const dayExpenses = (db.expenses || []).filter(
                e => e.createdAt && e.createdAt.startsWith(selectedDayDetails.date)
              );
              const dayAdvances = db.advances.filter(
                a => a.createdAt && a.createdAt.startsWith(selectedDayDetails.date)
              );

              if (dayExpenses.length === 0 && dayAdvances.length === 0) return null;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dark-800">
                  {dayExpenses.length > 0 && (
                    <div>
                      <h5 className="font-bold text-emerald-400 text-xs mb-1.5">
                        مصاريف ومستلزمات اليوم:
                      </h5>
                      <div className="space-y-1">
                        {dayExpenses.map(e => (
                          <div
                            key={e.id}
                            className="p-2 bg-dark-850 rounded-lg flex justify-between text-[11px]"
                          >
                            <span>{e.itemName}</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatCurrency(e.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayAdvances.length > 0 && (
                    <div>
                      <h5 className="font-bold text-amber-400 text-xs mb-1.5">سلف اليوم:</h5>
                      <div className="space-y-1">
                        {dayAdvances.map(a => (
                          <div
                            key={a.id}
                            className="p-2 bg-dark-850 rounded-lg flex justify-between text-[11px]"
                          >
                            <span>
                              {a.employeeName} ({a.reason})
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency(a.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
};
