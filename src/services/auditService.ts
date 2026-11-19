import { dbStorage } from '../lib/db/storage';
import { AuditLogEntry, UserRole } from '../types';
import { generateId } from '../lib/utils';

export const auditService = {
  log(
    actorId: string,
    actorName: string,
    actorRole: UserRole,
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: string,
    metadata?: Record<string, any>
  ): void {
    const entry: AuditLogEntry = {
      id: generateId('aud'),
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      metadata,
    };

    dbStorage.updateDb(db => {
      db.auditLogs.unshift(entry);
      // Keep up to 1000 audit log entries in memory
      if (db.auditLogs.length > 1000) {
        db.auditLogs.length = 1000;
      }
    });
  },

  getAll(): AuditLogEntry[] {
    return dbStorage.getDb().auditLogs;
  },
};
