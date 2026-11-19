import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Lock, User, ShieldCheck, UserCheck, KeyRound, Scissors } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { db, login } = useApp();
  const [username, setUsername] = useState<string>('admin');
  const [pin, setPin] = useState<string>('1234');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    }, 200);
  };

  const handleQuickLogin = (uname: string, userPin: string) => {
    setUsername(uname);
    setPin(userPin);
    login(uname, userPin);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gold Glows */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-dark-900 border border-gold-500/25 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center">
        {/* Brand Logo with Gold Rim */}
        <div className="relative group mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-200 shadow-gold-md transition duration-300 group-hover:scale-105">
            <img
              src={db.settings.logoUrl || '/brand/logo.jpg'}
              alt="MR Barbers"
              className="w-full h-full object-cover rounded-full bg-dark-950"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight bg-gradient-to-r from-gold-300 via-gold-500 to-amber-200 bg-clip-text text-transparent text-center">
          {db.settings.shopName}
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          {db.settings.shopSubtitle}
        </p>

        {error && (
          <div className="w-full bg-red-950/60 border border-red-900/80 text-red-300 text-xs px-4 py-2.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم المستخدم أو كود الموظف:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin أو كود الحلاق"
                className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-100 font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full mt-2 shadow-gold-md"
            isLoading={isLoading}
          >
            <span>تسجيل الدخول للنظام</span>
          </Button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="w-full mt-8 pt-5 border-t border-dark-800">
          <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center">
            دخول تجريبي سريع للمعاينة (بنقرة واحدة):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin', '1234')}
              className="p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 hover:border-gold-500/40 text-right transition"
            >
              <div className="flex items-center gap-1.5 text-gold-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حساب المالك (Admin)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">PIN: 1234</span>
            </button>

            <button
              onClick={() => handleQuickLogin('ahmed', '1111')}
              className="p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 hover:border-gold-500/40 text-right transition"
            >
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                <Scissors className="w-3.5 h-3.5 text-gold-400" />
                <span>أحمد شريف (حلاق)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">PIN: 1111</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Info */}
      <p className="text-[11px] text-slate-600 mt-6 font-mono text-center">
        Mohamed Ramshan Barber Shop Management System • v1.0 • Offline Ready
      </p>
    </div>
  );
};
