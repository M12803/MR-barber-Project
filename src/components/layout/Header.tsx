import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';
import { reportService } from '../../services/reportService';
import {
  Users,
  LogOut,
  Clock,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickSwitch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickSwitch }) => {
  const { currentUser, logout, db, setCurrentView } = useApp();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const summary = reportService.getDashboardSummary();
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header className="h-18 bg-dark-900/95 backdrop-blur-md border-b border-gold-500/15 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Logo */}
      <div
        className="flex items-center gap-3.5 cursor-pointer"
        onClick={() => {
          if (isAdmin) setCurrentView('dashboard');
          else setCurrentView('employee-home');
        }}
      >
        <div className="relative group">
          <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-200 shadow-gold-sm transition duration-300 group-hover:scale-105">
            <img
              src="/brand/logo.jpg"
              alt="MR Barbers Logo"
              className="w-full h-full object-cover rounded-full bg-dark-950"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-dark-900 rounded-full" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-gold-300 via-gold-500 to-amber-200 bg-clip-text text-transparent font-display">
              {db.settings.shopName}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 border border-gold-500/30">
              EST. 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            {db.settings.shopSubtitle}
          </p>
        </div>
      </div>

      {/* Center: Live Clock & Drawer Cash (for Admin) */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dark-850 border border-dark-750 text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-gold-400" />
          <span>{timeStr}</span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-dark-850 border border-gold-500/25">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-none">صافي حركة الدرج:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {formatCurrency(summary.drawerNetCash)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick User Switcher */}
        <button
          onClick={onOpenQuickSwitch}
          title="تبديل الحساب السريع"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 text-xs font-semibold transition"
        >
          <Users className="w-4 h-4 text-gold-400" />
          <span className="hidden sm:inline">تبديل الحساب</span>
        </button>

        {/* User Pill */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pr-2.5 pl-3 py-1 bg-dark-850 border border-dark-700 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold text-xs border border-gold-500/30">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-medium text-gold-400">
                {isAdmin ? 'المدير العام' : 'موظف'}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title="تسجيل الخروج"
          className="p-2 rounded-xl bg-dark-800 hover:bg-red-950/60 border border-dark-700 hover:border-red-800/80 text-slate-400 hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
