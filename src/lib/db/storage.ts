import { DatabaseSchema } from '../../types';
import { INITIAL_DATABASE } from './mockData';

const DB_STORAGE_KEY = 'MR_BARBERS_DB_V1';

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
        // Verify schema version
        if (parsed && parsed.version && parsed.settings) {
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

  /**
   * Export complete database backup as a JSON string
   */
  public exportBackup(): string {
    const db = this.getDb();
    const backupPayload = {
      ...db,
      exportedAt: new Date().toISOString(),
      checksum: 'VALID_' + Date.now().toString(36),
    };
    return JSON.stringify(backupPayload, null, 2);
  }

  /**
   * Restore database from JSON backup string with validation
   */
  public restoreBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.version || !parsed.settings || !Array.isArray(parsed.users) || !Array.isArray(parsed.services)) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف.' };
      }

      this.memoryDb = parsed as DatabaseSchema;
      this.memoryDb.lastBackupDate = new Date().toISOString();
      this.persist();
      this.notifyListeners();

      return { success: true, message: 'تم استعادة قاعدة البيانات بنجاح.' };
    } catch (e) {
      return { success: false, message: 'فشل في قراءة ملف النسخة الاحتياطية.' };
    }
  }

  /**
   * Reset database to factory demo state
   */
  public resetToFactory(): void {
    this.memoryDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
    this.notifyListeners();
  }
}

export const dbStorage = StorageEngine.getInstance();
