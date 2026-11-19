import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { LockScreenModal } from '../components/layout/LockScreenModal';
import { QuickSwitchModal } from '../components/layout/QuickSwitchModal';

// Features
import { LoginView } from '../features/auth/LoginView';
import { PosTerminal } from '../features/pos/PosTerminal';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { EmployeeHome } from '../features/employee-home/EmployeeHome';
import { TransactionsView } from '../features/transactions/TransactionsView';
import { CorrectionsView } from '../features/corrections/CorrectionsView';
import { EmployeesView } from '../features/employees/EmployeesView';
import { ServicesView } from '../features/services/ServicesView';
import { AdvancesView } from '../features/advances/AdvancesView';
import { CashboxView } from '../features/cashbox/CashboxView';
import { ExpensesView } from '../features/expenses/ExpensesView';
import { ReportsView } from '../features/reports/ReportsView';
import { AuditView } from '../features/audit/AuditView';
import { SettingsView } from '../features/settings/SettingsView';

export const AppContent: React.FC = () => {
  const { currentUser, currentView } = useApp();
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);

  if (!currentUser || currentView === 'login') {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pos':
        return <PosTerminal />;
      case 'dashboard':
        return <AdminDashboard />;
      case 'employee-home':
      case 'employee-shift':
        return <EmployeeHome />;
      case 'transactions':
      case 'employee-transactions':
        return <TransactionsView />;
      case 'corrections':
        return <CorrectionsView />;
      case 'employees':
        return <EmployeesView />;
      case 'services':
        return <ServicesView />;
      case 'advances':
      case 'employee-advances':
        return <AdvancesView />;
      case 'cashbox':
        return <CashboxView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <PosTerminal />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col font-sans">
      <Header onOpenQuickSwitch={() => setIsQuickSwitchOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderCurrentView()}
        </main>
      </div>

      {/* Screen Lock Modal */}
      <LockScreenModal />

      {/* Quick Switch Modal */}
      <QuickSwitchModal
        isOpen={isQuickSwitchOpen}
        onClose={() => setIsQuickSwitchOpen(false)}
      />
    </div>
  );
};
