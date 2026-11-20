import { DatabaseSchema } from '../../types';
import { INITIAL_DATABASE } from './mockData';

const DB_STORAGE_KEY = 'MR_BARBERS_SIMPLE_DB_V2';

export class StorageEngine {
  private static instance: StorageEngine;
  private memoryDb: DatabaseSchema | null = null;
  private listeners: Array<(db: DatabaseSchema) => void> = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): StorageEngine {
    if (!StorageEngine.instance) {
      StorageEngine.instance = new StorageEngine();
    }
    return StorageEngine.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') {
      this.memoryDb = INITIAL_DATABASE;
      return;
    }

    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DatabaseSchema;
        if (parsed && parsed.version === 2 && Array.isArray(parsed.employees) && Array.isArray(parsed.operations)) {
          this.memoryDb = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored DB, resetting to defaults:', e);
    }

    // Default init
    this.memoryDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
  }

  public getDb(): DatabaseSchema {
    if (!this.memoryDb) {
      this.init();
    }
    return this.memoryDb!;
  }

  public updateDb(updater: (draft: DatabaseSchema) => void): DatabaseSchema {
    if (!this.memoryDb) {
      this.init();
    }
    updater(this.memoryDb!);
    this.persist();
    this.notifyListeners();
    return this.memoryDb!;
  }

  private persist(): void {
    if (typeof window === 'undefined' || !this.memoryDb) return;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.memoryDb));
    } catch (e) {
      console.error('Failed to persist database to localStorage:', e);
    }
  }

  public subscribe(listener: (db: DatabaseSchema) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    if (!this.memoryDb) return;
    const snapshot = JSON.parse(JSON.stringify(this.memoryDb));
    this.listeners.forEach(l => l(snapshot));
  }

  public exportBackup(): string {
    const db = this.getDb();
    return JSON.stringify({
      ...db,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  public restoreBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.version || !Array.isArray(parsed.employees) || !Array.isArray(parsed.operations)) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح.' };
      }

      this.memoryDb = parsed as DatabaseSchema;
      this.persist();
      this.notifyListeners();
      return { success: true, message: 'تم استعادة قاعدة البيانات بنجاح.' };
    } catch (e) {
      return { success: false, message: 'فشل في قراءة ملف النسخة الاحتياطية.' };
    }
  }

  public resetToFactory(): void {
    this.memoryDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
    this.notifyListeners();
  }
}

export const dbStorage = StorageEngine.getInstance();
