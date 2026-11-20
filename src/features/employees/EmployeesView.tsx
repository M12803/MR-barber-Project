import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, generateId } from '../../lib/utils';
import { dbStorage } from '../../lib/db/storage';
import { Employee } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Users, UserPlus, Edit2, KeyRound, Power, CheckCircle2 } from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { db, refreshDb } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pinCode, setPinCode] = useState('1111');

  const openAddModal = () => {
    setEditingEmp(null);
    setName('');
    setPhone('');
    setPinCode('1111');
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setPhone(emp.phone || '');
    setPinCode(emp.pinCode);
    setIsAddModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم الموظف');
      return;
    }

    if (editingEmp) {
      dbStorage.updateDb(d => {
        const emp = d.employees.find(x => x.id === editingEmp.id);
        if (emp) {
          emp.name = name.trim();
          emp.phone = phone.trim();
          emp.pinCode = pinCode.trim() || '1111';
        }
        // Update linked user
        const u = d.users.find(x => x.employeeId === editingEmp.id);
        if (u) {
          u.displayName = name.trim();
          u.pinCode = pinCode.trim() || '1111';
        }
      });
    } else {
      const newEmpId = generateId('emp');
      const newEmp: Employee = {
        id: newEmpId,
        name: name.trim(),
        phone: phone.trim(),
        pinCode: pinCode.trim() || '1111',
        isActive: true,
        joinDate: new Date().toISOString().slice(0, 10),
      };

      const username = `emp_${db.employees.length + 1}`;
      const newUser = {
        id: generateId('usr'),
        username,
        displayName: name.trim(),
        role: 'EMPLOYEE' as const,
        employeeId: newEmpId,
        pinCode: pinCode.trim() || '1111',
        isActive: true,
      };

      dbStorage.updateDb(d => {
        d.employees.push(newEmp);
        d.users.push(newUser);
      });
    }

    setIsAddModalOpen(false);
    refreshDb();
  };

  const toggleStatus = (emp: Employee) => {
    dbStorage.updateDb(d => {
      const e = d.employees.find(x => x.id === emp.id);
      if (e) e.isActive = !e.isActive;

      const u = d.users.find(x => x.employeeId === emp.id);
      if (u) u.isActive = !u.isActive;
    });
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 font-display">
            <Users className="w-5 h-5 text-gold-400" />
            <span>إدارة الموظفين (فريق الحلاقين)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل حسابات الحلاقين، تعيين رمز الدخول (PIN)، وإيقاف أو تنشيط الحسابات
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={openAddModal}>
          <UserPlus className="w-4 h-4 ml-1.5" />
          إضافة حلاق جديد
        </Button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {db.employees.map(emp => {
          const ops = db.operations.filter(o => o.employeeId === emp.id);
          const totalEarned = ops.reduce((s, o) => s + o.amount, 0);
          const advs = db.advances.filter(a => a.employeeId === emp.id);
          const remainingDebt = advs.reduce((s, a) => s + a.remainingAmount, 0);

          return (
            <div
              key={emp.id}
              className={`bg-dark-900 border rounded-3xl p-5 flex flex-col justify-between transition ${
                emp.isActive
                  ? 'border-dark-800 hover:border-gold-500/40'
                  : 'border-dark-800/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg font-display">
                    {emp.name.charAt(0)}
                  </div>
                  <Badge variant={emp.isActive ? 'success' : 'neutral'}>
                    {emp.isActive ? 'حساب نشط' : 'حساب موقوف'}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-slate-100">{emp.name}</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>رمز الدخول (PIN):</span>
                    <span className="font-mono font-bold text-gold-400">{emp.pinCode}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex justify-between">
                      <span>الهاتف:</span>
                      <span className="font-mono text-slate-300">{emp.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-dark-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي العملاء:</span>
                    <span className="font-mono font-bold text-slate-200">{ops.length} عميل</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي دخل الحلاقة:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(totalEarned)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>سلف متبقية:</span>
                    <span className="font-mono font-bold text-amber-400">{formatCurrency(remainingDebt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-dark-800">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(emp)}
                >
                  <Edit2 className="w-3.5 h-3.5 ml-1" />
                  تعديل
                </Button>
                <Button
                  variant={emp.isActive ? 'ghost' : 'outline-gold'}
                  size="sm"
                  onClick={() => toggleStatus(emp)}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{emp.isActive ? 'إيقاف' : 'تنشيط'}</span>
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
        title={editingEmp ? `تعديل حساب: ${editingEmp.name}` : 'إضافة موظف حلاق جديد'}
        subtitle="تحديد الاسم ورقم الهاتف ورمز الدخول السريع (PIN)"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">اسم الموظف:</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (اختياري):</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              رمز الدخول السري (PIN من 4 أرقام):
            </label>
            <input
              type="text"
              required
              maxLength={4}
              value={pinCode}
              onChange={e => setPinCode(e.target.value)}
              placeholder="1111"
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-base font-bold text-gold-300 tracking-widest focus:outline-none focus:border-gold-500/60"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              يدخل به الموظف إلى حسابه بسرعة على كمبيوتر الصالون
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="gold">
              {editingEmp ? 'حفظ التعديلات' : 'إضافة الموظف فوراً'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
