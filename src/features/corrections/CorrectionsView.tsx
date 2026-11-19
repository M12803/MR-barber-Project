import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/utils';
import { transactionService } from '../../services/transactionService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FileCheck2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const CorrectionsView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminReason, setAdminReason] = useState<string>('');

  const requests = db.correctionRequests;

  const handleAction = () => {
    if (!selectedReqId || !currentUser || !actionType) return;
    if (!adminReason.trim()) {
      alert('يرجى كتابة سبب القرار الإداري');
      return;
    }

    if (actionType === 'APPROVE') {
      transactionService.approveCorrection(selectedReqId, adminReason.trim(), currentUser);
    } else {
      transactionService.rejectCorrection(selectedReqId, adminReason.trim(), currentUser);
    }

    setSelectedReqId(null);
    setActionType(null);
    setAdminReason('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-gold-400" />
          <span>طلبات التصحيح والإلغاء (Correction Requests)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          مراجعة طلبات العاملين لتعديل أو إلغاء تذاكر الخدمات وتنفيذ القيود العكسية في الخزينة
        </p>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">تاريخ الطلب</th>
                <th className="p-3.5">رقم التذكرة</th>
                <th className="p-3.5">الموظف مقدم الطلب</th>
                <th className="p-3.5">سبب طلب التصحيح</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">قرار الإدارة والسبب</th>
                <th className="p-3.5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد أي طلبات تصحيح مسجلة حالياً
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 text-slate-400 font-mono">{formatDateTime(req.requestedAt)}</td>
                    <td className="p-3.5 font-bold font-mono text-gold-400">{req.ticketNumber}</td>
                    <td className="p-3.5 font-medium">{req.employeeName}</td>
                    <td className="p-3.5 text-slate-300 max-w-[220px]">{req.requestReason}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          req.status === 'APPROVED'
                            ? 'success'
                            : req.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {req.status === 'APPROVED'
                          ? 'تم القبول والإلغاء'
                          : req.status === 'REJECTED'
                          ? 'مرفوض'
                          : 'معلق بانتظار الإدارة'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {req.adminDecisionReason || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setActionType('APPROVE');
                              setAdminReason('تمت المراجعة والتأكد من صحة طلب التصحيح');
                            }}
                          >
                            قبول وإلغاء
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setActionType('REJECT');
                              setAdminReason('البيانات صحيحة ولا تستدعي التعديل');
                            }}
                          >
                            رفض
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedReqId && (
        <Modal
          isOpen={Boolean(selectedReqId)}
          onClose={() => setSelectedReqId(null)}
          title={actionType === 'APPROVE' ? 'تأكيد قبول طلب التصحيح والإلغاء' : 'تأكيد رفض طلب التصحيح'}
          subtitle="سيتم تسجيل هذا الإجراء بصورة غير قابلة للتعديل في سجل الرقابة"
        >
          <div className="space-y-4">
            {actionType === 'APPROVE' ? (
              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  تنبيه: قبول الطلب سيجعل التذكرة بحالة (ملغاة VOIDED)، وسيتم إنشاء قيد مالي عكسي في الخزينة لسحب المبلغ المحصل نقداً إن وجد للحفاظ على توازن الدرج.
                </span>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                سبب القرار الإداري (إلزامي للرقابة):
              </label>
              <textarea
                rows={3}
                value={adminReason}
                onChange={e => setAdminReason(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelectedReqId(null)}>
                تراجع
              </Button>
              <Button
                variant={actionType === 'APPROVE' ? 'gold' : 'danger'}
                onClick={handleAction}
              >
                تأكيد وتنفيذ القرار
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
