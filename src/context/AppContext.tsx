import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DatabaseSchema, ShiftLog } from '../types';
import { dbStorage } from '../lib/db/storage';
import { soundFx } from '../lib/utils';

interface AppContextType {
  db: DatabaseSchema;
  currentUser: User | null;
  currentView: string;
  setCurrentView: (view: string) => void;
  login: (username: string, pin: string) => { success: boolean; error?: string };
  quickSwitch: (pin: string, targetUserId?: string) => { success: boolean; error?: string };
  logout: () => void;
  refreshDb: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseSchema>(dbStorage.getDb());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('login');
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = dbStorage.subscribe(newDb => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  const refreshDb = () => {
    setDb({ ...dbStorage.getDb() });
  };

  const createShiftLog = (user: User) => {
    const newShift: ShiftLog = {
      id: crypto.randomUUID(),
      employeeId: user.employeeId ?? user.id,
      employeeName: user.role === 'ADMIN' ? user.displayName : user.displayName,
      startTime: new Date().toISOString(),
    };
    dbStorage.updateDb(d => {
      // defensive guard – in case old localStorage schema lacks shiftLogs
      if (!Array.isArray(d.shiftLogs)) d.shiftLogs = [];
      d.shiftLogs.push(newShift);
    });
    setCurrentShiftId(newShift.id);
  };

  const login = (username: string, pin: string): { success: boolean; error?: string } => {
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
    createShiftLog(user);
    soundFx.playSuccess();

    if (user.role === 'EMPLOYEE') {
      setCurrentView('employee-home');
    } else {
      setCurrentView('dashboard');
    }
    return { success: true };
  };

  const quickSwitch = (pin: string, targetUserId?: string): { success: boolean; error?: string } => {
    const currentDb = dbStorage.getDb();
    const cleanPin = pin.trim();

    let user: User | undefined;
    if (targetUserId) {
      const target = currentDb.users.find(u => u.id === targetUserId);
      if (!target || !target.isActive) {
        return { success: false, error: 'هذا الحساب غير متوفر أو معطل حالياً' };
      }
      if (target.pinCode !== cleanPin) {
        return { success: false, error: `رمز الدخول (PIN) غير صحيح لحساب (${target.displayName})` };
      }
      user = target;
    } else {
      user = currentDb.users.find(u => u.pinCode === cleanPin && u.isActive);
      if (!user) {
        return { success: false, error: 'رمز الدخول (PIN) غير مسجل' };
      }
    }

    // close current user's shift
    if (currentShiftId) {
      dbStorage.updateDb(d => {
        if (!Array.isArray(d.shiftLogs)) d.shiftLogs = [];
        const log = d.shiftLogs.find(l => l.id === currentShiftId && !l.endTime);
        if (log) log.endTime = new Date().toISOString();
      });
    }

    setCurrentUser(user);
    createShiftLog(user);
    soundFx.playSuccess();

    if (user.role === 'EMPLOYEE') {
      setCurrentView('employee-home');
    } else {
      setCurrentView('dashboard');
    }
    return { success: true };
  };

  const logout = () => {
    if (currentShiftId) {
      dbStorage.updateDb(d => {
        if (!Array.isArray(d.shiftLogs)) d.shiftLogs = [];
        const log = d.shiftLogs.find(l => l.id === currentShiftId && !l.endTime);
        if (log) log.endTime = new Date().toISOString();
      });
    }
    setCurrentUser(null);
    setCurrentView('login');
    setCurrentShiftId(null);
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
