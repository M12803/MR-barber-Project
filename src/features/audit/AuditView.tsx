import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ShieldAlert, Search, Filter, ShieldCheck } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { db } = useApp();
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  const logs = db.auditLogs.filter(log => {
    if (filterType !== 'all' && log.entityType !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gold-400" />
            <span>سجل الرقابة والأمان (Security & Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل غير قابل للتعديل يوثق كل عملية مالية وإدارية لحماية حقوق المالك والعاملين
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-dark-900 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Append-Only Immutable Ledger</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في سجل الأحداث والمستخدمين..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-dark-850 border border-dark-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-gold-500/50"
          >
            <option value="all">جميع أنواع الأحداث</option>
            <option value="TRANSACTION">عمليات وتذاكر</option>
            <option value="ADVANCE">سلف وأقساط</option>
            <option value="EXPENSE">مصروفات</option>
            <option value="SHIFT">ورديات وخزينة</option>
            <option value="EMPLOYEE">عاملين وحسابات</option>
            <option value="SERVICE">خدمات وأسعار</option>
            <option value="AUTH">تسجيل دخول وأمان</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">المستخدم المسؤول</th>
                <th className="p-3.5">الدور</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">رمز الحدث</th>
                <th className="p-3.5">التفاصيل والبيان الرقابي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200 font-mono">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-dark-850/50 transition">
                  <td className="p-3.5 text-slate-400">{formatDateTime(log.timestamp)}</td>
                  <td className="p-3.5 font-bold font-sans text-slate-100">{log.actorName}</td>
                  <td className="p-3.5">
                    <Badge variant={log.actorRole === 'ADMIN' ? 'gold' : 'neutral'}>
                      {log.actorRole}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-gold-400">{log.entityType}</td>
                  <td className="p-3.5 text-slate-300 font-semibold">{log.action}</td>
                  <td className="p-3.5 text-slate-300 font-sans max-w-[350px]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
