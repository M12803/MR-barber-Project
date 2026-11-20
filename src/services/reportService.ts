import * as XLSX from 'xlsx';
import { dbStorage } from '../lib/db/storage';
import { formatDateTime, isToday } from '../lib/utils';

export interface DashboardSummary {
  todayRevenue: number;
  todayClients: number;
  todayAdvances: number;
  todayExpenses: number;
  activeEmployees: number;
  drawerNetCash: number;
}

export interface EmployeeReportItem {
  id: string;
  name: string;
  clientsCount: number;
  totalRevenue: number;
  advancesTaken: number;
  advancesRemaining: number;
  netContribution: number;
}

export interface DailyFinancialRecord {
  date: string; // YYYY-MM-DD
  dayName: string; // الجمعة, السبت, etc.
  formattedDate: string;
  clientsCount: number;
  revenue: number;
  advancesTaken: number;
  advancesRepaid: number;
  expenses: number;
  netDrawerCash: number;
  topEmployeeName: string;
  operationsCount: number;
  employeeBreakdown: Array<{
    name: string;
    clientsCount: number;
    revenue: number;
  }>;
}

export interface PeriodReport {
  period: 'today' | 'week' | 'month' | 'all';
  totalClients: number;
  totalRevenue: number;
  totalAdvancesTaken: number;
  totalAdvancesRepaid: number;
  remainingAdvancesDebt: number;
  totalExpenses: number;
  drawerNetMovement: number;
  serviceCounts: Record<string, { count: number; total: number }>;
  employeeRanking: EmployeeReportItem[];
}

export const reportService = {
  getDashboardSummary(): DashboardSummary {
    const db = dbStorage.getDb();

    const todayOps = db.operations.filter(o => isToday(o.createdAt));
    const todayRevenue = todayOps.reduce((sum, o) => sum + o.amount, 0);
    const todayClients = todayOps.length;

    const todayAdvancesList = db.advances.filter(a => isToday(a.createdAt));
    const todayAdvances = todayAdvancesList.reduce((sum, a) => sum + a.amount, 0);

    const todayExpensesList = (db.expenses || []).filter(e => isToday(e.createdAt));
    const todayExpenses = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);

    const activeEmployees = db.employees.filter(e => e.isActive).length;

    // Drawer net cash: Revenue from haircuts - advances taken + advances repaid - shop expenses
    const allRevenue = db.operations.reduce((s, o) => s + o.amount, 0);
    const allAdvancesTaken = db.advances.reduce((s, a) => s + a.amount, 0);
    const allAdvancesRepaid = db.advances.reduce((s, a) => s + a.repaidAmount, 0);
    const allExpenses = (db.expenses || []).reduce((s, e) => s + e.amount, 0);
    const drawerNetCash = allRevenue - allAdvancesTaken + allAdvancesRepaid - allExpenses;

    return {
      todayRevenue,
      todayClients,
      todayAdvances,
      todayExpenses,
      activeEmployees,
      drawerNetCash,
    };
  },

  getPeriodReport(period: 'today' | 'week' | 'month' | 'all'): PeriodReport {
    const db = dbStorage.getDb();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Filter operations by period
    const filteredOps = db.operations.filter(op => {
      if (period === 'all') return true;
      if (period === 'today') return isToday(op.createdAt);

      const opDate = new Date(op.createdAt);
      if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return opDate >= oneWeekAgo;
      }
      if (period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        return op.createdAt.startsWith(currentMonth);
      }
      return true;
    });

    const totalClients = filteredOps.length;
    const totalRevenue = filteredOps.reduce((s, o) => s + o.amount, 0);

    // Service breakdown
    const serviceCounts: Record<string, { count: number; total: number }> = {};
    filteredOps.forEach(op => {
      if (!serviceCounts[op.serviceName]) {
        serviceCounts[op.serviceName] = { count: 0, total: 0 };
      }
      serviceCounts[op.serviceName].count += 1;
      serviceCounts[op.serviceName].total += op.amount;
    });

    // Filter advances by period
    const filteredAdvances = db.advances.filter(adv => {
      if (period === 'all') return true;
      if (period === 'today') return isToday(adv.createdAt);

      const advDate = new Date(adv.createdAt);
      if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return advDate >= oneWeekAgo;
      }
      if (period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        return adv.createdAt.startsWith(currentMonth);
      }
      return true;
    });

    const totalAdvancesTaken = filteredAdvances.reduce((s, a) => s + a.amount, 0);
    const totalAdvancesRepaid = filteredAdvances.reduce((s, a) => s + a.repaidAmount, 0);
    const remainingAdvancesDebt = filteredAdvances.reduce((s, a) => s + a.remainingAmount, 0);

    // Filter expenses by period
    const filteredExpenses = (db.expenses || []).filter(exp => {
      if (period === 'all') return true;
      if (period === 'today') return isToday(exp.createdAt);

      const expDate = new Date(exp.createdAt);
      if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expDate >= oneWeekAgo;
      }
      if (period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        return exp.createdAt.startsWith(currentMonth);
      }
      return true;
    });

    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const drawerNetMovement = totalRevenue - totalAdvancesTaken + totalAdvancesRepaid - totalExpenses;

    // Employee ranking & performance
    const employeeRanking: EmployeeReportItem[] = db.employees.map(emp => {
      const empOps = filteredOps.filter(o => o.employeeId === emp.id);
      const clientsCount = empOps.length;
      const empRev = empOps.reduce((s, o) => s + o.amount, 0);

      const empAdvs = filteredAdvances.filter(a => a.employeeId === emp.id);
      const advTaken = empAdvs.reduce((s, a) => s + a.amount, 0);
      const advRemaining = empAdvs.reduce((s, a) => s + a.remainingAmount, 0);

      return {
        id: emp.id,
        name: emp.name,
        clientsCount,
        totalRevenue: empRev,
        advancesTaken: advTaken,
        advancesRemaining: advRemaining,
        netContribution: empRev - advRemaining,
      };
    });

    // Sort by revenue & client count descending
    employeeRanking.sort((a, b) => b.totalRevenue - a.totalRevenue || b.clientsCount - a.clientsCount);

    return {
      period,
      totalClients,
      totalRevenue,
      totalAdvancesTaken,
      totalAdvancesRepaid,
      remainingAdvancesDebt,
      totalExpenses,
      drawerNetMovement,
      serviceCounts,
      employeeRanking,
    };
  },

  exportToExcel(period: 'today' | 'week' | 'month' | 'all'): void {
    const report = this.getPeriodReport(period);
    const db = dbStorage.getDb();
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      { 'البيان': 'اسم الصالون', 'القيمة': db.settings.shopName },
      { 'البيان': 'تاريخ التقرير', 'القيمة': formatDateTime(new Date().toISOString()) },
      { 'البيان': 'الفترة المحددة', 'القيمة': period === 'today' ? 'اليوم' : period === 'week' ? 'هذا الأسبوع' : period === 'month' ? 'هذا الشهر' : 'الكل' },
      { 'البيان': 'إجمالي العملاء', 'القيمة': report.totalClients },
      { 'البيان': 'إجمالي إيراد الحلاقة (جنيه)', 'القيمة': report.totalRevenue },
      { 'البيان': 'إجمالي السلف المأخوذة من الدرج (جنيه)', 'القيمة': report.totalAdvancesTaken },
      { 'البيان': 'إجمالي السلف المستردة للدرج (جنيه)', 'القيمة': report.totalAdvancesRepaid },
      { 'البيان': 'متبقي السلف كمديونية (جنيه)', 'القيمة': report.remainingAdvancesDebt },
      { 'البيان': 'إجمالي مصاريف ومستلزمات المحل (جنيه)', 'القيمة': report.totalExpenses },
      { 'البيان': 'صافي حركة درج المحل (جنيه)', 'القيمة': report.drawerNetMovement },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص_الحسابات');

    // 2. Barbers Performance Sheet
    const staffData = report.employeeRanking.map((emp, idx) => ({
      'الترتيب': idx + 1,
      'اسم الموظف': emp.name,
      'عدد العملاء': emp.clientsCount,
      'إجمالي الدخل المحصل': emp.totalRevenue,
      'السلف المأخوذة': emp.advancesTaken,
      'المتبقي من السلف': emp.advancesRemaining,
    }));
    const wsStaff = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, wsStaff, 'أداء_الموظفين');

    // 3. Operations Sheet
    const opsData = db.operations.map(o => ({
      'رقم العملية': o.operationNumber,
      'التاريخ': formatDateTime(o.createdAt),
      'الموظف': o.employeeName,
      'نوع الحلاقة': o.serviceName,
      'المبلغ': o.amount,
      'ملاحظات': o.notes || '',
      'تعديل بواسطة الأدمن': o.isModifiedByAdmin ? `نعم (${o.adminModificationNote || ''})` : 'لا',
    }));
    const wsOps = XLSX.utils.json_to_sheet(opsData);
    XLSX.utils.book_append_sheet(wb, wsOps, 'سجل_الحلاقة');

    // 4. Advances Sheet
    const advData = db.advances.map(a => ({
      'كود السلفة': a.advanceNumber,
      'تاريخ السلفة': formatDateTime(a.createdAt),
      'الموظف': a.employeeName,
      'المبلغ الأصلي': a.amount,
      'المبلغ المسترد': a.repaidAmount,
      'المتبقي': a.remainingAmount,
      'سبب السلفة': a.reason,
      'الحالة': a.status === 'PENDING' ? 'بانتظار المراجعة' : a.status === 'APPROVED' ? 'معتمدة' : a.status === 'PARTIALLY_REPAID' ? 'سداد جزئي' : 'مسددة بالكامل',
    }));
    const wsAdv = XLSX.utils.json_to_sheet(advData);
    XLSX.utils.book_append_sheet(wb, wsAdv, 'سجل_السلف');

    // 5. Expenses Sheet
    const expData = (db.expenses || []).map(e => ({
      'كود المصروف': e.expenseNumber,
      'التاريخ والوقت': formatDateTime(e.createdAt),
      'اسم الصنف / المستلزمات': e.itemName,
      'المبلغ (جنيه)': e.amount,
      'الكمية': e.quantity || '',
      'التصنيف': e.category || '',
      'المشتري / المسجل': e.recordedByName,
      'ملاحظات': e.notes || '',
    }));
    const wsExp = XLSX.utils.json_to_sheet(expData);
    XLSX.utils.book_append_sheet(wb, wsExp, 'سجل_المصاريف_والمستلزمات');

    // 6. Daily Financial Breakdown Sheet (الإيراد اليومي بالتاريخ)
    const dailyRecords = this.getDailyFinancialRecords(period);
    const dailyData = dailyRecords.map(d => ({
      'التاريخ': d.date,
      'اليوم': d.dayName,
      'عدد الزبائن': d.clientsCount,
      'إيراد الحلاقة (جنيه)': d.revenue,
      'السلف المسحوبة (جنيه)': d.advancesTaken,
      'السلف المستردة (جنيه)': d.advancesRepaid,
      'مصاريف ومستلزمات (جنيه)': d.expenses,
      'صافي حركة الدرج (جنيه)': d.netDrawerCash,
      'أعلى حلاق إيراداً': d.topEmployeeName,
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'الإيراد_اليومي_بالتاريخ');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `تقرير_الصالون_${period}_${dateStr}.xlsx`);
  },

  getDailyFinancialRecords(
    period: 'today' | 'week' | 'month' | 'all' | 'custom' = 'all',
    customDate?: string
  ): DailyFinancialRecord[] {
    const db = dbStorage.getDb();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMonthStr = todayStr.slice(0, 7);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Collect all distinct dates from operations, advances, expenses + today
    const dateSet = new Set<string>();
    dateSet.add(todayStr);
    db.operations.forEach(o => {
      if (o.createdAt) dateSet.add(o.createdAt.slice(0, 10));
    });
    db.advances.forEach(a => {
      if (a.createdAt) dateSet.add(a.createdAt.slice(0, 10));
    });
    (db.expenses || []).forEach(e => {
      if (e.createdAt) dateSet.add(e.createdAt.slice(0, 10));
    });

    const dayNamesArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const sortedDates = Array.from(dateSet).sort().reverse();

    const filteredDates = sortedDates.filter(dStr => {
      if (period === 'today') return dStr === todayStr;
      if (period === 'custom' && customDate) return dStr === customDate;
      if (period === 'week') {
        const d = new Date(dStr + 'T12:00:00');
        return d >= oneWeekAgo;
      }
      if (period === 'month') {
        return dStr.startsWith(currentMonthStr);
      }
      return true; // 'all'
    });

    return filteredDates.map(dStr => {
      const d = new Date(dStr + 'T12:00:00');
      const dayName = isNaN(d.getTime()) ? '' : dayNamesArabic[d.getDay()];

      const ops = db.operations.filter(o => o.createdAt && o.createdAt.startsWith(dStr));
      const advs = db.advances.filter(a => a.createdAt && a.createdAt.startsWith(dStr));
      const exps = (db.expenses || []).filter(e => e.createdAt && e.createdAt.startsWith(dStr));

      const revenue = ops.reduce((sum, o) => sum + o.amount, 0);
      const clientsCount = ops.length;
      const advancesTaken = advs.reduce((sum, a) => sum + a.amount, 0);
      const advancesRepaid = advs.reduce((sum, a) => sum + a.repaidAmount, 0);
      const expenses = exps.reduce((sum, e) => sum + e.amount, 0);
      const netDrawerCash = revenue - advancesTaken + advancesRepaid - expenses;

      // Group by employee for this date
      const empMap: Record<string, { clientsCount: number; revenue: number }> = {};
      ops.forEach(o => {
        if (!empMap[o.employeeName]) {
          empMap[o.employeeName] = { clientsCount: 0, revenue: 0 };
        }
        empMap[o.employeeName].clientsCount += 1;
        empMap[o.employeeName].revenue += o.amount;
      });

      const employeeBreakdown = Object.entries(empMap)
        .map(([name, data]) => ({
          name,
          clientsCount: data.clientsCount,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const topEmployeeName = employeeBreakdown.length > 0 ? employeeBreakdown[0].name : '-';

      return {
        date: dStr,
        dayName,
        formattedDate: dStr,
        clientsCount,
        revenue,
        advancesTaken,
        advancesRepaid,
        expenses,
        netDrawerCash,
        topEmployeeName,
        operationsCount: ops.length,
        employeeBreakdown,
      };
    });
  },
};
