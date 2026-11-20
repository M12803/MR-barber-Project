import * as XLSX from 'xlsx';
import { dbStorage } from '../lib/db/storage';
import { formatDateTime } from '../lib/utils';

export const exportService = {
  exportFullWorkbook(): void {
    const db = dbStorage.getDb();
    const wb = XLSX.utils.book_new();

    // 1. SUMMARY SHEET
    const totalRevenue = db.transactions
      .filter(t => t.status !== 'VOIDED')
      .reduce((sum, t) => sum + t.collectedAmount, 0);
    const totalCommissions = db.transactions
      .filter(t => t.status !== 'VOIDED')
      .reduce((sum, t) => sum + t.commissionSnapshot.totalCommission, 0);
    const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAdvancesOut = db.advanceRequests
      .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
      .reduce((sum, a) => sum + (a.disbursedAmount || 0), 0);
    const totalAdvancesOutstanding = db.advanceRequests
      .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
      .reduce((sum, a) => sum + a.remainingBalance, 0);

    const cashboxBalance = db.cashboxLedger.length > 0 
      ? db.cashboxLedger[db.cashboxLedger.length - 1].runningBalance 
      : 0;

    const summaryData = [
      { 'البند': 'اسم الصالون', 'القيمة': db.settings.shopName },
      { 'البند': 'تاريخ التقرير', 'القيمة': formatDateTime(new Date().toISOString()) },
      { 'البند': 'العملة', 'القيمة': db.settings.currency },
      { 'البند': 'إجمالي إيراد الخدمات (المحصل)', 'القيمة': totalRevenue },
      { 'البند': 'إجمالي عمولات العاملين المستحقة', 'القيمة': totalCommissions },
      { 'البند': 'إجمالي المصروفات العامة', 'القيمة': totalExpenses },
      { 'البند': 'صافي دخل الصالون التقديري (قبل المصروفات)', 'القيمة': totalRevenue - totalCommissions },
      { 'البند': 'صافي دخل الصالون التقديري (بعد المصروفات)', 'القيمة': totalRevenue - totalCommissions - totalExpenses },
      { 'البند': 'إجمالي السلف المصروفة', 'القيمة': totalAdvancesOut },
      { 'البند': 'إجمالي السلف المتبقية كمديونية', 'القيمة': totalAdvancesOutstanding },
      { 'البند': 'رصيد الخزينة الحالي (الكاش)', 'القيمة': cashboxBalance },
      { 'البند': 'إجمالي عدد التذاكر', 'القيمة': db.transactions.length },
      { 'البند': 'عدد الموظفين النشطين', 'القيمة': db.employees.filter(e => e.status === 'ACTIVE').length },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص_العام');

    // 2. OPERATIONS SHEET
    const operationsData = db.transactions.map(t => ({
      'رقم التذكرة': t.ticketNumber,
      'التاريخ والوقت': formatDateTime(t.createdAt),
      'اسم الموظف': t.employeeName,
      'اسم العميل': t.customerName || 'عميل نقدي',
      'الإجمالي قبل الخصم': t.grossTotal,
      'الخصم': t.discountTotal,
      'الصافي': t.netTotal,
      'المبلغ المحصل': t.collectedAmount,
      'المستلم من العميل': t.amountReceived || t.collectedAmount,
      'الباقي للعميل': t.changeAmount || 0,
      'طريقة الدفع': t.paymentMethod,
      'عمولة الموظف': t.commissionSnapshot.totalCommission,
      'الحالة': t.status,
    }));
    const wsOps = XLSX.utils.json_to_sheet(operationsData);
    XLSX.utils.book_append_sheet(wb, wsOps, 'العمليات_التذاكر');

    // 3. OPERATION ITEMS SHEET
    const itemsData: any[] = [];
    db.transactions.forEach(t => {
      t.items.forEach(item => {
        itemsData.push({
          'رقم التذكرة': t.ticketNumber,
          'تاريخ التذكرة': formatDateTime(t.createdAt),
          'الموظف': t.employeeName,
          'الخدمة': item.serviceName,
          'السعر الأساسي': item.unitPrice,
          'الخصم': item.discount,
          'السعر النهائي': item.finalPrice,
          'العمولة المحتسبة': item.commissionEarned,
          'حالة التذكرة': t.status,
        });
      });
    });
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'تفاصيل_الخدمات');

    // 4. PAYMENTS SHEET
    const paymentsData = db.transactions.map(t => ({
      'رقم التذكرة': t.ticketNumber,
      'التاريخ': formatDateTime(t.createdAt),
      'طريقة الدفع': t.paymentMethod,
      'المبلغ': t.collectedAmount,
      'العميل': t.customerName,
      'الموظف': t.employeeName,
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'المدفوعات');

    // 5. EMPLOYEES SHEET
    const employeesData = db.employees.map(e => ({
      'كود الموظف': e.code,
      'الاسم الكامل': e.fullName,
      'المسمى الوظيفي': e.roleTitle,
      'رقم الهاتف': e.phone || '',
      'تاريخ الانضمام': e.joinDate,
      'نظام العمولة': e.compensationRule.type,
      'النسبة / القيمة': e.compensationRule.rateOrAmount,
      'الراتب الأساسي': e.compensationRule.baseSalary || 0,
      'الحالة': e.status === 'ACTIVE' ? 'نشط' : 'معطل',
    }));
    const wsEmployees = XLSX.utils.json_to_sheet(employeesData);
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'دليل_الموظفين');

    // 6. EMPLOYEE ACCOUNTS & COMMISSIONS
    const employeeAccounts = db.employees.map(emp => {
      const empTx = db.transactions.filter(t => t.employeeId === emp.id && t.status !== 'VOIDED');
      const totalServiceVal = empTx.reduce((s, t) => s + t.collectedAmount, 0);
      const totalCommissionsEarned = empTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);
      const empAdvances = db.advanceRequests.filter(a => a.employeeId === emp.id);
      const remainingDebt = empAdvances.reduce((s, a) => s + a.remainingBalance, 0);

      return {
        'كود الموظف': emp.code,
        'اسم الموظف': emp.fullName,
        'عدد التذاكر المنجزة': empTx.length,
        'إجمالي قيمة الخدمات': totalServiceVal,
        'إجمالي العمولات المستحقة': totalCommissionsEarned,
        'مديونية السلف المتبقية': remainingDebt,
        'صافي الاستحقاق التقديري': totalCommissionsEarned - remainingDebt,
      };
    });
    const wsEmpAcc = XLSX.utils.json_to_sheet(employeeAccounts);
    XLSX.utils.book_append_sheet(wb, wsEmpAcc, 'حسابات_وعمولات_العاملين');

    // 7. ADVANCES SHEET
    const advancesData = db.advanceRequests.map(a => ({
      'كود السلفة': a.id,
      'اسم الموظف': a.employeeName,
      'المبلغ المطلوب': a.requestedAmount,
      'المبلغ المعتمد': a.approvedAmount || 0,
      'المصروف فعلياً': a.disbursedAmount || 0,
      'الرصيد المتبقي': a.remainingBalance,
      'سبب السلفة': a.reason,
      'الحالة': a.status,
      'تاريخ الطلب': formatDateTime(a.requestDate),
      'تاريخ الصرف': a.disbursementDate ? formatDateTime(a.disbursementDate) : '-',
    }));
    const wsAdvances = XLSX.utils.json_to_sheet(advancesData);
    XLSX.utils.book_append_sheet(wb, wsAdvances, 'سجل_السلف');

    // 8. EXPENSES SHEET
    const expensesData = db.expenses.map(e => ({
      'التاريخ': formatDateTime(e.date),
      'بند المصروف': e.categoryName,
      'المبلغ': e.amount,
      'طريقة الدفع': e.paymentMethod,
      'البيان والتفاصيل': e.description,
      'سجله': e.createdByName,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات');

    // 9. CASHBOX SHEET
    const cashboxData = db.cashboxLedger.map(c => ({
      'التاريخ والوقت': formatDateTime(c.timestamp),
      'نوع الحركة': c.type,
      'المبلغ (+/-)': c.amount,
      'رصيد الخزينة بعد الحركة': c.runningBalance,
      'المرجع': c.sourceReference,
      'البيان': c.description,
    }));
    const wsCashbox = XLSX.utils.json_to_sheet(cashboxData);
    XLSX.utils.book_append_sheet(wb, wsCashbox, 'سجل_حركة_الخزينة');

    // 10. AUDIT LOG SHEET
    const auditData = db.auditLogs.map(a => ({
      'الوقت': formatDateTime(a.timestamp),
      'المستخدم': a.actorName,
      'الدور': a.actorRole,
      'الحدث': a.action,
      'النوع': a.entityType,
      'التفاصيل': a.details,
    }));
    const wsAudit = XLSX.utils.json_to_sheet(auditData);
    XLSX.utils.book_append_sheet(wb, wsAudit, 'سجل_الرقابة_والأمان');

    // Generate filename: Mohamed_Ramshan_Management_YYYY-MM-DD_HH-mm.xlsx
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `Mohamed_Ramshan_Management_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(wb, filename);
  },
};
