import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime, soundFx } from '../../lib/utils';
import { operationService } from '../../services/operationService';
import { advanceService } from '../../services/advanceService';
import { expenseService } from '../../services/expenseService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Scissors,
  HandCoins,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  Receipt,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

export const EmployeeHome: React.FC = () => {
  const { currentUser, db, refreshDb } = useApp();

  // Modals state
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // New Client Form
  const [selectedServiceId, setSelectedServiceId] = useState(db.services[0]?.id || '');
  const [serviceAmount, setServiceAmount] = useState(String(db.services[0]?.defaultPrice || 80));
  const [clientNotes, setClientNotes] = useState('');

  // Advance Form
  const [advanceAmount, setAdvanceAmount] = useState('200');
  const [advanceReason, setAdvanceReason] = useState('ظرف شخصي');

  // Expense Form
  const [expenseItem, setExpenseItem] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('100');
  const [expenseQuantity, setExpenseQuantity] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('مستلزمات حلاقة');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Active view tab in employee page: operations, advances, or expenses
  const [activeTab, setActiveTab] = useState<'operations' | 'advances' | 'expenses'>('operations');

  const employee = db.employees.find(e => e.id === currentUser?.employeeId);
  const employeeId = employee?.id || currentUser?.employeeId || '';
  const employeeName = employee?.name || currentUser?.displayName || 'الموظف';

  // Today's stats for this employee
  const todayOps = operationService.getTodayByEmployee(employeeId);
  const todayClientsCount = todayOps.length;
  const todayTotalRevenue = todayOps.reduce((sum, op) => sum + op.amount, 0);

  // Advances for this employee
  const myAdvances = advanceService.getByEmployee(employeeId);
  const totalAdvancesTaken = myAdvances.reduce((sum, a) => sum + a.amount, 0);
  const remainingAdvancesDebt = myAdvances.reduce((sum, a) => sum + a.remainingAmount, 0);

  // Handle service change to auto-fill default price
  const handleServiceChange = (srvId: string) => {
    setSelectedServiceId(srvId);
    const srv = db.services.find(s => s.id === srvId);
    if (srv) {
      setServiceAmount(String(srv.defaultPrice));
    }
  };

  // Submit New Client Operation
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const srv = db.services.find(s => s.id === selectedServiceId);
    const serviceName = srv ? srv.name : 'حلاقة';
    const amountNum = Number(serviceAmount);

    if (!amountNum || amountNum <= 0) {
      alert('يرجى تحديد المبلغ');
      return;
    }

    operationService.addOperation(employeeId, serviceName, amountNum, clientNotes);
    soundFx.playSuccess();
    soundFx.playCash();

    setIsNewClientOpen(false);
    setClientNotes('');
    refreshDb();
  };

  // Submit Advance Request
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(advanceAmount);

    if (!amountNum || amountNum <= 0) {
      alert('يرجى تحديد مبلغ السلفة');
      return;
    }

    advanceService.recordAdvance(employeeId, amountNum, advanceReason);
    soundFx.playSuccess();

    setIsAdvanceOpen(false);
    setAdvanceReason('ظرف شخصي');
    refreshDb();
  };

  // Submit Expense / Supplies Request
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);

    if (!amountNum || amountNum <= 0) {
      alert('يرجى تحديد المبلغ المدفوع للمستلزمات');
      return;
    }
    if (!expenseItem.trim()) {
      alert('يرجى كتابة اسم المستلزمات أو المصروف');
      return;
    }

    expenseService.recordExpense(
      currentUser?.id || employeeId,
      employeeName,
      expenseItem,
      amountNum,
      expenseQuantity,
      expenseCategory,
      expenseNotes
    );
    soundFx.playSuccess();
    soundFx.playCash();

    setIsExpenseOpen(false);
    setExpenseItem('');
    setExpenseAmount('100');
    setExpenseQuantity('');
    setExpenseNotes('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none max-w-5xl mx-auto w-full">
      {/* 1. Header Greeting Card */}
      <div className="bg-dark-900 border border-gold-500/25 p-6 rounded-3xl shadow-gold-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/40 text-gold-400 font-extrabold text-2xl flex items-center justify-center font-display shadow-inner">
            {employeeName.charAt(0)}
          </div>
          <div>
            <span className="text-xs text-gold-400/90 font-bold block mb-1">
              أهلاً بيك
            </span>
            <h2 className="text-2xl font-black text-slate-100 font-display">
              {employeeName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="gold">موظف</Badge>
              <span className="text-xs text-slate-400">
                {db.settings.shopName}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Outstanding Debt Info if any */}
        {remainingAdvancesDebt > 0 && (
          <div className="bg-dark-850 border border-amber-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <HandCoins className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">سلف مسجلة مستحقة عليك:</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {formatCurrency(remainingAdvancesDebt)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Today's Two Key Numbers (عملاء النهارده + إجمالي شغله) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Clients Today */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-6 rounded-3xl transition duration-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-400 block mb-2">
              عملاء النهارده
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-100 font-mono">
                {todayClientsCount}
              </span>
              <span className="text-sm font-semibold text-gold-400">عميل</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Today's Total Work */}
        <div className="bg-dark-900 border border-dark-800 hover:border-gold-500/40 p-6 rounded-3xl transition duration-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-400 block mb-2">
              إجمالي شغله النهارده
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gold-400 font-mono">
                {formatCurrency(todayTotalRevenue)}
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* 3. The Three Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Button 1: Record New Client */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsNewClientOpen(true);
          }}
          className="group relative p-6 rounded-3xl bg-gold-gradient text-dark-950 font-bold shadow-gold-md hover:shadow-gold-lg hover:brightness-105 transition-all duration-200 active:scale-95 flex flex-col justify-between text-right border border-gold-300/40 min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xl font-black font-display">
              ✂️ تسجيل عميل جديد
            </span>
            <div className="w-10 h-10 rounded-xl bg-dark-950/20 flex items-center justify-center group-hover:scale-110 transition">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-dark-900/80 font-medium mt-3">
            سجل الحلاقة والمبلغ اللي أخدته من العميل فوراً
          </p>
        </button>

        {/* Button 2: Record Advance */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsAdvanceOpen(true);
          }}
          className="group relative p-6 rounded-3xl bg-dark-900 hover:bg-dark-850 text-slate-100 font-bold border border-gold-500/30 hover:border-gold-400 shadow-sm hover:shadow-gold-sm transition-all duration-200 active:scale-95 flex flex-col justify-between text-right min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xl font-black font-display text-gold-400">
              💵 تسجيل سلفة
            </span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center group-hover:scale-110 transition">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-normal mt-3">
            سجل المبلغ اللي أخدته من درج المحل لحفظ الحسابات
          </p>
        </button>

        {/* Button 3: Record Expense / Supplies */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsExpenseOpen(true);
          }}
          className="group relative p-6 rounded-3xl bg-dark-900 hover:bg-dark-850 text-slate-100 font-bold border border-emerald-500/30 hover:border-emerald-400 shadow-sm hover:shadow-emerald-500/10 transition-all duration-200 active:scale-95 flex flex-col justify-between text-right min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xl font-black font-display text-emerald-400">
              🛍️ تسجيل مستلزمات ومصاريف
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-normal mt-3">
            شراء شفرات، كريمات، مناديل، شاي، أو أي مصاريف للمحل
          </p>
        </button>
      </div>

      {/* 4. Tabbed History (تسجيلاتي اليوم + سلفي المسجلة + مستلزمات ومصاريف المحل) */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Tab Headers */}
        <div className="p-4 border-b border-dark-800 bg-dark-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'operations'
                  ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              زبائني اليوم ({todayOps.length})
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'advances'
                  ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سلفي المسجلة ({myAdvances.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'expenses'
                  ? 'bg-emerald-500 text-dark-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مستلزمات ومصاريف المحل ({(db.expenses || []).length})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:block">
            * السجلات محفوظة مركزياً في حسابات المحل عند الأدمن
          </span>
        </div>

        {/* Tab Content: Operations */}
        {activeTab === 'operations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
                <tr>
                  <th className="p-4">رقم العملية</th>
                  <th className="p-4">نوع الحلاقة</th>
                  <th className="p-4">المبلغ المستلم</th>
                  <th className="p-4">الوقت</th>
                  <th className="p-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-200">
                {todayOps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      لم تقم بتسجيل أي عملاء بعد اليوم. اضغط على «تسجيل عميل جديد» للبدء.
                    </td>
                  </tr>
                ) : (
                  todayOps.map(op => (
                    <tr key={op.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 font-bold font-mono text-gold-400">
                        {op.operationNumber}
                      </td>
                      <td className="p-4 font-semibold text-slate-100">
                        {op.serviceName}
                      </td>
                      <td className="p-4 font-bold font-mono text-emerald-400">
                        {formatCurrency(op.amount)}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(op.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="p-4 text-slate-400">
                        {op.notes || '-'}
                        {op.isModifiedByAdmin && (
                          <span className="text-[10px] text-amber-400 block mt-0.5">
                            (تم مراجعة المبلغ وتصحيحه من الإدارة)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Advances */}
        {activeTab === 'advances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
                <tr>
                  <th className="p-4">كود السلفة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">سبب السلفة</th>
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">المتبقي للرد</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-200">
                {myAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      لا توجد أي سلف مسجلة بحسابك.
                    </td>
                  </tr>
                ) : (
                  myAdvances.map(adv => (
                    <tr key={adv.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 font-bold font-mono text-gold-400">
                        {adv.advanceNumber}
                      </td>
                      <td className="p-4 font-bold font-mono text-amber-400">
                        {formatCurrency(adv.amount)}
                      </td>
                      <td className="p-4 text-slate-300">{adv.reason}</td>
                      <td className="p-4 font-mono text-slate-400">
                        {formatDateTime(adv.createdAt)}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {formatCurrency(adv.remainingAmount)}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            adv.status === 'REPAID'
                              ? 'success'
                              : adv.status === 'APPROVED'
                              ? 'gold'
                              : adv.status === 'PARTIALLY_REPAID'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {adv.status === 'PENDING'
                            ? 'بانتظار مراجعة الأدمن'
                            : adv.status === 'APPROVED'
                            ? 'معتمدة'
                            : adv.status === 'PARTIALLY_REPAID'
                            ? 'سداد جزئي'
                            : 'مسددة بالكامل'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Expenses & Supplies */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-dark-800/60 text-slate-400 font-semibold border-b border-dark-750">
                <tr>
                  <th className="p-4">كود المصروف</th>
                  <th className="p-4">الصنف / المستلزمات</th>
                  <th className="p-4">المبلغ المدفوع</th>
                  <th className="p-4">الكمية</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">المشتري / المسجل</th>
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-slate-200">
                {(!db.expenses || db.expenses.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      لا توجد أي مستلزمات أو مصاريف مسجلة بعد. اضغط على «تسجيل مستلزمات ومصاريف» للبدء.
                    </td>
                  </tr>
                ) : (
                  db.expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-dark-850/50 transition">
                      <td className="p-4 font-bold font-mono text-emerald-400">
                        {exp.expenseNumber}
                      </td>
                      <td className="p-4 font-bold text-slate-100">
                        {exp.itemName}
                      </td>
                      <td className="p-4 font-bold font-mono text-gold-400">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="p-4 text-slate-300 font-mono">
                        {exp.quantity || '-'}
                      </td>
                      <td className="p-4">
                        <Badge variant="neutral">
                          {exp.category || 'عام'}
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          {exp.recordedByName}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {formatDateTime(exp.createdAt)}
                      </td>
                      <td className="p-4 text-slate-400">
                        {exp.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal: تسجيل عميل جديد */}
      <Modal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        title="تسجيل حلاقة جديدة"
        subtitle="سجل نوع الحلاقة والمبلغ المحصل من العميل"
        maxWidth="md"
      >
        <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2">
              نوع الحلاقة:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {db.services.map(srv => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleServiceChange(srv.id)}
                    className={`p-3 rounded-2xl border text-right transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-gold-500/15 border-gold-500/50 text-gold-300 font-bold shadow-gold-sm'
                        : 'bg-dark-800 hover:bg-dark-750 border-dark-700 text-slate-200'
                    }`}
                  >
                    <span>{srv.name}</span>
                    <span className="font-mono text-xs opacity-70">
                      {formatCurrency(srv.defaultPrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              المبلغ اللي أخدته من العميل:
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="5"
                required
                value={serviceAmount}
                onChange={e => setServiceAmount(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-3 text-base font-bold font-mono text-gold-300 focus:outline-none focus:border-gold-500/60"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                جنيه
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              ملاحظات (اختياري):
            </label>
            <input
              type="text"
              value={clientNotes}
              onChange={e => setClientNotes(e.target.value)}
              placeholder="أي ملاحظة إضافية..."
              className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsNewClientOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="gold" size="lg" className="flex-1 shadow-gold-md">
              <CheckCircle2 className="w-5 h-5 ml-1.5" />
              <span>حفظ العميل</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: تسجيل سلفة */}
      <Modal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        title="تسجيل سلفة من الدرج"
        subtitle="سجل المبلغ الذي أخذته لتوثيقه في حركة نقدية المحل"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              المبلغ اللي أخدته:
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="10"
                required
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
                placeholder="200"
                className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-3 text-base font-bold font-mono text-amber-400 focus:outline-none focus:border-gold-500/60"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                جنيه
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              سبب السلفة:
            </label>
            <input
              type="text"
              required
              value={advanceReason}
              onChange={e => setAdvanceReason(e.target.value)}
              placeholder="مثال: ظرف شخصي، بنزين، مشوار..."
              className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div className="p-3 bg-dark-850 rounded-2xl border border-dark-750 space-y-2 text-slate-400 text-xs">
            <div className="flex justify-between">
              <span>اسم الموظف:</span>
              <span className="font-bold text-slate-200">{employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span>التاريخ والوقت:</span>
              <span className="font-mono text-slate-300">تلقائي (الآن)</span>
            </div>
            <div className="flex justify-between">
              <span>حالة التسجيل:</span>
              <Badge variant="warning">بانتظار مراجعة الأدمن</Badge>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsAdvanceOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="gold" size="lg" className="flex-1 shadow-gold-md">
              <HandCoins className="w-5 h-5 ml-1.5" />
              <span>تأكيد تسجيل السلفة</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal: تسجيل مستلزمات ومصاريف المحل */}
      <Modal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="تسجيل مستلزمات أو مصاريف للمحل"
        subtitle="سجل المشتريات والمستلزمات (شفرات، مناديل، شاي، صيانة...) لتوثيقها عند الأدمن"
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              اسم الصنف / المستلزمات:
            </label>
            <input
              type="text"
              required
              value={expenseItem}
              onChange={e => setExpenseItem(e.target.value)}
              placeholder="مثال: علبة شفرات دوركو، 5 باكت مناديل، شاي وسكر..."
              className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                المبلغ المدفوع (جنيه):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="100"
                  className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/60"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                  جنيه
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                الكمية / العدد (اختياري):
              </label>
              <input
                type="text"
                value={expenseQuantity}
                onChange={e => setExpenseQuantity(e.target.value)}
                placeholder="مثال: علبتين، كرتونة، 3 حبات..."
                className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              تصنيف المصروف:
            </label>
            <select
              value={expenseCategory}
              onChange={e => setExpenseCategory(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="مستلزمات حلاقة">✂️ مستلزمات حلاقة وعناية</option>
              <option value="نظافة وتعقيم">🧼 نظافة وتعقيم ومطهرات</option>
              <option value="ضيافة ومشروبات">☕ ضيافة ومشروبات (شاي، سكر، مياه)</option>
              <option value="صيانة وتصليح">🔧 صيانة وأدوات وكهرباء</option>
              <option value="فواتير ومصاريف عامة">📄 فواتير ومصاريف عامة</option>
              <option value="أخرى">📦 أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              ملاحظات إضافية (اختياري):
            </label>
            <input
              type="text"
              value={expenseNotes}
              onChange={e => setExpenseNotes(e.target.value)}
              placeholder="اسم المحل اللي اشتريت منه أو أي تفاصيل..."
              className="w-full bg-dark-800 border border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="p-3 bg-dark-850 rounded-2xl border border-dark-750 space-y-2 text-slate-400 text-xs">
            <div className="flex justify-between">
              <span>المشتري / المسجل:</span>
              <span className="font-bold text-slate-200">{employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span>التاريخ والوقت:</span>
              <span className="font-mono text-slate-300">تلقائي (الآن)</span>
            </div>
            <div className="flex justify-between">
              <span>جهة الحفظ:</span>
              <span className="text-emerald-400 font-bold">تسجل مباشرة في حسابات المحل للأدمن</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsExpenseOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="gold" size="lg" className="flex-1 shadow-gold-md">
              <ShoppingBag className="w-5 h-5 ml-1.5 text-dark-950" />
              <span>تأكيد وحفظ المستلزمات</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
