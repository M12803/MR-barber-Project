import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';
import { reportService } from '../../services/reportService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const report = reportService.getPeriodReport(period);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 font-display">
            <FileSpreadsheet className="w-5 h-5 text-gold-400" />
            <span>التقارير والإحصائيات الشاملة</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إجمالي الدخل، إحصائيات كل خدمة، أداء الحلاقين، وحسابات حركة درج المحل
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          className="shadow-gold-md"
          onClick={() => reportService.exportToExcel(period)}
        >
          <Download className="w-4 h-4 ml-2" />
          <span>تصدير التقرير إلى Excel (.xlsx)</span>
        </Button>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'today', label: 'يومي (اليوم)' },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Service Revenue */}
        <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي إيراد الحلاقة</span>
            <TrendingUp className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-3xl font-black text-gold-400 font-mono mt-2">
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
          <div className="text-3xl font-black text-slate-100 font-mono mt-2">
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
          <div className="text-3xl font-black text-amber-400 font-mono mt-2">
            {formatCurrency(report.totalAdvancesTaken)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>المسترد: {formatCurrency(report.totalAdvancesRepaid)}</span>
            <span className="text-amber-400 font-bold">باقي: {formatCurrency(report.remainingAdvancesDebt)}</span>
          </div>
        </div>

        {/* Metric 4: Net Drawer Movement */}
        <div className="bg-dark-900 border border-dark-800 p-5 rounded-3xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>صافي حركة درج المحل</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-2">
            {formatCurrency(report.drawerNetMovement)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            الإيراد المحصل - السلف + السلف المستردة
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
            السيستم يفرّق تماماً بين <span className="text-gold-400 font-bold">«إيراد الحلاقة»</span> و <span className="text-amber-400 font-bold">«السلف»</span>. السلفة ليست إيراداً للمحل وليست مصروفاً نهائياً، بل هي مبالغ نقدية خرجت مؤقتاً من الدرج ومستحقة الرد لاحقاً من الموظف.
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
  );
};
