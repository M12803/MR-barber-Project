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
    if (pin.length < 6) {
      const nextPin = pin + d;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        attemptSwitch(nextPin);
      }
    }
  };

  const attemptSwitch = (pinToTest: string) => {
    const res = quickSwitch(pinToTest);
    if (res.success) {
      setPin('');
      setSelectedUserId(null);
      setError('');
      onClose();
    } else {
      setError(res.error || 'رمز PIN غير صحيح');
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
          <p className="text-xs text-slate-400 mb-4">أدخل رمز PIN المكون من 4 أرقام</p>

          {/* PIN dots */}
          <div className="flex items-center gap-3 mb-4">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? 'bg-gold-500 border-gold-400 scale-110 shadow-gold-sm'
                    : 'bg-dark-800 border-dark-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-1 rounded-lg mb-3">
              {error}
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mb-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-12 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-lg font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="h-12 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-semibold text-slate-400 hover:text-white transition active:scale-95"
            >
              مسح
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-lg font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
            >
              0
            </button>
            <button
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="h-12 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
