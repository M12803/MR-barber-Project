import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scissors,
  LayoutDashboard,
  Users,
  Sparkles,
  Receipt,
  HandCoins,
  Wallet,
  ArrowDownCircle,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Clock,
  History,
  FileCheck2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser, db } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  // Count pending items for badges
  const pendingCorrections = db.correctionRequests.filter(r => r.status === 'PENDING').length;
  const pendingAdvances = db.advanceRequests.filter(a => a.status === 'PENDING').length;

  const adminNavItems = [
    { id: 'pos', label: 'نقطة البيع (POS)', icon: Scissors, badge: undefined },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, badge: undefined },
    { id: 'transactions', label: 'سجل التذاكر', icon: Receipt, badge: undefined },
    { id: 'corrections', label: 'طلبات التعديل', icon: FileCheck2, badge: pendingCorrections > 0 ? pendingCorrections : undefined },
    { id: 'employees', label: 'فريق العمل والعمولات', icon: Users, badge: undefined },
    { id: 'services', label: 'قائمة الخدمات والأسعار', icon: Sparkles, badge: undefined },
    { id: 'advances', label: 'السلف والأقساط', icon: HandCoins, badge: pendingAdvances > 0 ? pendingAdvances : undefined },
    { id: 'cashbox', label: 'الخزينة والورديات', icon: Wallet, badge: undefined },
    { id: 'expenses', label: 'المصروفات', icon: ArrowDownCircle, badge: undefined },
    { id: 'reports', label: 'التقارير وتصدير Excel', icon: FileSpreadsheet, badge: undefined },
    { id: 'audit', label: 'سجل الرقابة والأمان', icon: ShieldAlert, badge: undefined },
    { id: 'settings', label: 'الإعدادات والنسخ الاحتياطي', icon: Settings, badge: undefined },
  ];

  const employeeNavItems = [
    { id: 'pos', label: 'نقطة البيع (تذكرة جديدة)', icon: Scissors, badge: undefined },
    { id: 'employee-home', label: 'إحصائياتي اليوم', icon: LayoutDashboard, badge: undefined },
    { id: 'employee-transactions', label: 'تذاكري السابقة', icon: History, badge: undefined },
    { id: 'employee-advances', label: 'سلفي وحسابي', icon: HandCoins, badge: undefined },
    { id: 'employee-shift', label: 'تسجيل الوردية', icon: Clock, badge: undefined },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <aside className="w-64 bg-dark-900 border-l border-gold-500/15 flex flex-col h-[calc(100vh-4.5rem)] sticky top-18 select-none">
      <div className="p-4 border-b border-dark-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400/80 block mb-1">
          {isAdmin ? 'إدارة النظام والتشغيل' : 'بوابة الموظف'}
        </span>
        <p className="text-xs text-slate-400 truncate">
          {isAdmin ? 'التحكم الشامل والتقارير' : `الموظف: ${currentUser?.displayName}`}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group text-right',
                isActive
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30 shadow-gold-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-dark-800/80 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-gold-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-dark-950 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-dark-800 bg-dark-950/40 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>يعمل محلياً (Offline First)</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">
          v1.0.0 | نظام رمشان للصالونات
        </p>
      </div>
    </aside>
  );
};
