import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { UserCheck, ShieldCheck, Delete, ArrowRight } from 'lucide-react';

interface QuickSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSwitchModal: React.FC<QuickSwitchModalProps> = ({ isOpen, onClose }) => {
  const { db, quickSwitch, currentUser } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const activeUsers = db.users.filter(u => u.isActive);
  const selectedUser = activeUsers.find(u => u.id === selectedUserId);

  const handleDigit = (d: string) => {
    if (pin.length < 8) {
      const nextPin = pin + d;
      setPin(nextPin);
      setError('');
      // If employee PIN is 4 digits and selectedUser is employee
      if (selectedUser?.role === 'EMPLOYEE' && nextPin.length === 4) {
        attemptSwitch(nextPin);
      }
    }
  };

  const attemptSwitch = (pinToTest: string) => {
    if (!pinToTest.trim()) return;
    const res = quickSwitch(pinToTest.trim(), selectedUserId || undefined);
    if (res.success) {
      setPin('');
      setSelectedUserId(null);
      setError('');
      onClose();
    } else {
      setError(res.error || 'رمز الدخول غير صحيح');
      setPin('');
    }
  };

  const resetSelection = () => {
    setSelectedUserId(null);
    setPin('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetSelection();
        onClose();
      }}
      title="تبديل المستخدم السريع"
      subtitle="اختر الموظف أو أدخل رمز الدخول الخاص بك"
      maxWidth="md"
    >
      {!selectedUser ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">اختر حسابك للانتقال إلى شاشة الدخول السريع:</p>
          <div className="grid grid-cols-2 gap-3">
            {activeUsers.map(user => {
              const isCurrent = user.id === currentUser?.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setPin('');
                    setError('');
                  }}
                  className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between h-24 ${
                    isCurrent
                      ? 'bg-gold-500/10 border-gold-500/40 text-gold-300'
                      : 'bg-dark-800 hover:bg-dark-750 border-dark-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold truncate">{user.displayName}</span>
                    {user.role === 'ADMIN' ? (
                      <ShieldCheck className="w-4 h-4 text-gold-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
                    <span>{user.role === 'ADMIN' ? 'إدارة' : 'حلاق'}</span>
                    {isCurrent && <span className="text-[10px] text-gold-400 font-bold">الحساب الحالي</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onClick={resetSelection}
            className="self-start flex items-center gap-1.5 text-xs text-gold-400 hover:underline mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لاختيار موظف آخر</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg mb-2">
            {selectedUser.displayName.charAt(0)}
          </div>
          <h4 className="text-base font-bold text-slate-100">{selectedUser.displayName}</h4>
          <p className="text-xs text-slate-400 mb-3">
            {selectedUser.role === 'ADMIN'
              ? 'أدخل كلمة مرور الأدمن للدخول'
              : 'أدخل رمز PIN السري (4 أرقام) للدخول'}
          </p>

          {/* Input field supporting keyboard typing & Enter key */}
          <div className="w-full max-w-xs mb-3">
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                setError('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  attemptSwitch(pin);
                }
              }}
              placeholder={selectedUser.role === 'ADMIN' ? 'كلمة المرور...' : '••••'}
              className="w-full bg-dark-850 border border-dark-700 rounded-2xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-gold-300 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-1.5 rounded-lg mb-3 text-center w-full max-w-xs">
              {error}
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                className="h-11 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-lg font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-11 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-semibold text-slate-400 hover:text-white transition active:scale-95"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-lg font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="h-11 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => attemptSwitch(pin)}
            className="w-full max-w-xs py-2.5 rounded-xl bg-gold-gradient text-dark-950 font-bold text-xs shadow-gold-sm hover:brightness-105 transition"
          >
            تأكيد الدخول
          </button>
        </div>
      )}
    </Modal>
  );
};
