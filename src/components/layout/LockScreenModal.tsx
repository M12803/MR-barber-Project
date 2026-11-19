import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, ShieldCheck, Delete } from 'lucide-react';
import { Button } from '../ui/Button';

export const LockScreenModal: React.FC = () => {
  const { isLocked, unlockScreen, currentUser, db } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        // Auto attempt on 4 digits
        const res = unlockScreen(newPin);
        if (res.success) {
          setPin('');
        } else {
          setError(res.error || 'رمز PIN غير صحيح');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/95 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-sm bg-dark-900 border border-gold-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Crown & Logo */}
        <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-200 shadow-gold-md mb-4">
          <img
            src={db.settings.logoUrl || '/brand/logo.jpg'}
            alt="Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <div className="flex items-center gap-2 text-gold-400 mb-1">
          <Lock className="w-4 h-4" />
          <h2 className="text-xl font-extrabold font-display">الشاشة مقفلة</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          أدخل رمز الـ PIN الخاص بـ ({currentUser?.displayName}) لإلغاء القفل
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-gold-500 border-gold-400 scale-110 shadow-gold-sm'
                  : 'bg-dark-800 border-dark-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 px-3 py-1.5 rounded-lg mb-4">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-dark-850 hover:bg-dark-750 border border-dark-750 hover:border-gold-500/40 text-xl font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-xs font-semibold text-slate-400 hover:text-white transition active:scale-95"
          >
            مسح
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-dark-850 hover:bg-dark-750 border border-dark-750 hover:border-gold-500/40 text-xl font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          تلميح تجريبي: الرمز الافتراضي للإدارة هو <span className="text-gold-400 font-mono">1234</span>
        </p>
      </div>
    </div>
  );
};
