import React from 'react';
import { Transaction } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { db } = useApp();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">تم تسجيل التذكرة بنجاح</h3>
        <p className="text-xs text-slate-400 mb-6">تم ترحيل البيانات وحفظ المعاملة في الخزينة</p>

        {/* Thermal Receipt Paper Card */}
        <div className="w-full bg-slate-900 border border-dark-700 rounded-2xl p-5 text-right font-mono text-xs text-slate-300 shadow-inner space-y-3 print:bg-white print:text-black">
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-dark-700">
            <h4 className="font-bold text-sm text-gold-400 font-sans">{db.settings.shopName}</h4>
            <p className="text-[10px] text-slate-400">{db.settings.shopSubtitle}</p>
            <p className="text-[10px] text-slate-500 mt-1">{db.settings.phone}</p>
            <p className="text-[10px] text-slate-500">{db.settings.address}</p>
          </div>

          {/* Ticket Meta */}
          <div className="flex justify-between text-[11px] pb-2 border-b border-dark-800">
            <span>رقم التذكرة:</span>
            <span className="font-bold text-gold-300">{transaction.ticketNumber}</span>
          </div>

          <div className="flex justify-between text-[11px]">
            <span>التاريخ:</span>
            <span>{formatDateTime(transaction.createdAt)}</span>
          </div>

          <div className="flex justify-between text-[11px]">
            <span>الحلاق:</span>
            <span>{transaction.employeeName}</span>
          </div>

          {transaction.customerName && (
            <div className="flex justify-between text-[11px]">
              <span>العميل:</span>
              <span>{transaction.customerName}</span>
            </div>
          )}

          {/* Line Items */}
          <div className="pt-2 border-t border-dashed border-dark-700 space-y-2">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <span className="truncate max-w-[180px]">{item.serviceName}</span>
                <span className="font-bold">{formatCurrency(item.finalPrice)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-dashed border-dark-700 space-y-1.5">
            {transaction.discountTotal > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>الخصم المطبق:</span>
                <span>-{formatCurrency(transaction.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gold-400 pt-1">
              <span>الإجمالي المستحق:</span>
              <span>{formatCurrency(transaction.collectedAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>طريقة الدفع:</span>
              <span>{transaction.paymentMethod}</span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center pt-3 border-t border-dashed border-dark-700 text-[10px] text-slate-400 whitespace-pre-line font-sans">
            {db.settings.receiptFooter}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <Button variant="secondary" onClick={onClose}>
            إغلاق ومتابعة
          </Button>
          <Button variant="gold" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-1.5" />
            طباعة الإيصال
          </Button>
        </div>
      </div>
    </Modal>
  );
};
