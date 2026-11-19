import { dbStorage } from '../lib/db/storage';
import { User } from '../types';
import { auditService } from './auditService';
import { generateId } from '../lib/utils';

export const authService = {
  loginWithUsernameAndPin(username: string, pin: string): { user: User | null; error?: string } {
    const db = dbStorage.getDb();
    const cleanUsername = username.trim().toLowerCase();
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return { user: null, error: 'اسم المستخدم غير موجود' };
    }

    if (!user.isActive) {
      return { user: null, error: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة الصالون' };
    }

    if (user.pinCode !== pin) {
      return { user: null, error: 'رمز الدخول (PIN) غير صحيح' };
    }

    // Update lastLogin
    dbStorage.updateDb(d => {
      const u = d.users.find(x => x.id === user.id);
      if (u) u.lastLogin = new Date().toISOString();
    });

    auditService.log(
      user.id,
      user.displayName,
      user.role,
      'USER_LOGIN',
      'AUTH',
      user.id,
      `تسجيل دخول ناجح للمستخدم: ${user.displayName}`
    );

    return { user };
  },

  quickPinSwitch(pin: string): { user: User | null; error?: string } {
    const db = dbStorage.getDb();
    const user = db.users.find(u => u.pinCode === pin && u.isActive);

    if (!user) {
      return { user: null, error: 'رمز PIN غير مسجل لأي مستخدم نشط' };
    }

    dbStorage.updateDb(d => {
      const u = d.users.find(x => x.id === user.id);
      if (u) u.lastLogin = new Date().toISOString();
    });

    auditService.log(
      user.id,
      user.displayName,
      user.role,
      'QUICK_SWITCH_LOGIN',
      'AUTH',
      user.id,
      `تبديل سريع للمستخدم عبر PIN: ${user.displayName}`
    );

    return { user };
  },

  getAllUsers(): User[] {
    return dbStorage.getDb().users;
  },

  addUser(user: Omit<User, 'id' | 'createdAt'>, actorUser: User): User {
    const newUser: User = {
      ...user,
      id: generateId('usr'),
      createdAt: new Date().toISOString(),
    };

    dbStorage.updateDb(db => {
      db.users.push(newUser);
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'CREATE_USER',
      'EMPLOYEE',
      newUser.id,
      `إنشاء حساب مستخدم جديد: ${newUser.displayName} (${newUser.username})`
    );

    return newUser;
  },

  updateUser(id: string, updates: Partial<User>, actorUser: User): void {
    dbStorage.updateDb(db => {
      const idx = db.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updates };
      }
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'UPDATE_USER',
      'EMPLOYEE',
      id,
      `تعديل بيانات المستخدم: ${id}`
    );
  },

  toggleUserActive(id: string, actorUser: User): void {
    let newStatus = false;
    dbStorage.updateDb(db => {
      const u = db.users.find(x => x.id === id);
      if (u) {
        u.isActive = !u.isActive;
        newStatus = u.isActive;
      }
    });

    auditService.log(
      actorUser.id,
      actorUser.displayName,
      actorUser.role,
      'TOGGLE_USER_STATUS',
      'EMPLOYEE',
      id,
      `تغيير حالة نشاط الحساب إلى: ${newStatus ? 'نشط' : 'معطل'}`
    );
  },
};
