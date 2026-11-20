import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { QuickSwitchModal } from '../components/layout/QuickSwitchModal';

// Features
import { LoginView } from '../features/auth/LoginView';
import { EmployeeHome } from '../features/employee-home/EmployeeHome';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { EmployeesView } from '../features/employees/EmployeesView';
import { OperationsView } from '../features/operations/OperationsView';
import { ReportsView } from '../features/reports/ReportsView';
import { SettingsView } from '../features/settings/SettingsView';

export const AppContent: React.FC = () => {
  const { currentUser, currentView } = useApp();
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);

  if (!currentUser || currentView === 'login') {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    // If employee is logged in, they strictly view EmployeeHome
    if (currentUser.role === 'EMPLOYEE') {
      return <EmployeeHome />;
    }

    // Admin views
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'employees':
        return <EmployeesView />;
      case 'operations':
        return <OperationsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AdminDashboard />;
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

      {/* Quick Switch Modal */}
      <QuickSwitchModal
        isOpen={isQuickSwitchOpen}
        onClose={() => setIsQuickSwitchOpen(false)}
      />
    </div>
  );
};
