import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, UserCheck, KeyRound, Lock, User } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { db, login } = useApp();
  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, pin);
      if (!res.success) {
        setError(res.error || 'فشل تسجيل الدخول');
      }
      setIsLoading(false);
    }, 150);
  };

  const handleQuickSelect = (uname: string, defaultPin: string) => {
    setUsername(uname);
    setPin(defaultPin);
    login(uname, defaultPin);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-dark-900 border border-gold-500/25 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center">
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
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          تسجيل الدخول — اختر حسابك أو أدخل رمز الدخول
        </p>

        {error && (
          <div className="w-full bg-red-950/60 border border-red-900/80 text-red-300 text-xs px-4 py-2.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* Quick Selection Cards for Barbers & Admin */}
        <div className="w-full mb-6">
          <span className="text-[11px] font-bold text-slate-400 block mb-2 text-right">
            اختر حسابك للدخول السريع:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {db.users.filter(u => u.isActive).map(user => {
              const isAdmin = user.role === 'ADMIN';
              return (
                <button
                  key={user.id}
                  onClick={() => handleQuickSelect(user.username, user.pinCode)}
                  className={`p-3 rounded-2xl border text-right transition flex items-center justify-between ${
                    isAdmin
                      ? 'bg-gold-500/15 border-gold-500/40 text-gold-300 hover:bg-gold-500/20'
                      : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{user.displayName}</span>
                    <span className="text-[10px] text-slate-400">
                      {isAdmin ? 'المدير العام' : 'حلاق'}
                    </span>
                  </div>
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-gold-400" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 pt-3 border-t border-dark-800">
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
                placeholder="اسم المستخدم"
                className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-10 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              رمز الدخول السري (PIN):
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
      </div>

      <p className="text-[11px] text-slate-600 mt-6 font-mono text-center">
        Mohamed Ramshan Barber Shop Management System • v2.0
      </p>
    </div>
  );
};
