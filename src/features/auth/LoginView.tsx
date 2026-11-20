import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User as UserType } from '../../types';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, UserCheck, KeyRound, ArrowRight, Delete, User } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { db, login } = useApp();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeUsers = db.users.filter(u => u.isActive);

  // When clicking an employee / admin card
  const handleSelectUser = (u: UserType) => {
    setSelectedUser(u);
    setUsername(u.username);
    setPin('');
    setError('');
  };

  // Back to user list
  const handleBackToList = () => {
    setSelectedUser(null);
    setPin('');
    setError('');
  };

  // Handle digit click on keypad
  const handleDigit = (d: string) => {
    if (pin.length < 8) {
      const nextPin = pin + d;
      setPin(nextPin);
      setError('');
    }
  };

  // Submit login for selected user
  const handleSelectedUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!pin.trim()) {
      setError('يرجى إدخال رمز الدخول (PIN)');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Strictly verify with selected user's username
      const res = login(selectedUser.username, pin.trim());
      if (!res.success) {
        setError(`رمز الدخول غير صحيح لحساب (${selectedUser.displayName})`);
        setPin('');
      }
      setIsLoading(false);
    }, 120);
  };

  // Submit manual login
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }
    if (!pin.trim()) {
      setError('يرجى إدخال رمز الدخول (PIN)');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username.trim(), pin.trim());
      if (!res.success) {
        setError(res.error || 'فشل تسجيل الدخول');
        setPin('');
      }
      setIsLoading(false);
    }, 120);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-dark-900 border border-gold-500/25 rounded-3xl p-7 shadow-2xl relative z-10 flex flex-col items-center">
        {/* Brand Logo */}
        <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-200 shadow-gold-md mb-3">
          <img
            src="/brand/logo.jpg"
            alt="MR Barbers"
            className="w-full h-full object-cover rounded-full bg-dark-950"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight bg-gradient-to-r from-gold-300 via-gold-500 to-amber-200 bg-clip-text text-transparent text-center">
          {db.settings.shopName}
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-5 text-center">
          {selectedUser
            ? `أدخل رمز الدخول (PIN) لحساب: ${selectedUser.displayName}`
            : isManualMode
            ? 'تسجيل الدخول اليدوي باسم المستخدم ورمز المرور'
            : 'اختر حسابك ثم أدخل رمز الدخول السري'}
        </p>

        {error && (
          <div className="w-full bg-red-950/60 border border-red-900/80 text-red-300 text-xs px-4 py-2.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* STATE 1: User Selected -> Enter PIN */}
        {selectedUser && (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleBackToList}
              className="self-start flex items-center gap-1.5 text-xs text-gold-400 hover:underline mb-4 font-semibold"
            >
              <ArrowRight className="w-4 h-4" />
              <span>اختيار موظف آخر</span>
            </button>

            {/* Selected User Badge */}
            <div className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-dark-850 border border-gold-500/30 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg font-display">
                {selectedUser.displayName.charAt(0)}
              </div>
              <div className="text-right flex-1">
                <span className="font-bold text-sm text-slate-100 block">
                  {selectedUser.displayName}
                </span>
                <span className="text-xs text-gold-400">
                  {selectedUser.role === 'ADMIN' ? 'المدير العام (المالك)' : 'حلاق الصالون'}
                </span>
              </div>
              {selectedUser.role === 'ADMIN' ? (
                <ShieldCheck className="w-5 h-5 text-gold-400" />
              ) : (
                <UserCheck className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* PIN Entry Form */}
            <form onSubmit={handleSelectedUserSubmit} className="w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
                  {selectedUser.role === 'ADMIN'
                    ? 'أدخل كلمة المرور (Mr3770):'
                    : 'أدخل رمز الدخول السري (PIN):'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    required
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value);
                      setError('');
                    }}
                    placeholder={selectedUser.role === 'ADMIN' ? 'كلمة المرور' : '••••'}
                    className="w-full bg-dark-850 border border-dark-700 rounded-xl pr-10 pl-3 py-2.5 text-center text-lg font-mono tracking-widest text-gold-300 focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Quick Keypad */}
              <div className="grid grid-cols-3 gap-2 w-full pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="h-11 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-base font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-11 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-xs font-semibold text-slate-400 hover:text-white transition active:scale-95"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-11 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-base font-bold font-mono text-slate-200 hover:text-gold-300 transition active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="h-11 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full mt-2 shadow-gold-md"
                isLoading={isLoading}
              >
                <span>دخول للحساب</span>
              </Button>
            </form>
          </div>
        )}

        {/* STATE 2: User List Selection (Default) */}
        {!selectedUser && !isManualMode && (
          <div className="w-full">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 text-right">
              اضغط على حسابك لإدخال الـ PIN الخاص بك:
            </span>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {activeUsers.map(user => {
                const isAdmin = user.role === 'ADMIN';
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between group ${
                      isAdmin
                        ? 'bg-gold-500/15 border-gold-500/40 text-gold-300 hover:bg-gold-500/25 shadow-gold-sm'
                        : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-200 hover:border-gold-500/40'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block group-hover:text-gold-300 transition">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAdmin ? 'المدير العام' : 'حلاق'}
                      </span>
                    </div>
                    {isAdmin ? (
                      <ShieldCheck className="w-4 h-4 text-gold-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-gold-400 transition" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsManualMode(true);
                setError('');
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-dark-700 text-xs text-slate-400 hover:text-slate-200 hover:border-gold-500/40 transition"
            >
              أو تسجيل الدخول باسم المستخدم يدوياً
            </button>
          </div>
        )}

        {/* STATE 3: Manual Login Form */}
        {!selectedUser && isManualMode && (
          <form onSubmit={handleManualSubmit} className="w-full space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsManualMode(false);
                setError('');
              }}
              className="self-start flex items-center gap-1.5 text-xs text-gold-400 hover:underline mb-2 font-semibold"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لاختيار الحسابات السريعة</span>
            </button>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المستخدم:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="مثال: Admin أو ahmed"
                  className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-10 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رمز الدخول السري (PIN / Password):
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-10 pl-3 py-2 text-xs text-slate-100 font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full mt-3 shadow-gold-md"
              isLoading={isLoading}
            >
              <span>دخول للنظام</span>
            </Button>
          </form>
        )}
      </div>

      <p className="text-[11px] text-slate-600 mt-6 font-mono text-center">
        Mohamed Ramadan Barber Shop Management System • v2.0
      </p>
    </div>
  );
};
