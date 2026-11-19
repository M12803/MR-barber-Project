import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, generateId } from '../../lib/utils';
import { dbStorage } from '../../lib/db/storage';
import { auditService } from '../../services/auditService';
import { Employee, CompensationType, CommissionBasis } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Users, UserPlus, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [compType, setCompType] = useState<CompensationType>('PERCENTAGE');
  const [rateOrAmount, setRateOrAmount] = useState<string>('40');
  const [baseSalary, setBaseSalary] = useState<string>('0');
  const [commissionBasis, setCommissionBasis] = useState<CommissionBasis>('COLLECTED_AMOUNT');
  const [userPin, setUserPin] = useState<string>('1111');

  const openAddModal = () => {
    const nextCode = `EMP-0${db.employees.length + 1}`;
    setCode(nextCode);
    setFullName('');
    setRoleTitle('حلاق محترف');
    setPhone('');
    setCompType('PERCENTAGE');
    setRateOrAmount('40');
    setBaseSalary('0');
    setCommissionBasis('COLLECTED_AMOUNT');
    setUserPin('1111');
    setEditingEmp(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setCode(emp.code);
    setFullName(emp.fullName);
    setRoleTitle(emp.roleTitle);
    setPhone(emp.phone || '');
    setCompType(emp.compensationRule.type);
    setRateOrAmount(String(emp.compensationRule.rateOrAmount));
    setBaseSalary(String(emp.compensationRule.baseSalary || 0));
    setCommissionBasis(emp.compensationRule.commissionBasis);
    setIsAddModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!fullName.trim() || !code.trim()) {
      alert('يرجى ملء الاسم الكامل وكود الموظف');
      return;
    }

    if (editingEmp) {
      // Update
      dbStorage.updateDb(d => {
        const emp = d.employees.find(x => x.id === editingEmp.id);
        if (emp) {
          emp.fullName = fullName.trim();
          emp.code = code.trim();
          emp.roleTitle = roleTitle.trim();
          emp.phone = phone.trim();
          emp.compensationRule = {
            type: compType,
            rateOrAmount: Number(rateOrAmount) || 0,
            baseSalary: Number(baseSalary) || 0,
            commissionBasis,
            effectiveFrom: new Date().toISOString(),
          };
        }
      });

      auditService.log(
        currentUser.id,
        currentUser.displayName,
        currentUser.role,
        'UPDATE_EMPLOYEE',
        'EMPLOYEE',
        editingEmp.id,
        `تعديل بيانات الحلاق: ${fullName} وقواعد استحقاقه`
      );
    } else {
      // Create new
      const newEmpId = generateId('emp');
      const newEmployee: Employee = {
        id: newEmpId,
        code: code.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        roleTitle: roleTitle.trim(),
        status: 'ACTIVE',
        joinDate: new Date().toISOString().slice(0, 10),
        compensationRule: {
          type: compType,
          rateOrAmount: Number(rateOrAmount) || 0,
          baseSalary: Number(baseSalary) || 0,
          commissionBasis,
          effectiveFrom: new Date().toISOString(),
        },
      };

      // Also create login user account
      const username = code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newUser = {
        id: generateId('usr'),
        username,
        displayName: fullName.trim(),
        role: 'EMPLOYEE' as const,
        employeeId: newEmpId,
        pinCode: userPin || '1111',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      dbStorage.updateDb(d => {
        d.employees.push(newEmployee);
        d.users.push(newUser);
      });

      auditService.log(
        currentUser.id,
        currentUser.displayName,
        currentUser.role,
        'CREATE_EMPLOYEE',
        'EMPLOYEE',
        newEmpId,
        `إضافة حلاق جديد إلى الفريق: ${fullName} (${code})`
      );
    }

    setIsAddModalOpen(false);
    refreshDb();
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    if (!currentUser) return;
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    dbStorage.updateDb(d => {
      const e = d.employees.find(x => x.id === emp.id);
      if (e) e.status = newStatus;
      // also deactivate their user account
      const u = d.users.find(x => x.employeeId === emp.id);
      if (u) u.isActive = newStatus === 'ACTIVE';
    });

    auditService.log(
      currentUser.id,
      currentUser.displayName,
      currentUser.role,
      'TOGGLE_EMPLOYEE_STATUS',
      'EMPLOYEE',
      emp.id,
      `تغيير حالة الموظف ${emp.fullName} إلى ${newStatus}`
    );
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            <span>فريق العمل والعمولات (Staff & Payroll Rules)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة ملفات الحلاقين، حسابات العمولات المخصصة، وحسابات الدخول
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={openAddModal}>
          <UserPlus className="w-4 h-4 ml-1.5" />
          إضافة حلاق جديد
        </Button>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {db.employees.map(emp => {
          const empTx = db.transactions.filter(t => t.employeeId === emp.id && t.status !== 'VOIDED');
          const totalEarned = empTx.reduce((s, t) => s + t.commissionSnapshot.totalCommission, 0);
          const totalServices = empTx.reduce((s, t) => s + t.collectedAmount, 0);
          const empAdvances = db.advanceRequests.filter(a => a.employeeId === emp.id);
          const remainingDebt = empAdvances
            .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
            .reduce((s, a) => s + a.remainingBalance, 0);

          return (
            <div
              key={emp.id}
              className={`bg-dark-900 border rounded-2xl p-5 flex flex-col justify-between transition ${
                emp.status === 'ACTIVE'
                  ? 'border-dark-800 hover:border-gold-500/30'
                  : 'border-dark-800/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg font-display">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{emp.fullName}</h4>
                      <p className="text-xs text-slate-400">{emp.roleTitle}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {emp.code}
                  </Badge>
                </div>

                {/* Compensation Rule Badge */}
                <div className="p-3 bg-dark-850 rounded-xl space-y-1 text-xs mb-4">
                  <div className="flex justify-between text-slate-400">
                    <span>نظام الحساب:</span>
                    <span className="font-semibold text-gold-400">
                      {emp.compensationRule.type === 'PERCENTAGE'
                        ? `نسبة مئوية (${emp.compensationRule.rateOrAmount}%)`
                        : emp.compensationRule.type === 'FIXED_PER_SERVICE'
                        ? `مبلغ ثابت (${emp.compensationRule.rateOrAmount} ج.م / خدمة)`
                        : emp.compensationRule.type === 'SALARY_PLUS_COMMISSION'
                        ? `راتب ${emp.compensationRule.baseSalary} + ${emp.compensationRule.rateOrAmount}%`
                        : 'راتب شهري ثابت'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>أساس احتساب النسبة:</span>
                    <span className="text-slate-300">
                      {emp.compensationRule.commissionBasis === 'COLLECTED_AMOUNT'
                        ? 'المحصل الفعلي'
                        : 'سعر القائمة'}
                    </span>
                  </div>
                  {emp.phone && (
                    <div className="flex justify-between text-slate-400">
                      <span>الهاتف:</span>
                      <span className="font-mono text-slate-300">{emp.phone}</span>
                    </div>
                  )}
                </div>

                {/* Lifetime / Current Financial Snapshot */}
                <div className="space-y-1.5 text-xs border-t border-dark-800 pt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي قيمة الخدمات المنفذة:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatCurrency(totalServices)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي العمولات المكتسبة:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(totalEarned)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>مديونية السلف المتبقية:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatCurrency(remainingDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-dark-800/80">
                    <span>صافي الاستحقاق التقديري:</span>
                    <span className="font-mono text-gold-400">
                      {formatCurrency(totalEarned - remainingDebt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-dark-800">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(emp)}
                >
                  <Edit3 className="w-3.5 h-3.5 ml-1" />
                  تعديل القواعد
                </Button>
                <Button
                  variant={emp.status === 'ACTIVE' ? 'ghost' : 'outline-gold'}
                  size="sm"
                  onClick={() => toggleEmployeeStatus(emp)}
                >
                  {emp.status === 'ACTIVE' ? 'تعطيل الحساب' : 'تنشيط'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingEmp ? 'تعديل بيانات الحلاق وقواعد العمولة' : 'إضافة حلاق جديد إلى الصالون'}
        subtitle="تحديد نسبة العمولة وقواعد الاحتساب بدون تعديل السجلات التاريخية القديمة"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">الاسم الكامل:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثال: أحمد عبد الله"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">كود الموظف:</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="EMP-05"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">المسمى الوظيفي:</label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="حلاق محترف"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف:</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div className="p-3 bg-dark-850 rounded-xl border border-dark-750 space-y-3">
            <h4 className="font-bold text-gold-400">قواعد احتساب العمولة والاستحقاق:</h4>

            <div>
              <label className="block text-slate-400 mb-1">نوع الاستحقاق:</label>
              <select
                value={compType}
                onChange={e => setCompType(e.target.value as CompensationType)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-500/50"
              >
                <option value="PERCENTAGE">نسبة مئوية من قيمة الخدمات (%)</option>
                <option value="FIXED_PER_SERVICE">مبلغ ثابت لكل خدمة منفذة (ج.م)</option>
                <option value="SALARY_PLUS_COMMISSION">راتب ثابت شهري + نسبة مئوية</option>
                <option value="FIXED_SALARY">راتب ثابت فقط</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  {compType === 'PERCENTAGE' || compType === 'SALARY_PLUS_COMMISSION'
                    ? 'نسبة العمولة (%)'
                    : 'مبلغ العمولة للخدمة (ج.م)'}
                </label>
                <input
                  type="number"
                  value={rateOrAmount}
                  onChange={e => setRateOrAmount(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              {(compType === 'SALARY_PLUS_COMMISSION' || compType === 'FIXED_SALARY') && (
                <div>
                  <label className="block text-slate-400 mb-1">الراتب الثابت (ج.م):</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={e => setBaseSalary(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              )}
            </div>
          </div>

          {!editingEmp && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                رمز الدخول السريع (PIN Code):
              </label>
              <input
                type="text"
                maxLength={4}
                value={userPin}
                onChange={e => setUserPin(e.target.value)}
                placeholder="1111"
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                مكون من 4 أرقام لتسجيل الدخول والتبديل السريع على كمبيوتر الصالون
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" type="submit">
              {editingEmp ? 'حفظ التعديلات' : 'إضافة الموظف والحساب'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
