import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DatabaseSchema, Shift } from '../types';
import { dbStorage } from '../lib/db/storage';
import { authService } from '../services/authService';
import { cashboxService } from '../services/cashboxService';
import { soundFx } from '../lib/utils';

interface AppContextType {
  db: DatabaseSchema;
  currentUser: User | null;
  activeShift: Shift | undefined;
  currentView: string;
  isLocked: boolean;
  setCurrentView: (view: string) => void;
  login: (username: string, pin: string) => { success: boolean; error?: string };
  quickSwitch: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => { success: boolean; error?: string };
  refreshDb: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseSchema>(dbStorage.getDb());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Default to the first admin user for immediate demo access if present
    const initial = dbStorage.getDb().users.find(u => u.role === 'ADMIN');
    return initial || null;
  });
  const [currentView, setCurrentView] = useState<string>('pos');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = dbStorage.subscribe(newDb => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  // Compute active shift for current logged in user
  const activeShift = currentUser?.employeeId 
    ? cashboxService.getActiveShift(currentUser.employeeId)
    : undefined;

  const refreshDb = () => {
    setDb({ ...dbStorage.getDb() });
  };

  const login = (username: string, pin: string) => {
    const res = authService.loginWithUsernameAndPin(username, pin);
    if (res.user) {
      setCurrentUser(res.user);
      setIsLocked(false);
      soundFx.playClick();
      // If employee, redirect to POS or employee home
      if (res.user.role === 'EMPLOYEE') {
        setCurrentView('pos');
      } else {
        setCurrentView('dashboard');
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const quickSwitch = (pin: string) => {
    const res = authService.quickPinSwitch(pin);
    if (res.user) {
      setCurrentUser(res.user);
      setIsLocked(false);
      soundFx.playSuccess();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setIsLocked(false);
    soundFx.playClick();
  };

  const lockScreen = () => {
    setIsLocked(true);
    soundFx.playClick();
  };

  const unlockScreen = (pin: string) => {
    if (!currentUser) return { success: false, error: 'لا يوجد مستخدم مسجل' };
    if (currentUser.pinCode === pin) {
      setIsLocked(false);
      soundFx.playSuccess();
      return { success: true };
    }
    // Also allow master admin pin to unlock
    const admin = db.users.find(u => u.role === 'ADMIN');
    if (admin && admin.pinCode === pin) {
      setIsLocked(false);
      soundFx.playSuccess();
      return { success: true };
    }
    return { success: false, error: 'رمز الدخول غير صحيح' };
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        activeShift,
        currentView,
        isLocked,
        setCurrentView,
        login,
        quickSwitch,
        logout,
        lockScreen,
        unlockScreen,
        refreshDb,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
