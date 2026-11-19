import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { advanceService } from '../../services/advanceService';
import { AdvanceRequest, PaymentMethod } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { HandCoins, Check, X, DollarSign, Calendar } from 'lucide-react';

export const AdvancesView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [selectedAdv, setSelectedAdv] = useState<AdvanceRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'DISBURSE' | 'REPAY' | null>(null);

  // Action fields
  const [amountInput, setAmountInput] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [installmentsCount, setInstallmentsCount] = useState<string>('2');

  const advances = db.advanceRequests;

  const totalOutstanding = advances
    .filter(a => a.status === 'DISBURSED' || a.status === 'PARTIALLY_REPAID')
    .reduce((s, a) => s + a.remainingBalance, 0);

  const handleExecuteAction = () => {
    if (!selectedAdv || !currentUser || !actionType) return;

    if (actionType === 'APPROVE') {
      const amt = Number(amountInput) || selectedAdv.requestedAmount;
      advanceService.approveAdvance(selectedAdv.id, amt, currentUser, actionNotes);
    } else if (actionType === 'REJECT') {
      if (!actionNotes.trim()) {
        alert('يرجى كتابة سبب الرفض');
        return;
      }
      advanceService.rejectAdvance(selectedAdv.id, currentUser, actionNotes);
    } else if (actionType === 'DISBURSE') {
      advanceService.disburseAdvance(
        selectedAdv.id,
        paymentMethod,
        Number(installmentsCount) || 1,
        currentUser
      );
    } else if (actionType === 'REPAY') {
      const amt = Number(amountInput);
      if (!amt || amt <= 0) {
        alert('يرجى تحديد مبلغ السداد');
        return;
      }
      advanceService.recordRepayment(
        selectedAdv.id,
        amt,
        paymentMethod,
        currentUser,
        actionNotes
      );
    }

    setSelectedAdv(null);
    setActionType(null);
    setAmountInput('');
    setActionNotes('');
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-gold-400" />
            <span>إدارة السلف والأقساط (Staff Advances & Installments)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            دورة حياة السلف: الطلب ← الاعتماد ← الصرف المالي ← جدولة الأقساط ← السداد والتسوية
          </p>
        </div>

        <div className="bg-dark-900 border border-dark-800 px-4 py-2 rounded-2xl flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-400 block">إجمالي مديونيات السلف الحالية</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-850 text-slate-400 font-semibold border-b border-dark-750">
              <tr>
                <th className="p-3.5">تاريخ الطلب</th>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">المبلغ المطلوب</th>
                <th className="p-3.5">المعتمد / المصروف</th>
                <th className="p-3.5">المتبقي كمديونية</th>
                <th className="p-3.5">السبب</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد أي سلف مسجلة
                  </td>
                </tr>
              ) : (
                advances.map(adv => (
                  <tr key={adv.id} className="hover:bg-dark-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">{formatDateTime(adv.requestDate)}</td>
                    <td className="p-3.5 font-bold">{adv.employeeName}</td>
                    <td className="p-3.5 font-mono">{formatCurrency(adv.requestedAmount)}</td>
                    <td className="p-3.5 font-mono text-gold-400">
                      {adv.disbursedAmount ? formatCurrency(adv.disbursedAmount) : adv.approvedAmount ? `${formatCurrency(adv.approvedAmount)} (معتمد)` : '-'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {formatCurrency(adv.remainingBalance)}
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-[200px] truncate">{adv.reason}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          adv.status === 'SETTLED'
                            ? 'success'
                            : adv.status === 'DISBURSED' || adv.status === 'PARTIALLY_REPAID'
                            ? 'warning'
                            : adv.status === 'REJECTED'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {adv.status === 'PENDING'
                          ? 'بانتظار القرار'
                          : adv.status === 'APPROVED'
                          ? 'معتمد (بانتظار الصرف)'
                          : adv.status === 'PARTIALLY_APPROVED'
                          ? 'معتمد جزئياً'
                          : adv.status === 'REJECTED'
                          ? 'مرفوض'
                          : adv.status === 'DISBURSED'
                          ? 'مصروف ومستحق'
                          : adv.status === 'PARTIALLY_REPAID'
                          ? 'سداد جزئي'
                          : 'مسدد بالكامل'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Pending -> Approve / Reject */}
                        {adv.status === 'PENDING' && (
                          <>
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => {
                                setSelectedAdv(adv);
                                setActionType('APPROVE');
                                setAmountInput(String(adv.requestedAmount));
                              }}
                            >
                              اعتماد
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedAdv(adv);
                                setActionType('REJECT');
                              }}
                            >
                              رفض
                            </Button>
                          </>
                        )}

                        {/* Approved -> Disburse */}
                        {(adv.status === 'APPROVED' || adv.status === 'PARTIALLY_APPROVED') && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setSelectedAdv(adv);
                              setActionType('DISBURSE');
                            }}
                          >
                            صرف نقدي
                          </Button>
                        )}

                        {/* Disbursed / Partially Repaid -> Record Repayment */}
                        {(adv.status === 'DISBURSED' || adv.status === 'PARTIALLY_REPAID') && (
                          <Button
                            variant="outline-gold"
                            size="sm"
                            onClick={() => {
                              setSelectedAdv(adv);
                              setActionType('REPAY');
                              setAmountInput(String(Math.min(500, adv.remainingBalance)));
                            }}
                          >
                            تسجيل سداد
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision / Action Modal */}
      {selectedAdv && actionType && (
        <Modal
          isOpen={Boolean(selectedAdv && actionType)}
          onClose={() => {
            setSelectedAdv(null);
            setActionType(null);
          }}
          title={
            actionType === 'APPROVE'
              ? `اعتماد سلفة الموظف: ${selectedAdv.employeeName}`
              : actionType === 'REJECT'
              ? `رفض سلفة: ${selectedAdv.employeeName}`
              : actionType === 'DISBURSE'
              ? `صرف السلفة وتسجيل خروج نقدية من الخزينة`
              : `تسجيل سداد دفعة من السلفة`
          }
        >
          <div className="space-y-4 text-xs">
            {actionType === 'APPROVE' && (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    المبلغ المعتمد (ج.م):
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    يمكنك اعتماد نفس المبلغ أو تخفيضه كاعتماد جزئي
                  </span>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ملاحظات الاعتماد:</label>
                  <input
                    type="text"
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    placeholder="ملاحظات توضيحية..."
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </>
            )}

            {actionType === 'REJECT' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  سبب الرفض (إلزامي):
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="اكتب سبب الرفض للموظف ولأغراض الرقابة..."
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>
            )}

            {actionType === 'DISBURSE' && (
              <>
                <div className="p-3 bg-gold-500/10 border border-gold-500/30 rounded-xl">
                  <span className="text-slate-400 block">المبلغ المعتمد للصرف:</span>
                  <span className="text-lg font-bold text-gold-400 font-mono">
                    {formatCurrency(selectedAdv.approvedAmount || selectedAdv.requestedAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">طريقة الصرف:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
                  >
                    <option value="CASH">نقداً من الخزينة (يسجل خصم فوري من الدرج)</option>
                    <option value="INSTAPAY">تحويل انستاباي / بنكي</option>
                    <option value="VODAFONE_CASH">محفظة فودافون كاش</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    عدد أقساط السداد المقترحة:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={installmentsCount}
                    onChange={e => setInstallmentsCount(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </>
            )}

            {actionType === 'REPAY' && (
              <>
                <div className="p-3 bg-dark-850 rounded-xl border border-dark-750 flex justify-between">
                  <span className="text-slate-400">المديونية المتبقية:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(selectedAdv.remainingBalance)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    مبلغ السداد المدفوع الآن (ج.م):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAdv.remainingBalance}
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">طريقة السداد:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
                  >
                    <option value="CASH">نقداً في الخزينة (يضاف إيراد للدرج)</option>
                    <option value="INSTAPAY">تحويل انستاباي</option>
                    <option value="OTHER">خصم من العمولة والراتب</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedAdv(null);
                  setActionType(null);
                }}
              >
                إلغاء
              </Button>
              <Button variant="gold" onClick={handleExecuteAction}>
                تأكيد الإجراء
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
