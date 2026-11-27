import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Receipt,
  FileSpreadsheet,
  Settings,
  HandCoins,
  Package,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser, db } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  // Count pending advances for Admin badge
  const pendingAdvances = db.advances.filter(a => a.status === 'PENDING').length;

  const adminNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, badge: undefined },
    { id: 'employees', label: 'الموظفون', icon: Users, badge: undefined },
    { id: 'operations', label: 'العمليات والسلف والمصاريف', icon: Receipt, badge: pendingAdvances > 0 ? pendingAdvances : undefined },
    { id: 'inventory', label: 'المخزن والمنتجات', icon: Package, badge: undefined },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: FileSpreadsheet, badge: undefined },
    { id: 'settings', label: 'الإعدادات والخدمات', icon: Settings, badge: undefined },
  ];

  const employeeNavItems = [
    { id: 'employee-home', label: 'حسابي وتسجيلاتي', icon: Scissors, badge: undefined },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <aside className="w-64 bg-dark-900 border-l border-gold-500/15 flex flex-col h-[calc(100vh-4.5rem)] sticky top-18 select-none">
      <div className="p-4 border-b border-dark-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 block mb-1">
          {isAdmin ? 'إدارة الصالون (المالك)' : 'حساب الحلاق'}
        </span>
        <p className="text-xs text-slate-400 truncate">
          {isAdmin ? 'التحكم الشامل والتقارير' : currentUser?.displayName}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group text-right',
                isActive
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/35 shadow-gold-sm'
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
      <div className="p-3.5 border-t border-dark-800 bg-dark-950/40 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>يعمل محلياً بدون إنترنت</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">
          MR Barbers System v2.0
        </p>
      </div>
    </aside>
  );
};
