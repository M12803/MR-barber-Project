import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DatabaseSchema } from '../types';
import { dbStorage } from '../lib/db/storage';
import { soundFx } from '../lib/utils';

interface AppContextType {
  db: DatabaseSchema;
  currentUser: User | null;
  currentView: string;
  setCurrentView: (view: string) => void;
  login: (username: string, pin: string) => { success: boolean; error?: string };
  quickSwitch: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  refreshDb: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseSchema>(dbStorage.getDb());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Default to admin or first user
    const admin = dbStorage.getDb().users.find(u => u.role === 'ADMIN');
    return admin || null;
  });
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    const unsubscribe = dbStorage.subscribe(newDb => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  const refreshDb = () => {
    setDb({ ...dbStorage.getDb() });
  };

  const login = (username: string, pin: string) => {
    const currentDb = dbStorage.getDb();
    const cleanUser = username.trim().toLowerCase();
    const user = currentDb.users.find(u => u.username.toLowerCase() === cleanUser);

    if (!user) {
      return { success: false, error: 'اسم المستخدم غير موجود' };
    }
    if (!user.isActive) {
      return { success: false, error: 'هذا الحساب معطل حالياً' };
    }
    if (user.pinCode !== pin) {
      return { success: false, error: 'رمز الدخول (PIN) غير صحيح' };
    }

    setCurrentUser(user);
    soundFx.playSuccess();

    if (user.role === 'EMPLOYEE') {
      setCurrentView('employee-home');
    } else {
      setCurrentView('dashboard');
    }
    return { success: true };
  };

  const quickSwitch = (pin: string) => {
    const currentDb = dbStorage.getDb();
    const user = currentDb.users.find(u => u.pinCode === pin && u.isActive);

    if (!user) {
      return { success: false, error: 'رمز الدخول غير مسجل' };
    }

    setCurrentUser(user);
    soundFx.playSuccess();
    if (user.role === 'EMPLOYEE') {
      setCurrentView('employee-home');
    } else {
      setCurrentView('dashboard');
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    soundFx.playClick();
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        currentView,
        setCurrentView,
        login,
        quickSwitch,
        logout,
        refreshDb,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
